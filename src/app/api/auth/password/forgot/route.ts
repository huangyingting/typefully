import { NextResponse } from 'next/server';
import {
  accountAdmissionSecretLink,
  requestPasswordReset,
} from '@/lib/account-admission';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim();
    if (!email) {
      return NextResponse.json(
        { error: 'Email address is required.' },
        { status: 400 }
      );
    }

    const reset = await requestPasswordReset(email);
    const resetUrl = reset
      ? accountAdmissionSecretLink('/reset-password', reset.token, request.url)
      : null;

    return NextResponse.json(
      {
        ok: true,
        message:
          'If a password account exists for this email, a reset link has been generated.',
        resetUrl,
        token: reset?.token || null,
      },
      { status: 202 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Password reset request failed.' },
      { status: err?.status || 400 }
    );
  }
}
