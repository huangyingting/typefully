import { NextResponse } from 'next/server';
import {
  createAccountInvitation,
  listAccountInvitations,
  requireAdminUser,
  listAuditLogs,
} from '@/lib/account-admission';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const admin = await requireAdminUser(request);
    const [invitations, auditLogs, users] = await Promise.all([
      listAccountInvitations(),
      listAuditLogs({ limit: 50 }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({
      admin,
      invitations,
      auditLogs,
      users,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Unauthorized' },
      { status: err?.status || 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireAdminUser(request);
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || '').trim();
    const role = (body.role as 'Admin' | 'Editor' | 'Viewer') || 'Editor';
    const expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;

    const result = await createAccountInvitation({
      email,
      role,
      expiresAt,
      createdByUserId: admin.id,
      createdByEmail: admin.email,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to create invitation.', code: err?.code },
      { status: err?.status || 400 }
    );
  }
}
