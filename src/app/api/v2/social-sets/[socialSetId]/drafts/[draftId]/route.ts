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

export async function GET(
  request: Request,
  context: { params: Promise<{ socialSetId: string; draftId: string }> }
) {
  try {
    await verifyExplicitBearerOrSession(request);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Unauthorized' },
      { status: err?.status || 401 }
    );
  }
  const { socialSetId, draftId } = await context.params;
  const draft = await prisma.draft.findFirst({
    where: {
      id: Number(draftId),
      socialSetId: Number(socialSetId),
    },
    include: {
      commentThreads: {
        include: { comments: { orderBy: { createdAt: 'asc' } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!draft) {
    return NextResponse.json({ error: 'Draft not found.' }, { status: 404 });
  }

  return NextResponse.json(serializeDraft(draft));
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ socialSetId: string; draftId: string }> }
) {
  try {
    const user = await verifyExplicitBearerOrSession(request);
    if (user?.role === 'Viewer') {
      return NextResponse.json(
        { error: 'Viewers cannot modify drafts.' },
        { status: 403 }
      );
    }

    const { socialSetId, draftId } = await context.params;
    const setId = Number(socialSetId);
    const id = Number(draftId);

    const existing = await prisma.draft.findFirst({
      where: { id, socialSetId: setId },
      include: { socialSet: true },
    });
    if (!existing) {
      return NextResponse.json({ error: 'Draft not found.' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));

    let posts = safeJsonParse<ThreadPostItem[]>(existing.postsJson, []);
    let platformsConfig = safeJsonParse<Record<string, { enabled?: boolean }>>(
      existing.platformsJson,
      { x: { enabled: true } }
    );
    let poll =
      body.poll !== undefined
        ? body.poll
        : safeJsonParse<any>(existing.pollJson, null);

    // Handle backup restore
    if (body.restore_backup_id) {
      const backups = safeJsonParse<any[]>(existing.backupsJson, []);
      const found = backups.find((b) => b.id === body.restore_backup_id);
      if (found && Array.isArray(found.posts)) {
        posts = found.posts;
      }
    } else if (Array.isArray(body.posts)) {
      posts = body.posts.map((p: any, i: number) => ({
        id: p.id || `p_${Date.now()}_${i}`,
        text: String(p.text || ''),
        mediaIds: p.mediaIds || p.media_ids || [],
        mediaUrls: p.mediaUrls || [],
        hideLinkPreview: Boolean(p.hideLinkPreview || p.hide_link_preview),
        quotePostUrl: p.quotePostUrl || p.quote_post_url || undefined,
      }));
    }

    if (body.platforms_config) {
      platformsConfig = body.platforms_config;
    } else if (body.platforms && typeof body.platforms === 'object') {
      const nextCfg: Record<string, { enabled?: boolean }> = {};
      for (const [pk, val] of Object.entries(body.platforms as Record<string, any>)) {
        nextCfg[pk] = { enabled: Boolean(val?.enabled) };
      }
      platformsConfig = nextCfg;
    }

    const numberingStyle =
      body.numbering_style !== undefined
        ? String(body.numbering_style)
        : existing.numberingStyle;

    if (body.apply_numbering || (body.numbering_style && body.numbering_style !== 'none')) {
      posts = applyAutoNumbering(posts, numberingStyle);
    }

    // Determine status / schedule transitions
    let status = body.status !== undefined ? String(body.status) : existing.status;
    let publishState = existing.publishState;
    let scheduledDate = existing.scheduledDate;
    let publishedAt = existing.publishedAt;

    if (body.publish_at === 'now' || body.action === 'publish_now') {
      status = 'published';
      publishState = 'published';
      publishedAt = new Date();
    } else if (body.publish_at === 'next-free-slot' || body.action === 'schedule_next_slot') {
      status = 'scheduled';
      publishState = 'scheduled';
      scheduledDate = await computeNextFreeSlot(setId);
    } else if (body.publish_at) {
      status = 'scheduled';
      publishState = 'scheduled';
      scheduledDate = new Date(body.publish_at);
    } else if (body.plan_at) {
      // Planned draft: inert scheduled date
      status = 'planned';
      publishState = 'planned';
      scheduledDate =
        body.plan_at === 'next-free-slot'
          ? await computeNextFreeSlot(setId)
          : new Date(body.plan_at);
    } else if (body.action === 'confirm_schedule') {
      // Confirming a Planned draft activates it into a Scheduled draft
      status = 'scheduled';
      publishState = 'scheduled';
      if (!scheduledDate) {
        scheduledDate = await computeNextFreeSlot(setId);
      }
    } else if (body.action === 'unschedule') {
      status = 'draft';
      publishState = 'draft';
      scheduledDate = null;
    } else if (body.scheduled_date !== undefined) {
      scheduledDate = body.scheduled_date ? new Date(body.scheduled_date) : null;
    }

    // Validate before publishing or scheduling
    if (
      status === 'published' ||
      status === 'scheduled' ||
      body.action === 'validate'
    ) {
      const validation = validateDraftContent({
        posts,
        platforms: platformsConfig,
        poll,
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

    // Save snapshot backup when content changes
    const existingBackups = safeJsonParse<any[]>(existing.backupsJson, []);
    const nextBackups =
      body.save_backup || body.posts
        ? [
            {
              id: `bk_${Date.now()}`,
              createdAt: new Date().toISOString(),
              label: body.backup_label || `Revision (${posts.length} post${posts.length > 1 ? 's' : ''})`,
              posts,
            },
            ...existingBackups.slice(0, 14),
          ]
        : existingBackups;

    const previewText = (posts[0]?.text || existing.previewText || 'Untitled draft').slice(
      0,
      120
    );

    const updated = await prisma.draft.update({
      where: { id },
      data: {
        status,
        publishState,
        scheduledDate,
        publishedAt,
        previewText,
        numberingStyle,
        postsJson: JSON.stringify(posts),
        platformsJson: JSON.stringify(platformsConfig),
        pollJson: poll ? JSON.stringify(poll) : null,
        backupsJson: JSON.stringify(nextBackups),
        ...(body.draft_title !== undefined
          ? { draftTitle: body.draft_title ? String(body.draft_title) : null }
          : {}),
        ...(body.scratchpad_text !== undefined
          ? { scratchpadText: String(body.scratchpad_text) }
          : {}),
        ...(body.is_pinned !== undefined ? { isPinned: Boolean(body.is_pinned) } : {}),
        ...(body.share !== undefined || body.is_publicly_shared !== undefined
          ? { isPubliclyShared: Boolean(body.share ?? body.is_publicly_shared) }
          : {}),
        ...(Array.isArray(body.tags) ? { tagsJson: JSON.stringify(body.tags) } : {}),
        ...(body.x_settings ? { xSettingsJson: JSON.stringify(body.x_settings) } : {}),
        ...(body.linkedin_settings
          ? { linkedinSettingsJson: JSON.stringify(body.linkedin_settings) }
          : {}),
        ...(body.threads_settings
          ? { threadsSettingsJson: JSON.stringify(body.threads_settings) }
          : {}),
        ...(body.auto_plug ? { autoPlugJson: JSON.stringify(body.auto_plug) } : {}),
        ...(body.auto_repost ? { autoRepostJson: JSON.stringify(body.auto_repost) } : {}),
        ...(body.auto_dm ? { autoDmJson: JSON.stringify(body.auto_dm) } : {}),
        ...(body.thread_finisher
          ? { threadFinisherJson: JSON.stringify(body.thread_finisher) }
          : {}),
        ...(status === 'published' && !existing.xPublishedUrl && platformsConfig.x?.enabled
          ? {
              xPublishedUrl: `https://x.com/${existing.socialSet.username}/status/${Date.now()}`,
            }
          : {}),
        ...(status === 'published' &&
        !existing.linkedinPublishedUrl &&
        platformsConfig.linkedin?.enabled
          ? {
              linkedinPublishedUrl: `https://linkedin.com/posts/${existing.socialSet.username}-${Date.now()}`,
            }
          : {}),
      },
      include: {
        commentThreads: {
          include: { comments: { orderBy: { createdAt: 'asc' } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    const serialized = serializeDraft(updated);
    if (existing.status !== status) {
      await dispatchWebhookEvent(setId, `draft.${status}`, serialized);
      await recordAuditLog({
        actorUserId: user?.id,
        actorEmail: user?.email,
        action: `draft.status.${status}`,
        targetType: 'Draft',
        targetId: String(id),
        metadata: { from: existing.status, to: status },
      });
    }

    return NextResponse.json(serialized);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update draft.' },
      { status: err?.status || 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ socialSetId: string; draftId: string }> }
) {
  try {
    const user = await verifyExplicitBearerOrSession(request);
    if (user?.role === 'Viewer') {
      return NextResponse.json(
        { error: 'Viewers cannot delete drafts.' },
        { status: 403 }
      );
    }

    const { socialSetId, draftId } = await context.params;
    const id = Number(draftId);

    await prisma.draft.delete({
      where: { id },
    });

    await recordAuditLog({
      actorUserId: user?.id,
      actorEmail: user?.email,
      action: 'draft.delete',
      targetType: 'Draft',
      targetId: String(id),
      metadata: { socialSetId: Number(socialSetId) },
    });

    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to delete draft.' },
      { status: err?.status || 400 }
    );
  }
}
