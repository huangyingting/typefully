import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  dispatchWebhookEvent,
  safeJsonParse,
  serializeDraft,
} from '@/lib/domain-helpers';
import {
  verifyExplicitBearerOrSession,
  recordAuditLog,
} from '@/lib/account-admission';

/**
 * Scheduled Queue Publisher Worker (/api/cron/publish-due)
 * - Publishes drafts with status === 'scheduled' whose scheduledDate <= now (or next scheduled draft when forceNext=true).
 * - NEVER publishes drafts with status === 'planned' (inert calendar placeholders), even if their scheduledDate <= now!
 */
export async function POST(request: Request) {
  try {
    const user = await verifyExplicitBearerOrSession(request);
    if (user?.role === 'Viewer') {
      return NextResponse.json(
        { error: 'Viewers cannot trigger queue publishing.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const forceNext = Boolean(body.forceNext);
    const socialSetId = body.socialSetId ? Number(body.socialSetId) : undefined;
    const now = new Date();

    // Count inert planned drafts whose scheduledDate <= now to prove they are skipped
    const skippedPlannedCount = await prisma.draft.count({
      where: {
        status: 'planned',
        ...(socialSetId ? { socialSetId } : {}),
      },
    });

    let dueScheduledDrafts = await prisma.draft.findMany({
      where: {
        status: 'scheduled',
        ...(socialSetId ? { socialSetId } : {}),
        ...(forceNext ? {} : { scheduledDate: { lte: now } }),
      },
      include: {
        socialSet: true,
        commentThreads: { include: { comments: true } },
      },
      orderBy: { scheduledDate: 'asc' },
      ...(forceNext ? { take: 1 } : {}),
    });

    const publishedResults: any[] = [];

    for (const draft of dueScheduledDrafts) {
      const platformsConfig = safeJsonParse<Record<string, { enabled?: boolean }>>(
        draft.platformsJson,
        { x: { enabled: true } }
      );
      const handle = draft.socialSet?.username || 'typefully';

      const updated = await prisma.draft.update({
        where: { id: draft.id },
        data: {
          status: 'published',
          publishState: 'published',
          publishedAt: now,
          xPublishedUrl:
            platformsConfig.x?.enabled
              ? `https://x.com/${handle}/status/${Date.now()}${draft.id}`
              : draft.xPublishedUrl,
          linkedinPublishedUrl:
            platformsConfig.linkedin?.enabled
              ? `https://linkedin.com/posts/${handle}-${Date.now()}-${draft.id}`
              : draft.linkedinPublishedUrl,
          threadsPublishedUrl:
            platformsConfig.threads?.enabled
              ? `https://threads.net/@${handle}/post/${Date.now()}${draft.id}`
              : draft.threadsPublishedUrl,
          blueskyPublishedUrl:
            platformsConfig.bluesky?.enabled
              ? `https://bsky.app/profile/${handle}.bsky.social/post/${Date.now()}${draft.id}`
              : draft.blueskyPublishedUrl,
        },
        include: {
          commentThreads: { include: { comments: true } },
        },
      });

      const serialized = serializeDraft(updated);
      publishedResults.push(serialized);

      await dispatchWebhookEvent(draft.socialSetId, 'draft.published', serialized);

      await recordAuditLog({
        actorUserId: user?.id,
        actorEmail: user?.email,
        action: 'queue.worker.publish',
        targetType: 'Draft',
        targetId: String(draft.id),
        metadata: {
          socialSetId: draft.socialSetId,
          draftTitle: draft.draftTitle,
          previousStatus: 'scheduled',
        },
      });
    }

    return NextResponse.json({
      ok: true,
      processedAt: now.toISOString(),
      publishedCount: publishedResults.length,
      skippedInertPlannedCount: skippedPlannedCount,
      publishedDrafts: publishedResults,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Queue worker execution failed.' },
      { status: err?.status || 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
