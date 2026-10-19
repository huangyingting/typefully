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
    const text = String(body.content || body.text || '').trim();

    if (!text) {
      return NextResponse.json(
        { error: 'Comment content is required.' },
        { status: 400 }
      );
    }

    const comment = await prisma.comment.create({
      data: {
        threadId: commentThreadId,
        authorId: user?.id || undefined,
        authorName: user?.name || body.author_name || 'Reviewer',
        authorEmail: user?.email || 'reviewer@typefully.com',
        text,
      },
    });

    await recordAuditLog({
      actorUserId: user?.id,
      actorEmail: user?.email,
      action: 'draft.comment.reply',
      targetType: 'CommentMessage',
      targetId: comment.id,
      metadata: { draftId: Number(draftId), commentThreadId },
    });

    return NextResponse.json(
      {
        id: comment.id,
        thread_id: comment.threadId,
        author_name: comment.authorName,
        content: comment.text,
        text: comment.text,
        created_at: comment.createdAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to add comment reply.' },
      { status: err?.status || 400 }
    );
  }
}
