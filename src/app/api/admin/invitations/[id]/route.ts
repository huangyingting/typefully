import { NextResponse } from 'next/server';
import {
  requireAdminUser,
  revokeAccountInvitation,
} from '@/lib/account-admission';

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminUser(request);
    const { id } = await context.params;
    const invitation = await revokeAccountInvitation(id, admin.id, admin.email);
    return NextResponse.json({ invitation });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to revoke invitation.' },
      { status: err?.status || 400 }
    );
  }
}
