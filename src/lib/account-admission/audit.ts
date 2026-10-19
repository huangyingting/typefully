import { prisma } from '@/lib/prisma';

export type RecordAuditLogInput = {
  actorId?: string | null;
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
};

export async function recordAuditLog(input: RecordAuditLogInput) {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId || input.actorUserId || null,
      actorEmail: input.actorEmail || null,
      actorRole: input.actorRole || null,
      action: input.action,
      targetType: input.targetType || null,
      targetId: input.targetId || null,
      metadataJson: JSON.stringify(input.metadata || {}),
      ipAddress: input.ipAddress || '127.0.0.1',
    },
  });
}

export async function listAuditLogs(
  optionsOrLimit: number | { action?: string; limit?: number } = 50
) {
  const limit =
    typeof optionsOrLimit === 'number'
      ? optionsOrLimit
      : optionsOrLimit.limit || 50;
  const action =
    typeof optionsOrLimit === 'object' ? optionsOrLimit.action : undefined;

  const rows = await prisma.auditLog.findMany({
    where: action ? { action } : undefined,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      actor: {
        select: { id: true, name: true, email: true, role: true },
      },
    },
  });

  return rows.map((r) => {
    let metadata = {};
    try {
      metadata = JSON.parse(r.metadataJson || '{}');
    } catch {
      metadata = {};
    }
    return {
      ...r,
      metadata,
    };
  });
}
