import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionUserFromRequest, hashOpaqueToken, recordAuditLog } from '@/lib/account-admission';
import { randomBytes } from 'node:crypto';

export async function GET() {
  const [apiKeys, webhooks, teams] = await Promise.all([
    prisma.apiKey.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.webhookEndpoint.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.team.findMany({
      include: { members: { include: { user: true } }, socialSets: true },
    }),
  ]);

  return NextResponse.json({ apiKeys, webhooks, teams });
}

export async function POST(request: Request) {
  const user = await getSessionUserFromRequest(request);
  if (user?.role === 'Viewer') {
    return NextResponse.json(
      { error: 'Viewers cannot modify workspace settings.' },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const kind = String(body.kind || '');

  if (kind === 'api_key') {
    const label = String(body.label || body.name || 'CLI / MCP Token').trim();
    const rawSecret = `tf_live_${randomBytes(18).toString('hex')}`;
    const created = await prisma.apiKey.create({
      data: {
        userId: user?.id || 'u_fabrizio',
        name: label,
        keyPrefix: rawSecret.slice(0, 14),
        keyHash: hashOpaqueToken(rawSecret),
      },
    });

    await recordAuditLog({
      actorUserId: user?.id,
      actorEmail: user?.email,
      action: 'settings.api_key.create',
      targetType: 'ApiKey',
      targetId: created.id,
      metadata: { label },
    });

    return NextResponse.json(
      { apiKey: { ...created, label: created.name }, rawKey: rawSecret },
      { status: 201 }
    );
  }

  if (kind === 'webhook') {
    const url = String(body.url || '').trim();
    const name = String(body.name || 'Outbound Webhook').trim();
    const socialSetId = Number(body.socialSetId || 1);
    const events = Array.isArray(body.events)
      ? body.events
      : ['draft.created', 'draft.scheduled', 'draft.published'];

    if (!url) {
      return NextResponse.json({ error: 'Webhook URL is required.' }, { status: 400 });
    }

    const secret = `whsec_${randomBytes(16).toString('hex')}`;
    const created = await prisma.webhookEndpoint.create({
      data: {
        socialSetId,
        name,
        url,
        secret,
        eventsJson: JSON.stringify(events),
        isActive: true,
      },
    });

    await recordAuditLog({
      actorUserId: user?.id,
      actorEmail: user?.email,
      action: 'settings.webhook.create',
      targetType: 'WebhookEndpoint',
      targetId: created.id,
      metadata: { url, events },
    });

    return NextResponse.json({ webhook: created }, { status: 201 });
  }

  if (kind === 'team') {
    const name = String(body.name || '').trim();
    if (!name) {
      return NextResponse.json({ error: 'Team name is required.' }, { status: 400 });
    }
    const slug = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
    const team = await prisma.team.create({
      data: {
        name,
        slug,
        members: {
          create: {
            userId: user?.id || 'u_fabrizio',
            role: 'Admin',
          },
        },
      },
      include: { members: { include: { user: true } } },
    });

    return NextResponse.json({ team }, { status: 201 });
  }

  return NextResponse.json({ error: 'Unsupported settings operation.' }, { status: 400 });
}

export async function DELETE(request: Request) {
  const user = await getSessionUserFromRequest(request);
  const { searchParams } = new URL(request.url);
  const kind = searchParams.get('kind');
  const id = searchParams.get('id') || '';

  if (kind === 'api_key' && id) {
    await prisma.apiKey.delete({ where: { id } });
    await recordAuditLog({
      actorUserId: user?.id,
      actorEmail: user?.email,
      action: 'settings.api_key.revoke',
      targetType: 'ApiKey',
      targetId: id,
    });
    return NextResponse.json({ ok: true });
  }

  if (kind === 'webhook' && id) {
    await prisma.webhookEndpoint.delete({ where: { id } });
    await recordAuditLog({
      actorUserId: user?.id,
      actorEmail: user?.email,
      action: 'settings.webhook.delete',
      targetType: 'WebhookEndpoint',
      targetId: id,
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'Invalid delete target.' }, { status: 400 });
}
