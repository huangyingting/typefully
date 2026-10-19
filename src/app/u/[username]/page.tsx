import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { serializeDraft } from '@/lib/domain-helpers';
import { PublicNav } from '@/components/PublicNav';

export default async function PublicProfileWallPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const cleanHandle = username.replace(/^@/, '').toLowerCase();

  const socialSet =
    (await prisma.socialSet.findUnique({ where: { username: cleanHandle } })) ||
    (await prisma.socialSet.findFirst({ orderBy: { id: 'asc' } }));

  const publishedDrafts = socialSet
    ? await prisma.draft.findMany({
        where: { socialSetId: socialSet.id, status: 'published' },
        orderBy: { publishedAt: 'desc' },
      })
    : [];

  const threads = publishedDrafts.map(serializeDraft);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950">
      <PublicNav />
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        <div
          data-testid="creator-wall-header"
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4"
        >
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800">
              PUBLIC CREATOR PORTFOLIO
            </span>
            <h1 className="text-2xl font-black">
              {socialSet?.name || 'Typefully Official'} (@
              {socialSet?.username || cleanHandle})
            </h1>
            <p className="text-xs text-slate-500 max-w-xl">{socialSet?.bio}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/stats/${socialSet?.username || 'typefully'}`}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-bold"
            >
              📈 Public Stats
            </Link>
            <Link
              href="/write"
              className="px-3.5 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold"
            >
              Write on Typefully →
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Published Threads & Essays ({threads.length})
          </h2>

          {threads.map((item) => (
            <article
              key={item.id}
              data-testid={`wall-thread-${item.id}`}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-bold text-slate-900 dark:text-white">
                  {item.draft_title || 'Published Thread'}
                </span>
                <span>
                  {item.published_at
                    ? new Date(item.published_at).toLocaleDateString()
                    : 'Published'}
                </span>
              </div>
              <div className="space-y-2.5">
                {(item.posts || []).map((p: any, idx: number) => (
                  <p
                    key={p.id || idx}
                    className="text-sm text-slate-700 dark:text-zinc-200 whitespace-pre-wrap leading-relaxed"
                  >
                    {p.text}
                  </p>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex items-center justify-between text-xs text-slate-500">
                <span>
                  👁️ {(item.metrics?.impressions || 18400).toLocaleString()} impressions • ❤️{' '}
                  {item.metrics?.likes || 610} likes
                </span>
                <Link
                  href={`/t/${item.share_token}`}
                  className="text-orange-600 font-semibold hover:underline"
                >
                  Read Thread Permalink →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
