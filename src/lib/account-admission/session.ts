import { randomBytes } from 'node:crypto';
import type { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashOpaqueToken } from './tokens';

export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
export const SESSION_UPDATE_AGE_SECONDS = 24 * 60 * 60;

export const SESSION_COOKIES = [
  'next-auth.session-token',
  '__Secure-next-auth.session-token',
] as const;

export function isHttpsRequest(request?: Request): boolean {
  if (request) {
    const forwardedProto = request.headers.get('x-forwarded-proto');
    if (forwardedProto) {
      return forwardedProto.split(',')[0].trim().toLowerCase() === 'https';
    }
    return request.url.startsWith('https://');
  }
  return Boolean(process.env.NEXTAUTH_URL?.startsWith('https://'));
}

export const SESSION_COOKIE_NAME = process.env.NEXTAUTH_URL?.startsWith('https://')
  ? SESSION_COOKIES[1]
  : SESSION_COOKIES[0];

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: Boolean(process.env.NEXTAUTH_URL?.startsWith('https://')),
};

export async function createDatabaseSession(userId: string, now = new Date()) {
  const expires = new Date(now.getTime() + SESSION_MAX_AGE_SECONDS * 1000);
  return prisma.session.create({
    data: {
      sessionToken: randomBytes(32).toString('base64url'),
      userId,
      expires,
    },
  });
}

export function setDatabaseSessionCookie(
  response: NextResponse,
  session: { sessionToken: string; expires: Date },
  request?: Request
): void {
  const secure = isHttpsRequest(request);
  const cookieName = secure ? SESSION_COOKIES[1] : SESSION_COOKIES[0];
  response.cookies.set({
    name: cookieName,
    value: session.sessionToken,
    expires: session.expires,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure,
  });
}

export function getRequestCookies(request: Request): Map<string, string> {
  const map = new Map<string, string>();
  const raw = request.headers.get('cookie') || '';
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = decodeURIComponent(part.slice(idx + 1).trim());
      map.set(k, v);
    }
  }
  return map;
}

export async function revokeDatabaseSession(sessionToken?: string | null): Promise<void> {
  if (!sessionToken) return;
  await prisma.session.deleteMany({ where: { sessionToken } });
}

export function extractBearerToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization') || '';
  if (authHeader.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim();
    return token || null;
  }
  const apiKeyHeader = request.headers.get('x-api-key')?.trim();
  return apiKeyHeader || null;
}

export async function authenticateBearerApiKey(rawToken: string) {
  const keyHash = hashOpaqueToken(rawToken);
  const apiKey = await prisma.apiKey.findFirst({
    where: {
      keyHash,
    },
  });

  if (!apiKey) return null;
  const user = await prisma.user.findUnique({
    where: { id: apiKey.userId },
  });
  if (!user) return null;
  if (user.status === 'disabled' || user.status === 'SUSPENDED') {
    return null;
  }

  await prisma.apiKey
    .update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => null);

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as 'Admin' | 'Editor' | 'Viewer',
    status: user.status,
    authMethod: 'api_key' as const,
    apiKeyId: apiKey.id,
  };
}

export async function getSessionUserFromRequest(request: Request) {
  const bearerToken = extractBearerToken(request);
  if (bearerToken) {
    return authenticateBearerApiKey(bearerToken);
  }

  const cookies = getRequestCookies(request);
  const token =
    cookies.get('__Secure-next-auth.session-token') ||
    cookies.get('next-auth.session-token');
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: { user: true },
  });
  if (!session || session.expires <= new Date()) {
    return null;
  }
  if (session.user.status === 'disabled' || session.user.status === 'SUSPENDED') {
    return null;
  }
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role as 'Admin' | 'Editor' | 'Viewer',
    status: session.user.status,
    authMethod: 'session' as const,
  };
}

export async function verifyExplicitBearerOrSession(request: Request) {
  const bearerToken = extractBearerToken(request);
  if (bearerToken) {
    const apiKeyUser = await authenticateBearerApiKey(bearerToken);
    if (!apiKeyUser) {
      const err: any = new Error('Invalid or revoked API key.');
      err.status = 401;
      throw err;
    }
    return apiKeyUser;
  }
  return getSessionUserFromRequest(request);
}

export async function requireAdminUser(request: Request) {
  const user = await verifyExplicitBearerOrSession(request);
  if (!user) {
    const err: any = new Error('Admin authentication required.');
    err.status = 401;
    throw err;
  }
  if (user.role !== 'Admin') {
    const err: any = new Error('Admin role required.');
    err.status = 403;
    throw err;
  }
  return user;
}

