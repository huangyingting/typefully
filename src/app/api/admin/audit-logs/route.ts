import { NextResponse } from 'next/server';
import { listAuditLogs, requireAdminUser } from '@/lib/account-admission';

export async function GET(request: Request) {
  try {
    await requireAdminUser(request);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || undefined;
    const limit = Number(searchParams.get('limit') || 100);
    const auditLogs = await listAuditLogs({ action, limit });
    return NextResponse.json({ auditLogs });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Unauthorized' },
      { status: err?.status || 401 }
    );
  }
}
