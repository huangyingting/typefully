import { Prisma, type AccountInvitation } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { recordAuditLog } from './audit';
import { AccountAdmissionError } from './errors';
import {
  type AccountRole,
  isValidAccountEmail,
  normalizeAccountEmail,
  normalizeAccountRole,
} from './policy';
import { createOpaqueToken, hashOpaqueToken } from './tokens';

const DEFAULT_INVITATION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type CreateAccountInvitationInput = {
  email: string;
  role?: string;
  invitedById?: string;
  createdByUserId?: string;
  createdByEmail?: string;
  expiresAt?: Date;
};

export type AccountInvitationGrant = {
  invitation: AccountInvitation & { status: string };
  token: string;
  inviteUrl: string;
  delivery: { queued: boolean; reason?: string };
};

export type PublicInvitationView = {
  id: string;
  status: 'pending' | 'accepted' | 'revoked' | 'expired' | 'invalid';
  maskedEmail: string | null;
  email?: string;
  role?: AccountRole;
  expiresAt: Date | null;
};

function invitationExpiry(now: Date, requested?: Date): Date {
  const expiresAt =
    requested ?? new Date(now.getTime() + DEFAULT_INVITATION_TTL_MS);
  if (expiresAt.getTime() <= now.getTime()) {
    throw new AccountAdmissionError(
      400,
      'invalid_expiry',
      'Invitation expiry must be in the future.'
    );
  }
  return expiresAt;
}

export function maskEmail(email: string): string {
  const [local = '', domain = ''] = email.split('@');
  if (!domain) return '***';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

function isUniqueConflict(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

export async function expirePendingInvitations(now = new Date()): Promise<number> {
  const result = await prisma.accountInvitation.updateMany({
    where: {
      status: 'PENDING',
      expiresAt: { lte: now },
    },
    data: {
      status: 'EXPIRED',
      activeForEmail: null,
      tokenHash: null,
    },
  });
  return result.count;
}

export async function createAccountInvitation(
  input: CreateAccountInvitationInput
): Promise<AccountInvitationGrant> {
  const normalizedEmail = normalizeAccountEmail(input.email);
  if (!isValidAccountEmail(input.email)) {
    throw new AccountAdmissionError(
      400,
      'invalid_email',
      'Enter a valid email address.'
    );
  }

  const role = normalizeAccountRole(input.role);
  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const now = new Date();
  const expiresAt = invitationExpiry(now, input.expiresAt);

  try {
    await prisma.accountInvitation.updateMany({
      where: {
        activeForEmail: normalizedEmail,
        status: 'PENDING',
        expiresAt: { lte: now },
      },
      data: {
        status: 'EXPIRED',
        activeForEmail: null,
        tokenHash: null,
      },
    });

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existingUser) {
      throw new AccountAdmissionError(
        409,
        'already_member',
        'A Typefully account already exists for this email.'
      );
    }

    const active = await prisma.accountInvitation.findUnique({
      where: { activeForEmail: normalizedEmail },
      select: { id: true },
    });
    if (active) {
      throw new AccountAdmissionError(
        409,
        'invitation_exists',
        'An active invitation already exists for this email.'
      );
    }

    let inviterId = input.invitedById || input.createdByUserId;
    let inviterEmail: string | null = input.createdByEmail || null;
    if (!inviterId) {
      const adminUser = await prisma.user.findFirst({
        where: { role: 'Admin' },
      });
      inviterId = adminUser?.id;
      inviterEmail = adminUser?.email || null;
    } else if (!inviterEmail) {
      const u = await prisma.user.findUnique({ where: { id: inviterId } });
      inviterEmail = u?.email || null;
    }

    const invitation = await prisma.accountInvitation.create({
      data: {
        email: input.email.trim(),
        normalizedEmail,
        activeForEmail: normalizedEmail,
        tokenHash,
        role,
        invitedById: inviterId || null,
        expiresAt,
      },
    });

    await prisma.accountEmailOutbox.create({
      data: {
        invitationId: invitation.id,
        payload: JSON.stringify({
          type: 'account_invitation',
          email: invitation.email,
          role: invitation.role,
          expiresAt: invitation.expiresAt.toISOString(),
        }),
        status: 'pending',
        expiresAt: invitation.expiresAt,
      },
    });

    await recordAuditLog({
      actorId: inviterId || null,
      actorEmail: inviterEmail || 'admin@typefully.local',
      actorRole: 'Admin',
      action: 'account.invitation.create',
      targetType: 'AccountInvitation',
      targetId: invitation.id,
      metadata: {
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt.toISOString(),
      },
    });

    return {
      invitation: { ...invitation, status: invitation.status.toLowerCase() },
      token,
      inviteUrl: `/invite/${token}`,
      delivery: { queued: true },
    };
  } catch (error) {
    if (isUniqueConflict(error)) {
      throw new AccountAdmissionError(
        409,
        'invitation_exists',
        'An active invitation already exists for this email.'
      );
    }
    throw error;
  }
}

export async function inspectAccountInvitation(
  token: string,
  now = new Date()
): Promise<PublicInvitationView> {
  const tokenHash = hashOpaqueToken(token);
  const invitation = await prisma.accountInvitation.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!invitation) {
    return { id: '', status: 'invalid', maskedEmail: null, expiresAt: null };
  }

  if (invitation.status === 'PENDING' && invitation.expiresAt <= now) {
    await prisma.accountInvitation.updateMany({
      where: { id: invitation.id, status: 'PENDING', tokenHash },
      data: {
        status: 'EXPIRED',
        activeForEmail: null,
        tokenHash: null,
      },
    });
    return {
      id: invitation.id,
      status: 'expired',
      maskedEmail: maskEmail(invitation.email),
      role: normalizeAccountRole(invitation.role),
      expiresAt: invitation.expiresAt,
    };
  }

  return {
    id: invitation.id,
    status: invitation.status.toLowerCase() as PublicInvitationView['status'],
    maskedEmail: maskEmail(invitation.email),
    email: invitation.email,
    role: normalizeAccountRole(invitation.role),
    expiresAt: invitation.expiresAt,
  };
}

export async function revokeAccountInvitation(
  id: string,
  actorId?: string | null,
  actorEmail?: string | null
): Promise<AccountInvitation> {
  const now = new Date();
  const invitation = await prisma.accountInvitation.findUnique({
    where: { id },
  });
  if (!invitation) {
    throw new AccountAdmissionError(404, 'not_found', 'Invitation not found.');
  }
  if (invitation.status === 'REVOKED') {
    return invitation;
  }
  if (invitation.status !== 'PENDING') {
    throw new AccountAdmissionError(
      409,
      'invalid_transition',
      'Only a pending invitation can be revoked.'
    );
  }

  const updated = await prisma.accountInvitation.update({
    where: { id },
    data: {
      status: 'REVOKED',
      revokedAt: now,
      activeForEmail: null,
      tokenHash: null,
    },
  });

  await recordAuditLog({
    actorId: actorId || invitation.invitedById || null,
    actorEmail: actorEmail || 'admin@typefully.local',
    actorRole: 'Admin',
    action: 'account.invitation.revoke',
    targetType: 'AccountInvitation',
    targetId: updated.id,
    metadata: {
      email: updated.email,
      role: updated.role,
      revokedAt: now.toISOString(),
    },
  });

  return { ...updated, status: updated.status.toLowerCase() };
}

export async function rotateAccountInvitation(
  id: string,
  expiresAt?: Date,
  actorId?: string | null,
  actorEmail?: string | null
): Promise<AccountInvitationGrant> {
  const token = createOpaqueToken();
  const tokenHash = hashOpaqueToken(token);
  const now = new Date();
  const nextExpiry = invitationExpiry(now, expiresAt);

  const invitation = await prisma.accountInvitation.findUnique({
    where: { id },
  });
  if (!invitation) {
    throw new AccountAdmissionError(404, 'not_found', 'Invitation not found.');
  }
  if (invitation.status !== 'PENDING' || invitation.expiresAt <= now) {
    throw new AccountAdmissionError(
      409,
      'invalid_transition',
      'Only a pending invitation can be rotated.'
    );
  }

  const updated = await prisma.accountInvitation.update({
    where: { id },
    data: { tokenHash, expiresAt: nextExpiry },
  });

  await recordAuditLog({
    actorId: actorId || invitation.invitedById || null,
    actorEmail: actorEmail || 'admin@typefully.local',
    actorRole: 'Admin',
    action: 'account.invitation.rotate',
    targetType: 'AccountInvitation',
    targetId: updated.id,
    metadata: {
      email: updated.email,
      role: updated.role,
      expiresAt: nextExpiry.toISOString(),
    },
  });

  return {
    invitation: { ...updated, status: updated.status.toLowerCase() },
    token,
    inviteUrl: `/invite/${token}`,
    delivery: { queued: true },
  };
}

export async function listAccountInvitations() {
  await expirePendingInvitations();
  const rows = await prisma.accountInvitation.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      expiresAt: true,
      acceptedAt: true,
      revokedAt: true,
      createdAt: true,
      invitedBy: {
        select: { id: true, name: true, email: true },
      },
      acceptedBy: {
        select: { id: true, name: true, email: true },
      },
    },
  });
  return rows.map((r) => ({ ...r, status: r.status.toLowerCase() }));
}
