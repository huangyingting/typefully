import { NextResponse } from 'next/server';
import {
  requireAdminUser,
  rotateAccountInvitation,
} from '@/lib/account-admission';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminUser(request);
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;

    const result = await rotateAccountInvitation(
      id,
      expiresAt,
      admin.id,
      admin.email
    );
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to rotate invitation.' },
      { status: err?.status || 400 }
    );
  }
}
