import React from 'react';
import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';

export default function VesperAiPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950">
      <PublicNav />
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-8">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
            ✨ MEET VESPER AI
          </span>
          <h1 className="text-4xl font-black">
            An AI writing partner that actually sounds like you
          </h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Vesper AI analyzes your highest-performing posts on 𝕏, LinkedIn, Threads, and Bluesky to help you brainstorm hooks, condense long notes, and address inline team comments without robotic clichés.
          </p>
          <div className="pt-2">
            <Link
              href="/write"
              className="inline-block px-5 py-3 rounded-2xl bg-orange-500 text-white text-sm font-bold"
            >
              Try Vesper AI in Composer →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            {
              title: 'Voice Profile Memory',
              desc: 'Configure your personal Voice Profile and Global System Prompt so Vesper never uses generic corporate buzzwords.',
            },
            {
              title: 'Custom Command Library',
              desc: 'Save reusable AI commands (e.g. "Turn into contrarian founder hook" or "Adapt for LinkedIn carousel") and trigger them via ⌘J.',
            },
            {
              title: 'Address Inline Comments',
              desc: 'Let Vesper automatically incorporate feedback left by your co-founders or editors on shared /t/[token] links.',
            },
          ].map((c) => (
            <div
              key={c.title}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-2 shadow-sm"
            >
              <h2 className="font-bold text-base">{c.title}</h2>
              <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                {c.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
