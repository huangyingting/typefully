import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeDraft } from '@/lib/domain-helpers';

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const draft = await prisma.draft.findUnique({
    where: { shareToken: token },
    include: {
      socialSet: true,
      commentThreads: {
        include: { comments: { orderBy: { createdAt: 'asc' } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!draft) {
    return NextResponse.json({ error: 'Shared draft not found.' }, { status: 404 });
  }

  return NextResponse.json({
    draft: serializeDraft(draft),
    social_set: {
      id: draft.socialSet.id,
      username: draft.socialSet.username,
      name: draft.socialSet.name,
      bio: draft.socialSet.bio,
      profile_image_url: draft.socialSet.profileImageUrl,
    },
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const draft = await prisma.draft.findUnique({
    where: { shareToken: token },
  });

  if (!draft) {
    return NextResponse.json({ error: 'Shared draft not found.' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const authorName = String(body.authorName || 'Guest Reviewer').trim();
  const content = String(body.content || '').trim();
  const quoteText = body.quoteText ? String(body.quoteText) : null;
  const postIndex = Number(body.postIndex || 0);

  if (!content) {
    return NextResponse.json({ error: 'Comment content is required.' }, { status: 400 });
  }

  const thread = await prisma.commentThread.create({
    data: {
      draftId: draft.id,
      postIndex,
      selectedText: quoteText,
      status: 'unresolved',
      comments: {
        create: {
          authorName,
          authorEmail: 'guest@reviewer.local',
          text: content,
        },
      },
    },
    include: { comments: true },
  });

  return NextResponse.json({ thread }, { status: 201 });
}
