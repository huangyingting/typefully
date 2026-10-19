import { createHmac, randomUUID } from 'node:crypto';
import { prisma } from './prisma';
import { recordAuditLog } from './account-admission';

export const PLATFORM_LIMITS: Record<
  string,
  { name: string; maxChars: number; maxOptions?: number; maxOptionLen?: number; supportsPolls: boolean }
> = {
  x: { name: '𝕏 (Twitter)', maxChars: 280, maxOptions: 4, maxOptionLen: 25, supportsPolls: true },
  linkedin: { name: 'LinkedIn', maxChars: 3000, maxOptions: 4, maxOptionLen: 30, supportsPolls: true },
  threads: { name: 'Threads', maxChars: 500, maxOptions: 4, maxOptionLen: 25, supportsPolls: true },
  bluesky: { name: 'Bluesky', maxChars: 300, supportsPolls: false },
  mastodon: { name: 'Mastodon', maxChars: 500, maxOptions: 4, maxOptionLen: 50, supportsPolls: true },
  substack: { name: 'Substack Notes', maxChars: 5000, supportsPolls: false },
  x_article: { name: '𝕏 Article', maxChars: 50000, supportsPolls: false },
};

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export type ThreadPostItem = {
  id: string;
  text: string;
  mediaIds?: string[];
  mediaUrls?: Array<{ id: string; url: string; mimeType: string; altText?: string; fileName?: string }>;
  hideLinkPreview?: boolean;
  quotePostUrl?: string;
};

export function applyAutoNumbering(
  posts: ThreadPostItem[],
  style: string
): ThreadPostItem[] {
  if (!style || style === 'none' || posts.length <= 1) return posts;
  const total = posts.length;
  return posts.map((post, idx) => {
    const clean = post.text
      .replace(/^\(\d+\/\d+\)\s*/, '')
      .replace(/^\[\d+\/\d+\]\s*/, '')
      .replace(/^\d+\/\d+\s+/, '')
      .replace(/^\d+\.\s+/, '')
      .replace(/\s+\(\d+\/\d+\)$/, '')
      .replace(/\s+\d+\/\d+$/, '');
    const n = idx + 1;
    let formatted = clean;
    if (style === '1/n') formatted = `${clean}\n\n${n}/${total}`;
    else if (style === '1.') formatted = `${n}. ${clean}`;
    else if (style === '[1/n]') formatted = `[${n}/${total}] ${clean}`;
    else if (style === 'thread_emoji') formatted = idx === 0 ? `🧵 ${clean}` : `${n}/${total} ${clean}`;
    return { ...post, text: formatted };
  });
}

export function validateDraftContent(params: {
  posts: ThreadPostItem[];
  platforms: Record<string, { enabled?: boolean }>;
  poll?: { question?: string; options?: string[]; durationMinutes?: number } | null;
  allowLongX?: boolean;
}): { valid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  const nonEmptyPosts = params.posts.filter(
    (p) => (p.text && p.text.trim().length > 0) || (p.mediaIds && p.mediaIds.length > 0) || (p.mediaUrls && p.mediaUrls.length > 0)
  );
  if (nonEmptyPosts.length === 0 && !params.poll) {
    errors.push('Cannot publish or schedule an empty draft.');
  }

  const enabledPlatformKeys = Object.entries(params.platforms || {})
    .filter(([, cfg]) => cfg?.enabled)
    .map(([k]) => k);

  if (enabledPlatformKeys.length === 0) {
    errors.push('Enable at least one social platform before scheduling or publishing.');
  }

  // Poll validation
  if (params.poll) {
    const validOptions = (params.poll.options || []).map((o) => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      errors.push('Polls require at least 2 non-empty options.');
    }
    if (validOptions.length > 4) {
      errors.push('Polls can have at most 4 options.');
    }
    const hasMedia = params.posts.some(
      (p) => (p.mediaIds && p.mediaIds.length > 0) || (p.mediaUrls && p.mediaUrls.length > 0)
    );
    if (hasMedia) {
      errors.push("Poll with media: A post with a poll can't include images, video, or PDF carousels.");
    }

    for (const pk of enabledPlatformKeys) {
      const lim = PLATFORM_LIMITS[pk];
      if (!lim) continue;
      if (!lim.supportsPolls) {
        warnings.push(`Polls are not supported on ${lim.name} and will be omitted there.`);
      } else if (lim.maxOptionLen) {
        const tooLong = validOptions.find((opt) => opt.length > lim.maxOptionLen!);
        if (tooLong) {
          errors.push(
            `Poll option "${tooLong}" exceeds ${lim.name}'s ${lim.maxOptionLen}-character limit.`
          );
        }
      }
    }
  }

  // Character limit checks
  for (const pk of enabledPlatformKeys) {
    const lim = PLATFORM_LIMITS[pk];
    if (!lim) continue;
    const maxAllowed = pk === 'x' && params.allowLongX ? 25000 : lim.maxChars;
    params.posts.forEach((p, idx) => {
      if ((p.text || '').length > maxAllowed) {
        warnings.push(
          `Post #${idx + 1} is ${p.text.length} chars (exceeds ${lim.name} limit of ${maxAllowed}).`
        );
      }
    });
  }

  return { valid: errors.length === 0, errors, warnings };
}

export async function computeNextFreeSlot(socialSetId: number, fromDate = new Date()): Promise<Date> {
  const socialSet = await prisma.socialSet.findUnique({ where: { id: socialSetId } });
  const rules = safeJsonParse<Array<{ h: number; m: number; days: string[] }>>(
    socialSet?.queueRulesJson,
    [
      { h: 9, m: 0, days: ['mon', 'tue', 'wed', 'thu', 'fri'] },
      { h: 14, m: 25, days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] },
    ]
  );

  const existingDrafts = await prisma.draft.findMany({
    where: {
      socialSetId,
      status: { in: ['scheduled', 'planned'] },
      scheduledDate: { gte: fromDate },
    },
    select: { scheduledDate: true },
  });

  const occupiedTimestamps = new Set(
    existingDrafts
      .filter((d) => d.scheduledDate)
      .map((d) => {
        const dt = new Date(d.scheduledDate!);
        dt.setSeconds(0, 0);
        return dt.getTime();
      })
  );

  const dayMap = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const candidateDay = new Date(fromDate.getTime() + dayOffset * 24 * 3600 * 1000);
    const dayKey = dayMap[candidateDay.getDay()];

    const matchingRules = rules
      .filter((r) => r.days.includes(dayKey))
      .sort((a, b) => a.h * 60 + a.m - (b.h * 60 + b.m));

    for (const rule of matchingRules) {
      const slotDate = new Date(candidateDay);
      slotDate.setHours(rule.h, rule.m, 0, 0);
      if (slotDate.getTime() > fromDate.getTime() + 60 * 1000) {
        if (!occupiedTimestamps.has(slotDate.getTime())) {
          return slotDate;
        }
      }
    }
  }

  const fallback = new Date(fromDate.getTime() + 24 * 3600 * 1000);
  fallback.setHours(9, 0, 0, 0);
  return fallback;
}

export function serializeDraft(draft: any) {
  const posts = safeJsonParse<ThreadPostItem[]>(draft.postsJson, []);
  const tags = safeJsonParse<string[]>(draft.tagsJson, []);
  const platformsConfig = safeJsonParse<Record<string, { enabled?: boolean; customPosts?: ThreadPostItem[] }>>(
    draft.platformsJson,
    { x: { enabled: true } }
  );
  const poll = safeJsonParse<any>(draft.pollJson, null);
  const xSettings = safeJsonParse<any>(draft.xSettingsJson, {
    reply_to_url: null,
    community_id: null,
    share_with_followers: true,
    reply_settings: 'everyone',
    subscribers_only: false,
    paid_partnership: false,
    made_with_ai: false,
  });
  const linkedinSettings = safeJsonParse<any>(draft.linkedinSettingsJson, {
    first_comment: '',
    linkedin_reshare_target: null,
    pdf_carousel_title: null,
  });
  const threadsSettings = safeJsonParse<any>(draft.threadsSettingsJson, {
    topic_tag: '',
  });
  const autoPlug = safeJsonParse<any>(draft.autoPlugJson, {
    enabled: false,
    triggerMetric: 'likes',
    threshold: 50,
    plugText: '',
  });
  const autoRepost = safeJsonParse<any>(draft.autoRepostJson, {
    enabled: false,
    delayHours: 12,
  });
  const autoDm = safeJsonParse<any>(draft.autoDmJson, {
    enabled: false,
    triggerKeyword: 'GUIDE',
    requireFollow: true,
    requireRetweet: false,
    dmTemplate: '',
    sentCount: 0,
  });
  const threadFinisher = safeJsonParse<any>(draft.threadFinisherJson, {
    enabled: false,
    templateText: '',
    quoteFirstPost: true,
  });
  const backups = safeJsonParse<any[]>(draft.backupsJson, []);
  const metrics = safeJsonParse<any>(draft.metricsJson, {
    impressions: 0,
    likes: 0,
    replies: 0,
    reposts: 0,
    bookmarks: 0,
    engagementRate: 0,
  });

  // OpenAPI v2 compatible platforms envelope
  const v2Platforms: Record<string, any> = {};
  for (const pk of ['x', 'linkedin', 'threads', 'bluesky', 'mastodon', 'substack', 'x_article']) {
    const enabled = !!platformsConfig[pk]?.enabled;
    v2Platforms[pk] = {
      enabled,
      posts: (platformsConfig[pk]?.customPosts || posts).map((p) => ({
        id: p.id,
        text: p.text,
        media_ids: p.mediaIds || [],
        hide_link_preview: !!p.hideLinkPreview,
        quote_post_url: p.quotePostUrl || null,
      })),
      settings:
        pk === 'x'
          ? xSettings
          : pk === 'linkedin'
          ? linkedinSettings
          : pk === 'threads'
          ? threadsSettings
          : {},
    };
  }

  // Comment threads serialized with normalized quoteText, resolved, and content fields
  const normalizedThreads = (draft.commentThreads || []).map((th: any) => ({
    ...th,
    quoteText: th.quoteText ?? th.selectedText ?? null,
    resolved: th.resolved !== undefined ? th.resolved : th.status === 'resolved',
    comments: (th.comments || []).map((c: any) => ({
      ...c,
      content: c.content ?? c.text ?? '',
    })),
  }));

  return {
    id: draft.id,
    draft_id: draft.id,
    social_set_id: draft.socialSetId,
    status: draft.status,
    publish_state: draft.publishState,
    is_pinned: draft.isPinned,
    draft_title: draft.draftTitle,
    preview: draft.previewText || (posts[0]?.text || '').slice(0, 100),
    scratchpad_text: draft.scratchpadText,
    tags,
    share_token: draft.shareToken,
    share_url: draft.isPubliclyShared ? `/t/${draft.shareToken}` : null,
    private_url: `/write?d=${draft.id}&a=${draft.socialSetId}`,
    numbering_style: draft.numberingStyle,
    posts,
    platforms: v2Platforms,
    platforms_config: platformsConfig,
    poll,
    x_settings: xSettings,
    linkedin_settings: linkedinSettings,
    threads_settings: threadsSettings,
    auto_plug: autoPlug,
    auto_repost: autoRepost,
    auto_dm: autoDm,
    thread_finisher: threadFinisher,
    backups,
    metrics,
    comment_threads: normalizedThreads,
    scheduled_date: draft.scheduledDate ? new Date(draft.scheduledDate).toISOString() : null,
    published_at: draft.publishedAt ? new Date(draft.publishedAt).toISOString() : null,
    created_at: new Date(draft.createdAt).toISOString(),
    updated_at: draft.updatedAt ? new Date(draft.updatedAt).toISOString() : null,
    x_published_url: draft.xPublishedUrl,
    linkedin_published_url: draft.linkedinPublishedUrl,
    threads_published_url: draft.threadsPublishedUrl,
    bluesky_published_url: draft.blueskyPublishedUrl,
    mastodon_published_url: draft.mastodonPublishedUrl,
    substack_published_url: draft.substackPublishedUrl,
    x_article_published_url: draft.xArticlePublishedUrl,
  };
}

export async function dispatchWebhookEvent(
  socialSetId: number,
  event: string,
  draftPayload: any
) {
  try {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: { socialSetId, isActive: true },
    });
    const now = new Date();
    const deliveryId = randomUUID();
    const envelope = JSON.stringify({
      id: deliveryId,
      event,
      created_at: now.toISOString(),
      social_set_id: socialSetId,
      data: draftPayload,
    });

    const signatures: string[] = [];

    for (const ep of endpoints) {
      const events = safeJsonParse<string[]>(ep.eventsJson, []);
      if (events.includes(event)) {
        const hmac = createHmac('sha256', ep.secret || 'whsec_default')
          .update(envelope)
          .digest('hex');
        const sigHeader = `sha256=${hmac}`;
        signatures.push(sigHeader.slice(0, 20));

        await prisma.webhookEndpoint.update({
          where: { id: ep.id },
          data: { lastTriggeredAt: now },
        });

        if (ep.url.startsWith('http://127.0.0.1') || ep.url.startsWith('http://localhost')) {
          await fetch(ep.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Typefully-Event': event,
              'X-Typefully-Delivery-Id': deliveryId,
              'X-Typefully-Signature-256': sigHeader,
            },
            body: envelope,
            signal: AbortSignal.timeout(2500),
          }).catch(() => null);
        }
      }
    }

    await recordAuditLog({
      action: `webhook.${event}`,
      targetType: 'Draft',
      targetId: String(draftPayload.id),
      metadata: {
        socialSetId,
        event,
        deliveryId,
        signaturePreviews: signatures,
        draftTitle: draftPayload.draft_title || draftPayload.preview,
      },
    });
  } catch {
    // non-blocking webhook log
  }
}
