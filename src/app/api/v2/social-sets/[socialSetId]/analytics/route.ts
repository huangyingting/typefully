import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { safeJsonParse, serializeDraft } from '@/lib/domain-helpers';

export async function GET(
  request: Request,
  context: { params: Promise<{ socialSetId: string }> }
) {
  const { socialSetId } = await context.params;
  const setId = Number(socialSetId);
  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || '30d';
  const format = searchParams.get('format') || 'json';

  const socialSet = await prisma.socialSet.findUnique({ where: { id: setId } });
  if (!socialSet) {
    return NextResponse.json({ error: 'Social set not found.' }, { status: 404 });
  }

  const publishedDrafts = await prisma.draft.findMany({
    where: { socialSetId: setId, status: 'published' },
    orderBy: { publishedAt: 'desc' },
  });

  const serializedPosts = publishedDrafts.map(serializeDraft);

  const daysCount =
    period === '7d' ? 7 : period === '90d' ? 90 : period === '1y' ? 365 : 30;

  let totalImpressions = 0;
  let totalLikes = 0;
  let totalReplies = 0;
  let totalReposts = 0;
  let totalBookmarks = 0;
  let totalProfileClicks = 0;

  for (const d of serializedPosts) {
    totalImpressions += Number(d.metrics?.impressions || 14200);
    totalLikes += Number(d.metrics?.likes || 420);
    totalReplies += Number(d.metrics?.replies || 64);
    totalReposts += Number(d.metrics?.reposts || 88);
    totalBookmarks += Number(d.metrics?.bookmarks || 135);
    totalProfileClicks += Number(d.metrics?.profileClicks || 310);
  }

  const scale = daysCount / 30;
  const kpis = {
    impressions: Math.round(totalImpressions * scale),
    impressions_delta: '+28.4%',
    engagement_rate: '5.4%',
    engagement_delta: '+0.9%',
    followers: 48920,
    followers_gained: Math.round(1420 * scale),
    followers_delta: '+14.2%',
    profile_clicks: Math.round(totalProfileClicks * scale),
    profile_clicks_delta: '+19.1%',
    likes: Math.round(totalLikes * scale),
    replies: Math.round(totalReplies * scale),
    reposts: Math.round(totalReposts * scale),
    bookmarks: Math.round(totalBookmarks * scale),
  };

  // Generate daily time series
  const dailySeries = [];
  const now = new Date();
  for (let i = Math.min(daysCount, 30) - 1; i >= 0; i--) {
    const dt = new Date(now.getTime() - i * 24 * 3600 * 1000);
    const seed = (i * 19 + setId * 7) % 17;
    const impressions = 2800 + seed * 410;
    const engagements = Math.round(impressions * (0.042 + (seed % 5) * 0.004));
    const followersAdded = 18 + (seed % 9) * 5;
    dailySeries.push({
      date: dt.toISOString().slice(0, 10),
      impressions,
      engagements,
      followers: 48920 - i * 38 + followersAdded,
      followers_added: followersAdded,
    });
  }

  // Generate Best Times to Post heatmap (7 days x 6 time blocks)
  const bestTimesHeatmap = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(
    (day, dIdx) => ({
      day,
      slots: [
        { hour: '08:00', score: dIdx < 5 ? 78 : 42 },
        { hour: '09:00', score: dIdx < 5 ? 96 : 55 },
        { hour: '12:00', score: dIdx < 5 ? 84 : 68 },
        { hour: '14:30', score: dIdx < 5 ? 94 : 62 },
        { hour: '17:30', score: dIdx < 5 ? 88 : 50 },
        { hour: '20:00', score: dIdx < 5 ? 71 : 79 },
      ],
    })
  );

  // CSV export support
  if (format === 'csv') {
    const rows = [
      ['Draft ID', 'Title', 'Published At', 'Impressions', 'Likes', 'Replies', 'Reposts', 'Bookmarks', 'Engagement Rate'].join(','),
      ...serializedPosts.map((p) =>
        [
          p.id,
          `"${(p.draft_title || p.preview || '').replace(/"/g, '""')}"`,
          p.published_at || '',
          p.metrics?.impressions || 0,
          p.metrics?.likes || 0,
          p.metrics?.replies || 0,
          p.metrics?.reposts || 0,
          p.metrics?.bookmarks || 0,
          `${p.metrics?.engagementRate || 5.2}%`,
        ].join(',')
      ),
    ].join('\n');

    return new NextResponse(rows, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="typefully-analytics-${socialSet.username}-${period}.csv"`,
      },
    });
  }

  return NextResponse.json({
    social_set: {
      id: socialSet.id,
      username: socialSet.username,
      name: socialSet.name,
      streak_days: socialSet.streakDays,
      longest_streak: socialSet.bestStreakDays,
      target_days_per_week: socialSet.streakGoalPerWeek,
    },
    period,
    kpis,
    daily_series: dailySeries,
    best_times_heatmap: bestTimesHeatmap,
    posts: serializedPosts,
  });
}
