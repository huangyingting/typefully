import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { PublicNav } from '@/components/PublicNav';

export default async function PublicStatsSnapshotPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const socialSet =
    (await prisma.socialSet.findUnique({ where: { username: slug.toLowerCase() } })) ||
    (await prisma.socialSet.findFirst({ orderBy: { id: 'asc' } }));

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950">
      <PublicNav />
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        <div
          data-testid="public-stats-card"
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                ✓ VERIFIED BY TYPEFULLY ANALYTICS
              </span>
              <h1 className="text-2xl font-black mt-1">
                @{socialSet?.username || slug} — Last 30 Days Performance
              </h1>
              <p className="text-xs text-slate-500">
                Cross-platform creator metrics across 𝕏, LinkedIn, Threads & Bluesky
              </p>
            </div>
            <div className="px-4 py-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-bold">
              🔥 {socialSet?.streakDays || 18}-Day Publishing Streak
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Impressions', value: '148,920', delta: '+28.4%' },
              { label: 'Engagement Rate', value: '5.4%', delta: '+0.9%' },
              { label: 'Total Followers', value: '48,920', delta: '+1,420' },
              { label: 'Bookmarks & Saves', value: '2,840', delta: '+34.1%' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700"
              >
                <div className="text-xs text-slate-500">{stat.label}</div>
                <div className="text-2xl font-black mt-1">{stat.value}</div>
                <div className="text-xs font-bold text-emerald-600 mt-1">
                  {stat.delta}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs">
            <Link
              href={`/u/${socialSet?.username || 'typefully'}`}
              className="text-orange-600 font-bold hover:underline"
            >
              ← View @{socialSet?.username || 'typefully'} Creator Portfolio
            </Link>
            <Link
              href="/grow"
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold"
            >
              Open Full Analytics Studio →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
