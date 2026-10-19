import { NextResponse } from 'next/server';
import { recordAuditLog, requireAdminUser } from '@/lib/account-admission';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    await requireAdminUser(request);
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });
    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Unauthorized' },
      { status: err?.status || 401 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdminUser(request);
    const body = await request.json().catch(() => ({}));
    const userId = String(body.userId || '').trim();
    const role = body.role ? String(body.role) : undefined;
    const status = body.status ? String(body.status) : undefined;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(role ? { role } : {}),
        ...(status ? { status } : {}),
      },
    });

    if (status === 'SUSPENDED') {
      await prisma.session.deleteMany({ where: { userId } });
    }

    await recordAuditLog({
      actorUserId: admin.id,
      actorEmail: admin.email,
      action: 'admin.user.update',
      targetType: 'User',
      targetId: userId,
      metadata: { role: updated.role, status: updated.status },
    });

    return NextResponse.json({
      user: {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        status: updated.status,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update user.' },
      { status: err?.status || 400 }
    );
  }
}
