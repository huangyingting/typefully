import { NextResponse } from 'next/server';
import {
  authenticatePassword,
  setDatabaseSessionCookie,
} from '@/lib/account-admission';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim();
    const password = String(body.password || '');

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const result = await authenticatePassword({ email, password });
    if (!result) {
      return NextResponse.json(
        { error: 'Invalid email or password.' },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
      redirectUrl: '/write',
    });
    setDatabaseSessionCookie(response, result.session, request);
    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Sign in failed.' },
      { status: 500 }
    );
  }
}
