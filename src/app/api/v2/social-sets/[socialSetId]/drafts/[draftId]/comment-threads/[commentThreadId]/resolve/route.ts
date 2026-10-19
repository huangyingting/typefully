import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyExplicitBearerOrSession, recordAuditLog } from '@/lib/account-admission';

export async function POST(
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
    const { commentThreadId, draftId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const resolved = body.resolved !== undefined ? Boolean(body.resolved) : true;

    const updated = await prisma.commentThread.update({
      where: { id: commentThreadId },
      data: {
        status: resolved ? 'resolved' : 'open',
      },
      include: { comments: { orderBy: { createdAt: 'asc' } } },
    });

    await recordAuditLog({
      actorUserId: user?.id,
      actorEmail: user?.email,
      action: resolved ? 'draft.comment_thread.resolve' : 'draft.comment_thread.reopen',
      targetType: 'CommentThread',
      targetId: commentThreadId,
      metadata: { draftId: Number(draftId), resolved },
    });

    return NextResponse.json({
      ...updated,
      quoteText: updated.selectedText,
      resolved: updated.status === 'resolved',
      comments: updated.comments.map((c) => ({
        ...c,
        content: c.text,
      })),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to resolve comment thread.' },
      { status: err?.status || 400 }
    );
  }
}
