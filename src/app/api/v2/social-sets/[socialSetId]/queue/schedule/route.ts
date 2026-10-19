import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { safeJsonParse } from '@/lib/domain-helpers';

export async function GET(
  _request: Request,
  context: { params: Promise<{ socialSetId: string }> }
) {
  const { socialSetId } = await context.params;
  const socialSet = await prisma.socialSet.findUnique({
    where: { id: Number(socialSetId) },
  });
  if (!socialSet) {
    return NextResponse.json({ error: 'Social set not found.' }, { status: 404 });
  }
  return NextResponse.json({
    social_set_id: socialSet.id,
    timezone: socialSet.timezone,
    rules: safeJsonParse(socialSet.queueRulesJson, []),
  });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ socialSetId: string }> }
) {
  const { socialSetId } = await context.params;
  const body = await request.json().catch(() => ({}));
  const rules = Array.isArray(body.rules) ? body.rules : [];

  const updated = await prisma.socialSet.update({
    where: { id: Number(socialSetId) },
    data: {
      queueRulesJson: JSON.stringify(rules),
      ...(body.timezone ? { timezone: String(body.timezone) } : {}),
    },
  });

  return NextResponse.json({
    social_set_id: updated.id,
    timezone: updated.timezone,
    rules: safeJsonParse(updated.queueRulesJson, []),
  });
}
