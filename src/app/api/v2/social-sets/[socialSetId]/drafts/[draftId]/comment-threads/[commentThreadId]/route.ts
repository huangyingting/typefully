import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyExplicitBearerOrSession, recordAuditLog } from '@/lib/account-admission';

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      socialSetId: string;
      draftId: string;
      commentThreadId: string;
    }>;
  }
) {
  try {
    const user = await verifyExplicitBearerOrSession(request);
    if (user?.role === 'Viewer') {
      return NextResponse.json(
        { error: 'Viewers cannot delete comment threads.' },
        { status: 403 }
      );
    }

    const { commentThreadId, draftId } = await context.params;
    await prisma.commentThread.delete({
      where: { id: commentThreadId },
    });

    await recordAuditLog({
      actorUserId: user?.id,
      actorEmail: user?.email,
      action: 'draft.comment_thread.delete',
      targetType: 'CommentThread',
      targetId: commentThreadId,
      metadata: { draftId: Number(draftId) },
    });

    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to delete comment thread.' },
      { status: err?.status || 400 }
    );
  }
}
