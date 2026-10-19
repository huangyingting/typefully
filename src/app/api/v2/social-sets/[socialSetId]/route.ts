import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { safeJsonParse } from '@/lib/domain-helpers';
import { getSessionUserFromRequest, recordAuditLog } from '@/lib/account-admission';

export async function GET(
  _request: Request,
  context: { params: Promise<{ socialSetId: string }> }
) {
  const { socialSetId } = await context.params;
  const id = Number(socialSetId);
  const socialSet = await prisma.socialSet.findUnique({
    where: { id },
    include: { team: true, tags: true },
  });

  if (!socialSet) {
    return NextResponse.json({ error: 'Social set not found.' }, { status: 404 });
  }

  return NextResponse.json({
    id: socialSet.id,
    username: socialSet.username,
    name: socialSet.name,
    bio: socialSet.bio,
    profile_image_url: socialSet.profileImageUrl,
    timezone: socialSet.timezone,
    team: socialSet.team ? { id: socialSet.team.id, name: socialSet.team.name } : null,
    platforms: safeJsonParse(socialSet.platformsJson, {}),
    queue_rules: safeJsonParse(socialSet.queueRulesJson, []),
    voice_profile: socialSet.voiceProfileJson,
    default_global_prompt: socialSet.voiceProfileJson,
    streak_days: socialSet.streakDays,
    longest_streak: socialSet.bestStreakDays,
    target_days_per_week: socialSet.streakGoalPerWeek,
    allow_long_x_posts: false,
    tags: socialSet.tags,
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ socialSetId: string }> }
) {
  try {
    const user = await getSessionUserFromRequest(request);
    if (user?.role === 'Viewer') {
      return NextResponse.json(
        { error: 'Viewers cannot modify social set settings.' },
        { status: 403 }
      );
    }

    const { socialSetId } = await context.params;
    const id = Number(socialSetId);
    const body = await request.json().catch(() => ({}));

    const existing = await prisma.socialSet.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Social set not found.' }, { status: 404 });
    }

    const updated = await prisma.socialSet.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: String(body.name) } : {}),
        ...(body.bio !== undefined ? { bio: String(body.bio) } : {}),
        ...(body.timezone !== undefined ? { timezone: String(body.timezone) } : {}),
        ...(body.voice_profile !== undefined
          ? { voiceProfileJson: String(body.voice_profile) }
          : {}),
        ...(body.target_days_per_week !== undefined
          ? { streakGoalPerWeek: Number(body.target_days_per_week) }
          : {}),
        ...(body.platforms !== undefined
          ? { platformsJson: JSON.stringify(body.platforms) }
          : {}),
        ...(body.queue_rules !== undefined
          ? { queueRulesJson: JSON.stringify(body.queue_rules) }
          : {}),
      },
    });

    await recordAuditLog({
      actorUserId: user?.id,
      actorEmail: user?.email,
      action: 'social_set.update',
      targetType: 'SocialSet',
      targetId: String(id),
      metadata: { updatedKeys: Object.keys(body) },
    });

    return NextResponse.json({
      id: updated.id,
      username: updated.username,
      name: updated.name,
      bio: updated.bio,
      timezone: updated.timezone,
      platforms: safeJsonParse(updated.platformsJson, {}),
      queue_rules: safeJsonParse(updated.queueRulesJson, []),
      voice_profile: updated.voiceProfileJson,
      default_global_prompt: updated.voiceProfileJson,
      allow_long_x_posts: false,
      target_days_per_week: updated.streakGoalPerWeek,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update social set.' },
      { status: 400 }
    );
  }
}
