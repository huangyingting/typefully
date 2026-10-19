import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { safeJsonParse } from '@/lib/domain-helpers';
import { getSessionUserFromRequest, recordAuditLog } from '@/lib/account-admission';

export async function GET() {
  const socialSets = await prisma.socialSet.findMany({
    include: { team: true, tags: true },
    orderBy: { id: 'asc' },
  });

  const results = socialSets.map((s) => ({
    id: s.id,
    username: s.username,
    name: s.name,
    bio: s.bio,
    profile_image_url: s.profileImageUrl,
    timezone: s.timezone,
    team: s.team ? { id: s.team.id, name: s.team.name } : null,
    platforms: safeJsonParse(s.platformsJson, {}),
    queue_rules: safeJsonParse(s.queueRulesJson, []),
    voice_profile: s.voiceProfileJson,
    default_global_prompt: s.voiceProfileJson,
    streak_days: s.streakDays,
    longest_streak: s.bestStreakDays,
    target_days_per_week: s.streakGoalPerWeek,
    allow_long_x_posts: false,
    tags: s.tags,
  }));

  return NextResponse.json({
    results,
    count: results.length,
    limit: 50,
    offset: 0,
    next: null,
    previous: null,
  });
}

export async function POST(request: Request) {
  try {
    const user = await getSessionUserFromRequest(request);
    if (user?.role === 'Viewer') {
      return NextResponse.json(
        { error: 'Viewers have read-only access.' },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const username = String(body.username || '')
      .trim()
      .toLowerCase()
      .replace(/^@/, '')
      .replace(/[^a-z0-9_-]/g, '');
    const name = String(body.name || username || 'New Brand').trim();
    const bio = String(body.bio || 'Publishing across social platforms with Typefully.');
    const timezone = String(body.timezone || 'America/New_York');

    if (!username) {
      return NextResponse.json({ error: 'Username is required.' }, { status: 400 });
    }

    const created = await prisma.socialSet.create({
      data: {
        username,
        name,
        bio,
        timezone,
        profileImageUrl: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(username)}`,
        ownerId: user?.id || 'u_fabrizio',
        teamId: body.teamId || 'team_typefully',
      },
    });

    await recordAuditLog({
      actorUserId: user?.id,
      actorEmail: user?.email,
      action: 'social_set.create',
      targetType: 'SocialSet',
      targetId: String(created.id),
      metadata: { username: created.username, name: created.name },
    });

    return NextResponse.json(
      {
        id: created.id,
        username: created.username,
        name: created.name,
        bio: created.bio,
        profile_image_url: created.profileImageUrl,
        timezone: created.timezone,
        platforms: safeJsonParse(created.platformsJson, {}),
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to create social set.' },
      { status: 400 }
    );
  }
}
