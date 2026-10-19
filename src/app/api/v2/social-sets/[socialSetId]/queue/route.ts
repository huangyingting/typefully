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
  const daysCount = Number(searchParams.get('days') || 14);

  const socialSet = await prisma.socialSet.findUnique({ where: { id: setId } });
  if (!socialSet) {
    return NextResponse.json({ error: 'Social set not found.' }, { status: 404 });
  }

  const rules = safeJsonParse<Array<{ h: number; m: number; days: string[] }>>(
    socialSet.queueRulesJson,
    [
      { h: 9, m: 0, days: ['mon', 'tue', 'wed', 'thu', 'fri'] },
      { h: 14, m: 25, days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] },
    ]
  );

  const scheduledDrafts = await prisma.draft.findMany({
    where: {
      socialSetId: setId,
      status: { in: ['scheduled', 'planned'] },
    },
    orderBy: { scheduledDate: 'asc' },
  });

  const serializedDrafts = scheduledDrafts.map(serializeDraft);
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const now = new Date();
  const days = [];

  for (let i = 0; i < daysCount; i++) {
    const dateObj = new Date(now.getTime() + i * 24 * 3600 * 1000);
    const dateStr = dateObj.toISOString().slice(0, 10);
    const dayKey = dayNames[dateObj.getDay()];

    const dayDrafts = serializedDrafts.filter(
      (d) => d.scheduled_date && d.scheduled_date.slice(0, 10) === dateStr
    );

    const matchingRules = rules
      .filter((r) => r.days.includes(dayKey))
      .sort((a, b) => a.h * 60 + a.m - (b.h * 60 + b.m));

    const items: any[] = [];
    const matchedDraftIds = new Set<number>();

    for (const r of matchingRules) {
      const slotDt = new Date(dateObj);
      slotDt.setHours(r.h, r.m, 0, 0);
      const occupant = dayDrafts.find((d) => {
        if (matchedDraftIds.has(d.id) || !d.scheduled_date) return false;
        const dt = new Date(d.scheduled_date);
        return Math.abs(dt.getHours() * 60 + dt.getMinutes() - (r.h * 60 + r.m)) <= 45;
      });
      if (occupant) {
        matchedDraftIds.add(occupant.id);
      }
      items.push({
        at: slotDt.toISOString(),
        time_label: `${String(r.h).padStart(2, '0')}:${String(r.m).padStart(2, '0')}`,
        is_rule_slot: true,
        draft: occupant || null,
      });
    }

    // Add any custom-time scheduled/planned drafts on this date
    for (const d of dayDrafts) {
      if (!matchedDraftIds.has(d.id) && d.scheduled_date) {
        const dt = new Date(d.scheduled_date);
        items.push({
          at: d.scheduled_date,
          time_label: `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`,
          is_rule_slot: false,
          draft: d,
        });
      }
    }

    items.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

    days.push({
      date: dateStr,
      day_name: dayKey,
      items,
    });
  }

  return NextResponse.json({
    social_set_id: setId,
    timezone: socialSet.timezone,
    rules,
    days,
    scheduled_drafts: serializedDrafts,
  });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ socialSetId: string }> }
) {
  const { socialSetId } = await context.params;
  const setId = Number(socialSetId);
  const body = await request.json().catch(() => ({}));

  // Reorder / swap two scheduled drafts or move a draft to a target slot
  if (body.swapDraftIdA && body.swapDraftIdB) {
    const [draftA, draftB] = await Promise.all([
      prisma.draft.findFirst({ where: { id: Number(body.swapDraftIdA), socialSetId: setId } }),
      prisma.draft.findFirst({ where: { id: Number(body.swapDraftIdB), socialSetId: setId } }),
    ]);

    if (!draftA || !draftB) {
      return NextResponse.json({ error: 'Drafts not found.' }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.draft.update({
        where: { id: draftA.id },
        data: { scheduledDate: draftB.scheduledDate },
      }),
      prisma.draft.update({
        where: { id: draftB.id },
        data: { scheduledDate: draftA.scheduledDate },
      }),
    ]);

    return NextResponse.json({ ok: true });
  }

  if (body.draftId && body.targetSlotIso) {
    const updated = await prisma.draft.update({
      where: { id: Number(body.draftId) },
      data: {
        scheduledDate: new Date(body.targetSlotIso),
        status: body.asPlanned ? 'planned' : 'scheduled',
        publishState: body.asPlanned ? 'planned' : 'scheduled',
      },
    });
    return NextResponse.json({ draft: serializeDraft(updated) });
  }

  return NextResponse.json({ error: 'Invalid queue operation.' }, { status: 400 });
}
