import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyExplicitBearerOrSession } from '@/lib/account-admission';
import { safeJsonParse } from '@/lib/domain-helpers';

export async function GET(request: Request) {
  let activeUser: Awaited<ReturnType<typeof verifyExplicitBearerOrSession>> = null;
  try {
    activeUser = await verifyExplicitBearerOrSession(request);
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Invalid or revoked API key.' },
      { status: err?.status || 401 }
    );
  }

  // Fallback to default seeded admin for unauthenticated demo inspection if needed, while exposing auth state
  const dbUser = activeUser
    ? await prisma.user.findUnique({ where: { id: activeUser.id } })
    : await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });

  const [socialSets, teams, apiKeys, webhooks, aiPrompts] = await Promise.all([
    prisma.socialSet.findMany({
      include: { team: true, tags: true },
      orderBy: { id: 'asc' },
    }),
    prisma.team.findMany({
      include: { members: { include: { user: true } } },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.webhookEndpoint.findMany({
      orderBy: { createdAt: 'desc' },
    }),
    prisma.aiPromptCommand.findMany({
      orderBy: { createdAt: 'asc' },
    }),
  ]);

  return NextResponse.json({
    authenticated: Boolean(activeUser),
    auth_method: activeUser?.authMethod || null,
    user: dbUser
      ? {
          id: dbUser.id,
          name: dbUser.name || 'Creator',
          email: dbUser.email,
          role: dbUser.role,
          status: dbUser.status,
          profile_image_url:
            dbUser.image ||
            'https://api.dicebear.com/7.x/shapes/svg?seed=typefully',
          signup_date: dbUser.createdAt.toISOString(),
        }
      : null,
    social_sets: socialSets.map((s) => ({
      id: s.id,
      username: s.username,
      name: s.name,
      bio: s.bio,
      profile_image_url: s.profileImageUrl,
      timezone: s.timezone,
      team: s.team ? { id: s.team.id, name: s.team.name, slug: s.team.slug } : null,
      platforms: safeJsonParse(s.platformsJson, {}),
      queue_rules: safeJsonParse(s.queueRulesJson, []),
      voice_profile: s.voiceProfileJson,
      default_global_prompt: s.voiceProfileJson,
      streak_days: s.streakDays,
      longest_streak: s.bestStreakDays,
      target_days_per_week: s.streakGoalPerWeek,
      allow_long_x_posts: false,
      tags: s.tags,
    })),
    teams,
    api_keys: apiKeys.map((k) => ({ ...k, label: k.name })),
    webhooks,
    ai_prompts: aiPrompts.map((p) => ({
      ...p,
      title: p.label,
      prompt: p.instruction,
      isDefault: p.isBuiltIn,
    })),
  });
}
