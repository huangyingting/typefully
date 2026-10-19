import React from 'react';
import { PublicNav } from '@/components/PublicNav';

const RELEASES = [
  {
    date: 'March 2026',
    version: 'v2.4.0',
    title: 'Typefully Public API v2, MCP Server & Inert Planned Drafts',
    items: [
      'Launched OpenAPI 3.1.0 REST API v2 (/api/v2/social-sets, drafts, queue, tags, media, analytics).',
      'Introduced Planned Drafts: hold a slot on your Calendar and Smart Queue without auto-publishing until confirmed.',
      'Added Invite-Only RBAC governance with single-use SHA-256 tokens, rotation, revocation, and immutable AuditLog.',
    ],
  },
  {
    date: 'February 2026',
    version: 'v2.3.0',
    title: 'Vesper AI Custom Prompt Library & LinkedIn PDF Carousels',
    items: [
      'Create custom Vesper AI commands and reset to factory defaults anytime.',
      'Upload multi-slide PDF documents for native LinkedIn Carousel posts.',
      'Added real-time Poll + Media conflict validation and per-platform option length checks.',
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950">
      <PublicNav />
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        <h1 className="text-3xl font-black">Product Changelog</h1>
        <div className="space-y-4">
          {RELEASES.map((rel) => (
            <div
              key={rel.version}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 space-y-3 shadow-sm"
            >
              <div className="flex items-center gap-2 text-xs">
                <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 font-bold">
                  {rel.version}
                </span>
                <span className="text-slate-500">{rel.date}</span>
              </div>
              <h2 className="text-lg font-bold">{rel.title}</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-zinc-400">
                {rel.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
