import { prisma } from '@/lib/prisma';
import { recordAuditLog } from './audit';
import { AccountAdmissionError } from './errors';
import { createDatabaseSession } from './session';
import { normalizeAccountEmail } from './policy';
import { hashPassword, verifyPassword } from './passwords';
import { createOpaqueToken, hashOpaqueToken } from './tokens';

const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const DUMMY_PASSWORD_HASH =
  'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

export async function authenticatePassword(input: {
  email: string;
  password: string;
}) {
  const normalizedEmail = normalizeAccountEmail(input.email);
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { passwordCredential: true },
  });

  if (!user || user.status !== 'active') return null;

  if (user.passwordCredential?.passwordHash) {
    const valid = await verifyPassword(
      input.password,
      user.passwordCredential.passwordHash
    );
    if (!valid) return null;
  } else if (user.passwordHash) {
    const valid =
      user.passwordHash.startsWith('scrypt$')
        ? await verifyPassword(input.password, user.passwordHash)
        : user.passwordHash === input.password;
    if (!valid) return null;
  } else {
    await verifyPassword(input.password, DUMMY_PASSWORD_HASH);
    return null;
  }

  await recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'auth.signin.success',
    targetType: 'User',
    targetId: user.id,
    metadata: { method: 'credentials' },
  });

  const session = await createDatabaseSession(user.id);
  return { user, session };
}

export async function requestPasswordReset(email: string) {
  const normalizedEmail = normalizeAccountEmail(email);
  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { passwordCredential: true },
  });
  if (!user?.email || !user.passwordCredential) return null;

  await prisma.passwordCredential.update({
    where: { userId: user.id },
    data: {
      resetTokenHash: tokenHash,
      resetExpiresAt: expiresAt,
    },
  });

  await recordAuditLog({
    actorId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'auth.password.reset_requested',
    targetType: 'User',
    targetId: user.id,
  });

  return { token, email: user.email, expiresAt };
}

export async function resetPassword(input: {
  token: string;
  password: string;
}) {
  const tokenHash = hashOpaqueToken(input.token);
  const passwordHash = await hashPassword(input.password);
  const now = new Date();

  const credential = await prisma.passwordCredential.findUnique({
    where: { resetTokenHash: tokenHash },
    select: { id: true, userId: true, resetExpiresAt: true },
  });

  if (!credential) {
    throw new AccountAdmissionError(
      410,
      'invalid_reset',
      'This password reset link is invalid or no longer active.'
    );
  }

  if (!credential.resetExpiresAt || credential.resetExpiresAt <= now) {
    await prisma.passwordCredential.update({
      where: { id: credential.id },
      data: { resetTokenHash: null, resetExpiresAt: null },
    });
    throw new AccountAdmissionError(
      410,
      'expired',
      'This password reset link has expired.'
    );
  }

  await prisma.passwordCredential.update({
    where: { id: credential.id },
    data: {
      passwordHash,
      passwordChangedAt: now,
      resetTokenHash: null,
      resetExpiresAt: null,
    },
  });
  await prisma.user.update({
    where: { id: credential.userId },
    data: { passwordHash },
  });
  await prisma.session.deleteMany({ where: { userId: credential.userId } });

  await recordAuditLog({
    actorId: credential.userId,
    action: 'auth.password.reset_completed',
    targetType: 'User',
    targetId: credential.userId,
  });

  return { userId: credential.userId };
}
