'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';

export default function PricingPage() {
  const [billing, setBilling] = useState<'yearly' | 'monthly'>('yearly');

  const tiers = [
    {
      name: 'Free',
      price: '$0',
      desc: 'For creators getting started with threads and scheduling.',
      features: [
        '1 Social Set (@handle)',
        'Cross-post to 𝕏, LinkedIn, Threads & Bluesky',
        'Basic Queue scheduling',
        'Public creator portfolio wall',
      ],
    },
    {
      name: 'Creator',
      price: billing === 'yearly' ? '$12.50' : '$19',
      desc: 'For active daily publishers growing their audience.',
      features: [
        'Up to 3 Social Sets',
        'Unlimited Scheduled & Planned drafts',
        'Vesper AI writing commands',
        'Auto-Plug & Auto-Repost automations',
        'LinkedIn PDF Carousel publishing',
      ],
      popular: true,
    },
    {
      name: 'Team',
      price: billing === 'yearly' ? '$29' : '$39',
      desc: 'For collaborative marketing teams and startups.',
      features: [
        'Up to 10 Social Sets',
        'Invite-only RBAC (Admin, Editor, Viewer)',
        'Inline draft review comments & approvals',
        'Auto-DM Lead Magnet campaigns',
        'Public REST API v2, MCP & Webhooks',
      ],
    },
    {
      name: 'Agency',
      price: billing === 'yearly' ? '$79' : '$99',
      desc: 'For multi-brand agencies managing client executives.',
      features: [
        'Unlimited Social Sets & Team Workspaces',
        'Dedicated Audit Logging & SSO governance',
        'Custom Vesper AI Voice Profiles per client',
        'Priority API rate limits & SLA',
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950">
      <PublicNav />
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-black">
            Simple, transparent pricing for every creator
          </h1>
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-zinc-800 text-xs font-bold">
            <button
              type="button"
              data-testid="billing-yearly-btn"
              onClick={() => setBilling('yearly')}
              className={`px-4 py-1.5 rounded-lg ${
                billing === 'yearly'
                  ? 'bg-white dark:bg-zinc-900 shadow-sm text-orange-600'
                  : 'text-slate-600'
              }`}
            >
              Yearly (Save 34%)
            </button>
            <button
              type="button"
              data-testid="billing-monthly-btn"
              onClick={() => setBilling('monthly')}
              className={`px-4 py-1.5 rounded-lg ${
                billing === 'monthly'
                  ? 'bg-white dark:bg-zinc-900 shadow-sm text-orange-600'
                  : 'text-slate-600'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              data-testid={`pricing-tier-${tier.name.toLowerCase()}`}
              className={`bg-white dark:bg-zinc-900 rounded-2xl p-6 border flex flex-col justify-between space-y-5 shadow-sm ${
                tier.popular
                  ? 'border-2 border-orange-500 ring-4 ring-orange-500/10'
                  : 'border-slate-200 dark:border-zinc-800'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold">{tier.name}</h2>
                  {tier.popular && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800">
                      MOST POPULAR
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black">{tier.price}</span>
                  <span className="text-xs text-slate-500">/month</span>
                </div>
                <p className="text-xs text-slate-500">{tier.desc}</p>
                <ul className="space-y-2 pt-2 text-xs">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link
                href="/write"
                className={`w-full py-2.5 rounded-xl text-center text-xs font-bold ${
                  tier.popular
                    ? 'bg-orange-500 text-white'
                    : 'bg-slate-900 text-white dark:bg-zinc-800'
                }`}
              >
                Get Started with {tier.name}
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
