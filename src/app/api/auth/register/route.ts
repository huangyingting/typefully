import { NextResponse } from 'next/server';
import {
  AccountAdmissionError,
  accountAdmissionMode,
  beginPublicRegistration,
  registerWithInvitation,
  setDatabaseSessionCookie,
} from '@/lib/account-admission';

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim();
    const password = String(body.password || '');
    const name = body.name ? String(body.name) : undefined;
    const token = body.token ? String(body.token) : undefined;

    if (accountAdmissionMode() === 'invitation-only') {
      if (!token) {
        throw new AccountAdmissionError(
          403,
          'invitation_required',
          'A valid invitation link is required to create an account.'
        );
      }

      const result = await registerWithInvitation({
        email,
        password,
        name,
        token,
      });

      const response = NextResponse.json(
        {
          ok: true,
          user: {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            role: result.user.role,
          },
          redirectUrl: '/write',
        },
        { status: 201 }
      );
      setDatabaseSessionCookie(response, result.session, request);
      return response;
    }

    await beginPublicRegistration({ email, password, name });
    return NextResponse.json(
      {
        ok: true,
        message: 'If this email can be registered, a verification link has been sent.',
      },
      { status: 202 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        error: err?.message || 'Registration failed.',
        code: err?.code || 'registration_error',
      },
      { status: err?.status || 400 }
    );
  }
}
