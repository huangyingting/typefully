import { NextResponse } from 'next/server';
import { resetPassword } from '@/lib/account-admission';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body.token || '');
    const password = String(body.password || '');
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Reset token and new password are required.' },
        { status: 400 }
      );
    }
    await resetPassword({ token, password });
    return NextResponse.json({
      ok: true,
      message: 'Your password has been updated and active sessions were revoked.',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Password reset failed.' },
      { status: err?.status || 400 }
    );
  }
}
