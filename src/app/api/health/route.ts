import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { accountAdmissionMode } from '@/lib/account-admission';

export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    const latencyMs = Date.now() - startedAt;
    return NextResponse.json({
      status: 'ok',
      service: 'typefully-social-publishing-platform',
      version: '2.0.0',
      database: 'connected',
      dbLatencyMs: latencyMs,
      admissionMode: accountAdmissionMode(),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: 'degraded',
        service: 'typefully-social-publishing-platform',
        database: 'disconnected',
        error: err?.message || 'Database health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
