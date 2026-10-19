import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const DEFAULT_PROMPTS = [
  {
    id: 'cmd_punchier',
    socialSetId: 1,
    label: 'Make it punchier',
    slug: 'punchier',
    instruction: 'Rewrite this post to be punchier, removing fluff while keeping the creator voice.',
    isBuiltIn: true,
  },
  {
    id: 'cmd_threadify',
    socialSetId: 1,
    label: 'Turn into thread',
    slug: 'threadify',
    instruction: 'Split this long-form note into a high-retention multi-post thread with a strong hook.',
    isBuiltIn: true,
  },
  {
    id: 'cmd_linkedin',
    socialSetId: 1,
    label: 'Adapt for LinkedIn',
    slug: 'adapt-linkedin',
    instruction: 'Adapt this X thread into a structured single LinkedIn post with bullet points and a closing question.',
    isBuiltIn: true,
  },
  {
    id: 'cmd_hooks',
    socialSetId: 1,
    label: 'Generate 3 viral hooks',
    slug: 'viral-hooks',
    instruction: 'Suggest 3 alternative opening hooks that spark curiosity without clickbait.',
    isBuiltIn: true,
  },
  {
    id: 'cmd_grammar',
    socialSetId: 1,
    label: 'Fix grammar & flow',
    slug: 'fix-grammar',
    instruction: 'Fix any spelling or grammatical issues while preserving casual lowercase or intentional stylistic choices.',
    isBuiltIn: true,
  },
];

export async function GET() {
  const prompts = await prisma.aiPromptCommand.findMany({
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json({
    results: prompts.map((p) => ({
      ...p,
      title: p.label,
      prompt: p.instruction,
      isDefault: p.isBuiltIn,
    })),
  });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  if (body.action === 'reset_defaults') {
    await prisma.aiPromptCommand.deleteMany({});
    for (const p of DEFAULT_PROMPTS) {
      await prisma.aiPromptCommand.create({ data: p });
    }
    const prompts = await prisma.aiPromptCommand.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({
      results: prompts.map((p) => ({
        ...p,
        title: p.label,
        prompt: p.instruction,
        isDefault: p.isBuiltIn,
      })),
    });
  }

  const title = String(body.title || body.label || '').trim();
  const prompt = String(body.prompt || body.instruction || '').trim();
  const socialSetId = Number(body.socialSetId || 1);
  if (!title || !prompt) {
    return NextResponse.json(
      { error: 'Title and prompt instruction are required.' },
      { status: 400 }
    );
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const created = await prisma.aiPromptCommand.create({
    data: {
      socialSetId,
      label: title,
      slug,
      instruction: prompt,
      isBuiltIn: false,
    },
  });

  return NextResponse.json(
    {
      promptCommand: {
        ...created,
        title: created.label,
        prompt: created.instruction,
        isDefault: created.isBuiltIn,
      },
    },
    { status: 201 }
  );
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id') || '';
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }
  await prisma.aiPromptCommand.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
