import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _request: Request,
  context: { params: Promise<{ socialSetId: string }> }
) {
  const { socialSetId } = await context.params;
  const tags = await prisma.tag.findMany({
    where: { socialSetId: Number(socialSetId) },
    orderBy: { name: 'asc' },
  });

  return NextResponse.json({
    results: tags,
    count: tags.length,
    limit: 50,
    offset: 0,
    next: null,
    previous: null,
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ socialSetId: string }> }
) {
  const { socialSetId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || '').trim();
  const color = String(body.color || '#f97316').trim();

  if (!name) {
    return NextResponse.json({ error: 'Tag name is required.' }, { status: 400 });
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const tag = await prisma.tag.upsert({
    where: {
      socialSetId_slug: {
        socialSetId: Number(socialSetId),
        slug,
      },
    },
    update: { name, color },
    create: {
      socialSetId: Number(socialSetId),
      name,
      slug,
      color,
    },
  });

  return NextResponse.json(tag, { status: 201 });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ socialSetId: string }> }
) {
  const { socialSetId } = await context.params;
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug') || '';

  await prisma.tag.deleteMany({
    where: {
      socialSetId: Number(socialSetId),
      slug,
    },
  });

  return NextResponse.json({ ok: true });
}
