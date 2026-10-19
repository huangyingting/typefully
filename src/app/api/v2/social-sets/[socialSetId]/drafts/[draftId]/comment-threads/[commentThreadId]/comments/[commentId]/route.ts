import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyExplicitBearerOrSession } from '@/lib/account-admission';

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      socialSetId: string;
      draftId: string;
      commentThreadId: string;
      commentId: string;
    }>;
  }
) {
  try {
    const user = await verifyExplicitBearerOrSession(request);
    if (user?.role === 'Viewer') {
      return NextResponse.json(
        { error: 'Viewers cannot edit comments.' },
        { status: 403 }
      );
    }

    const { commentId } = await context.params;
    const body = await request.json().catch(() => ({}));
    const text = String(body.content || body.text || '').trim();
    if (!text) {
      return NextResponse.json(
        { error: 'Comment text is required.' },
        { status: 400 }
      );
    }

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { text },
    });

    return NextResponse.json({
      id: updated.id,
      thread_id: updated.threadId,
      author_name: updated.authorName,
      content: updated.text,
      text: updated.text,
      created_at: updated.createdAt.toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update comment.' },
      { status: err?.status || 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: {
    params: Promise<{
      socialSetId: string;
      draftId: string;
      commentThreadId: string;
      commentId: string;
    }>;
  }
) {
  try {
    const user = await verifyExplicitBearerOrSession(request);
    if (user?.role === 'Viewer') {
      return NextResponse.json(
        { error: 'Viewers cannot delete comments.' },
        { status: 403 }
      );
    }

    const { commentId } = await context.params;
    await prisma.comment.delete({ where: { id: commentId } });
    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to delete comment.' },
      { status: err?.status || 400 }
    );
  }
}
