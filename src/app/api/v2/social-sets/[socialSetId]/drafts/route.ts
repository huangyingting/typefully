import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  applyAutoNumbering,
  computeNextFreeSlot,
  dispatchWebhookEvent,
  safeJsonParse,
  serializeDraft,
  ThreadPostItem,
  validateDraftContent,
} from '@/lib/domain-helpers';
import {
  verifyExplicitBearerOrSession,
  recordAuditLog,
} from '@/lib/account-admission';
import { randomBytes } from 'node:crypto';

export async function GET(
  request: Request,
  context: { params: Promise<{ socialSetId: string }> }
) {
  try {
    await verifyExplicitBearerOrSession(request);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Unauthorized' },
      { status: err?.status || 401 }
    );
  }
  const { socialSetId } = await context.params;
  const setId = Number(socialSetId);
  const { searchParams } = new URL(request.url);

  const statusParam = searchParams.get('status');
  const tagParam = searchParams.get('tag');
  const platformParam = searchParams.get('platform');
  const searchParam = (searchParams.get('search') || '').trim().toLowerCase();
  const orderByParam = searchParams.get('order_by') || '-updated_at';

  const drafts = await prisma.draft.findMany({
    where: {
      socialSetId: setId,
      ...(statusParam && statusParam !== 'all'
        ? { status: { in: statusParam.split(',') } }
        : {}),
    },
    include: {
      commentThreads: {
        include: { comments: true },
        orderBy: { createdAt: 'asc' },
      },
    },
    orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }],
  });

  let serialized = drafts.map(serializeDraft);

  if (tagParam) {
    const requestedTags = tagParam.split(',').map((t) => t.trim());
    serialized = serialized.filter((d) =>
      requestedTags.some((rt) => d.tags.includes(rt))
    );
  }

  if (platformParam && platformParam !== 'all') {
    serialized = serialized.filter(
      (d) => d.platforms?.[platformParam]?.enabled
    );
  }

  if (searchParam) {
    serialized = serialized.filter(
      (d) =>
        (d.draft_title || '').toLowerCase().includes(searchParam) ||
        (d.preview || '').toLowerCase().includes(searchParam) ||
        d.posts.some((p: any) => (p.text || '').toLowerCase().includes(searchParam))
    );
  }

  // Sort according to order_by
  if (orderByParam === 'scheduled_date' || orderByParam === '-scheduled_date') {
    const desc = orderByParam.startsWith('-');
    serialized.sort((a, b) => {
      const ta = a.scheduled_date ? new Date(a.scheduled_date).getTime() : 0;
      const tb = b.scheduled_date ? new Date(b.scheduled_date).getTime() : 0;
      return desc ? tb - ta : ta - tb;
    });
  } else if (orderByParam === 'created_at' || orderByParam === '-created_at') {
    const desc = orderByParam.startsWith('-');
    serialized.sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return desc ? tb - ta : ta - tb;
    });
  }

  return NextResponse.json({
    results: serialized,
    count: serialized.length,
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
  try {
    const user = await verifyExplicitBearerOrSession(request);
    if (user?.role === 'Viewer') {
      return NextResponse.json(
        { error: 'Viewers cannot create or modify drafts.' },
        { status: 403 }
      );
    }

    const { socialSetId } = await context.params;
    const setId = Number(socialSetId);
    const body = await request.json().catch(() => ({}));

    const socialSet = await prisma.socialSet.findUnique({ where: { id: setId } });
    if (!socialSet) {
      return NextResponse.json({ error: 'Social set not found.' }, { status: 404 });
    }

    // Support both OpenAPI v2 format and rich workspace format
    let posts: ThreadPostItem[] = [];
    let platformsConfig: Record<string, { enabled?: boolean }> = {
      x: { enabled: true },
      linkedin: { enabled: true },
      threads: { enabled: true },
      bluesky: { enabled: true },
    };

    if (Array.isArray(body.posts)) {
      posts = body.posts.map((p: any, i: number) => ({
        id: p.id || `p_${Date.now()}_${i}`,
        text: String(p.text || ''),
        mediaIds: p.mediaIds || p.media_ids || [],
        mediaUrls: p.mediaUrls || [],
        hideLinkPreview: Boolean(p.hideLinkPreview || p.hide_link_preview),
        quotePostUrl: p.quotePostUrl || p.quote_post_url || undefined,
      }));
    }

    if (body.platforms && typeof body.platforms === 'object') {
      const nextCfg: Record<string, { enabled?: boolean }> = {};
      for (const [pk, val] of Object.entries(body.platforms as Record<string, any>)) {
        nextCfg[pk] = { enabled: Boolean(val?.enabled) };
        if (posts.length === 0 && Array.isArray(val?.posts) && val.posts.length > 0) {
          posts = val.posts.map((p: any, i: number) => ({
            id: p.id || `p_${Date.now()}_${i}`,
            text: String(p.text || ''),
            mediaIds: p.media_ids || [],
          }));
        }
      }
      platformsConfig = nextCfg;
    } else if (body.platforms_config) {
      platformsConfig = body.platforms_config;
    }

    if (posts.length === 0) {
      posts = [{ id: `p_${Date.now()}_0`, text: String(body.text || '') }];
    }

    const numberingStyle = String(body.numbering_style || 'none');
    if (numberingStyle !== 'none') {
      posts = applyAutoNumbering(posts, numberingStyle);
    }

    let status = String(body.status || 'draft');
    let publishState = 'draft';
    let scheduledDate: Date | null = null;
    let publishedAt: Date | null = null;

    if (body.publish_at === 'now') {
      status = 'published';
      publishState = 'published';
      publishedAt = new Date();
    } else if (body.publish_at === 'next-free-slot') {
      status = 'scheduled';
      publishState = 'scheduled';
      scheduledDate = await computeNextFreeSlot(setId);
    } else if (body.publish_at) {
      status = 'scheduled';
      publishState = 'scheduled';
      scheduledDate = new Date(body.publish_at);
    } else if (body.plan_at) {
      // Planned draft: has scheduledDate, appears on Calendar/Queue, but INERT (does not auto-publish)
      status = 'planned';
      publishState = 'planned';
      scheduledDate =
        body.plan_at === 'next-free-slot'
          ? await computeNextFreeSlot(setId)
          : new Date(body.plan_at);
    }

    if (status === 'published' || status === 'scheduled') {
      const validation = validateDraftContent({
        posts,
        platforms: platformsConfig,
        poll: body.poll || null,
        allowLongX: false,
      });
      if (!validation.valid) {
        return NextResponse.json(
          {
            error: validation.errors[0],
            errors: validation.errors,
            warnings: validation.warnings,
          },
          { status: 400 }
        );
      }
    }

    const previewText = (posts[0]?.text || 'Untitled draft').slice(0, 120);
    const shareToken =
      body.share_token || `share-${randomBytes(6).toString('hex')}`;

    const created = await prisma.draft.create({
      data: {
        socialSetId: setId,
        createdById: user?.id || 'u_fabrizio',
        status,
        publishState,
        isPinned: Boolean(body.is_pinned),
        draftTitle: body.draft_title ? String(body.draft_title) : null,
        previewText,
        scratchpadText: String(body.scratchpad_text || ''),
        tagsJson: JSON.stringify(Array.isArray(body.tags) ? body.tags : []),
        shareToken,
        isPubliclyShared: Boolean(body.share || body.is_publicly_shared),
        numberingStyle,
        postsJson: JSON.stringify(posts),
        platformsJson: JSON.stringify(platformsConfig),
        pollJson: body.poll ? JSON.stringify(body.poll) : null,
        xSettingsJson: body.x_settings ? JSON.stringify(body.x_settings) : undefined,
        linkedinSettingsJson: body.linkedin_settings
          ? JSON.stringify(body.linkedin_settings)
          : undefined,
        threadsSettingsJson: body.threads_settings
          ? JSON.stringify(body.threads_settings)
          : undefined,
        autoPlugJson: body.auto_plug ? JSON.stringify(body.auto_plug) : undefined,
        autoRepostJson: body.auto_repost ? JSON.stringify(body.auto_repost) : undefined,
        autoDmJson: body.auto_dm ? JSON.stringify(body.auto_dm) : undefined,
        threadFinisherJson: body.thread_finisher
          ? JSON.stringify(body.thread_finisher)
          : undefined,
        backupsJson: JSON.stringify([
          {
            id: `bk_${Date.now()}`,
            createdAt: new Date().toISOString(),
            label: 'Initial version',
            posts,
          },
        ]),
        scheduledDate,
        publishedAt,
        xPublishedUrl:
          status === 'published' && platformsConfig.x?.enabled
            ? `https://x.com/${socialSet.username}/status/${Date.now()}`
            : null,
        linkedinPublishedUrl:
          status === 'published' && platformsConfig.linkedin?.enabled
            ? `https://linkedin.com/posts/${socialSet.username}-${Date.now()}`
            : null,
      },
      include: {
        commentThreads: { include: { comments: true } },
      },
    });

    const serialized = serializeDraft(created);
    await dispatchWebhookEvent(setId, 'draft.created', serialized);
    if (status === 'scheduled') {
      await dispatchWebhookEvent(setId, 'draft.scheduled', serialized);
    } else if (status === 'published') {
      await dispatchWebhookEvent(setId, 'draft.published', serialized);
    }

    await recordAuditLog({
      actorUserId: user?.id,
      actorEmail: user?.email,
      action: `draft.create.${status}`,
      targetType: 'Draft',
      targetId: String(created.id),
      metadata: { socialSetId: setId, status, title: created.draftTitle || previewText },
    });

    return NextResponse.json(serialized, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to create draft.' },
      { status: err?.status || 400 }
    );
  }
}
