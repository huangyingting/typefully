import { NextResponse } from 'next/server';
import {
  accountAdmissionMode,
  inspectAccountInvitation,
} from '@/lib/account-admission';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = String(searchParams.get('token') || '').trim();
  if (!token) {
    return NextResponse.json(
      {
        invitation: {
          id: '',
          status: 'invalid',
          maskedEmail: null,
          expiresAt: null,
        },
        mode: accountAdmissionMode(),
      },
      { status: 400 }
    );
  }
  const invitation = await inspectAccountInvitation(token);
  return NextResponse.json({
    invitation,
    mode: accountAdmissionMode(),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const token = String(body.token || '').trim();
    if (!token) {
      return NextResponse.json(
        {
          invitation: {
            id: '',
            status: 'invalid',
            maskedEmail: null,
            expiresAt: null,
          },
          mode: accountAdmissionMode(),
        },
        { status: 400 }
      );
    }

    const invitation = await inspectAccountInvitation(token);
    return NextResponse.json({
      invitation,
      mode: accountAdmissionMode(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to inspect invitation.' },
      { status: err?.status || 500 }
    );
  }
}
