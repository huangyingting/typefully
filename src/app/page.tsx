import React from 'react';
import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950">
      <PublicNav />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-100/80 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300 text-xs font-semibold">
            <span>✨ New: Typefully API v2, MCP Server & Vesper AI</span>
            <Link href="/ai-agents" className="underline font-bold">
              Explore AI Agents →
            </Link>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-[1.08]">
            Write, schedule, and grow across{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
              𝕏, LinkedIn, Threads & Bluesky
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 dark:text-zinc-400">
            The calm, keyboard-first social publishing studio built for creators, founders, and high-velocity marketing teams.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/write"
              data-testid="hero-open-composer-cta"
              className="px-6 py-3.5 rounded-2xl bg-slate-900 dark:bg-orange-500 text-white font-bold text-sm shadow-md hover:opacity-95 transition"
            >
              Open Composer Workspace →
            </Link>
            <Link
              href="/t/share-mcp-launch-2026"
              className="px-5 py-3.5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 font-semibold text-sm hover:bg-slate-50 transition"
            >
              View Live Shared Thread
            </Link>
          </div>

          {/* Supported Networks Strip */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <span>Cross-post natively to:</span>
            {[
              '𝕏 (Twitter)',
              'LinkedIn & PDF Carousels',
              'Threads',
              'Bluesky',
              'Mastodon',
              'Substack Notes',
              '𝕏 Articles',
            ].map((net) => (
              <span
                key={net}
                className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300"
              >
                {net}
              </span>
            ))}
          </div>
        </section>

        {/* Feature Grid */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Multi-Platform Thread Composer',
              desc: 'Write once and preview side-by-side for 𝕏, LinkedIn, Threads, Bluesky, and Mastodon. Automatic thread numbering, polls, and LinkedIn PDF carousels.',
              href: '/write',
              cta: 'Try Composer →',
            },
            {
              title: 'Smart Queue & Inert Planned Drafts',
              desc: 'Hold placeholder dates on your Content Calendar with Planned drafts that never auto-publish until you click Confirm Schedule.',
              href: '/calendar',
              cta: 'Open Calendar →',
            },
            {
              title: 'Vesper AI & Inline Team Review',
              desc: 'Share public review links (/t/token), collect inline highlighted comments, and let Vesper AI rewrite or threadify in your exact voice.',
              href: '/ai',
              cta: 'Explore Vesper AI →',
            },
            {
              title: 'Creator Analytics & Publishing Streaks',
              desc: 'Track impressions, engagement rate, follower growth, best times to post heatmaps, and one-click repurposing of top performers.',
              href: '/grow',
              cta: 'View Analytics →',
            },
            {
              title: 'Public API v2, Webhooks & MCP',
              desc: 'Automate draft creation and queue scheduling from Claude Code, Cursor, Raycast, or Zapier with REST API v2 and HMAC webhooks.',
              href: '/docs/api',
              cta: 'Read API v2 Docs →',
            },
            {
              title: 'Invite-Only RBAC & Security Audit Trail',
              desc: 'Enterprise-grade single-use expiring invitation tokens, Admin/Editor/Viewer roles, token rotation, revocation, and full audit logging.',
              href: '/admin/invitations',
              cta: 'Admin Governance →',
            },
          ].map((card) => (
            <div
              key={card.title}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <h2 className="text-lg font-bold">{card.title}</h2>
                <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {card.desc}
                </p>
              </div>
              <Link
                href={card.href}
                className="text-xs font-bold text-orange-600 dark:text-orange-400 hover:underline"
              >
                {card.cta}
              </Link>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
