import { NextResponse } from 'next/server';
import { getRequestCookies, revokeDatabaseSession } from '@/lib/account-admission';

export async function POST(request: Request) {
  const cookies = getRequestCookies(request);
  const token =
    cookies.get('next-auth.session-token') ||
    cookies.get('__Secure-next-auth.session-token');
  await revokeDatabaseSession(token);
  const response = NextResponse.json({ ok: true });
  response.cookies.delete('next-auth.session-token');
  response.cookies.delete('__Secure-next-auth.session-token');
  return response;
}
