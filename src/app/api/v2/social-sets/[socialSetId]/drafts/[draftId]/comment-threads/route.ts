import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUserFromRequest } from '@/lib/account-admission';

export async function GET(
  _request: Request,
  context: { params: Promise<{ socialSetId: string; draftId: string }> }
) {
  const { draftId } = await context.params;
  const threads = await prisma.commentThread.findMany({
    where: { draftId: Number(draftId) },
    include: { comments: { orderBy: { createdAt: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({ results: threads });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ socialSetId: string; draftId: string }> }
) {
  const user = await getSessionUserFromRequest(request);
  const { draftId } = await context.params;
  const body = await request.json().catch(() => ({}));

  const content = String(body.content || '').trim();
  if (!content) {
    return NextResponse.json({ error: 'Comment content is required.' }, { status: 400 });
  }

  const authorName = String(body.authorName || user?.name || 'Fabrizio Rinaldi');
  const authorEmail = String(body.authorEmail || user?.email || 'fabrizio@typefully.com');

  // If threadId is passed, append reply to existing thread; otherwise create a new inline comment thread
  if (body.threadId) {
    const comment = await prisma.comment.create({
      data: {
        threadId: String(body.threadId),
        authorId: user?.id,
        authorName,
        authorEmail,
        text: content,
      },
    });
    const updatedThread = await prisma.commentThread.findUnique({
      where: { id: String(body.threadId) },
      include: { comments: { orderBy: { createdAt: 'asc' } } },
    });
    return NextResponse.json({ thread: updatedThread, comment }, { status: 201 });
  }

  const thread = await prisma.commentThread.create({
    data: {
      draftId: Number(draftId),
      postIndex: Number(body.postIndex || 0),
      selectedText: body.quoteText ? String(body.quoteText) : null,
      status: 'unresolved',
      comments: {
        create: {
          authorId: user?.id,
          authorName,
          authorEmail,
          text: content,
        },
      },
    },
    include: { comments: true },
  });

  return NextResponse.json({ thread }, { status: 201 });
}

export async function PATCH(
  request: Request,
  _context: { params: Promise<{ socialSetId: string; draftId: string }> }
) {
  const body = await request.json().catch(() => ({}));
  const threadId = String(body.threadId || '');
  const resolved = Boolean(body.resolved);

  if (!threadId) {
    return NextResponse.json({ error: 'threadId is required.' }, { status: 400 });
  }

  const thread = await prisma.commentThread.update({
    where: { id: threadId },
    data: { status: resolved ? 'resolved' : 'unresolved' },
    include: { comments: { orderBy: { createdAt: 'asc' } } },
  });

  return NextResponse.json({ thread });
}
