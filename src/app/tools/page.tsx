import React from 'react';
import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';

const TOOLS_CATALOG = [
  {
    slug: 'linkedin-text-formatter',
    title: 'LinkedIn Text Formatter',
    category: 'Formatting',
    desc: 'Convert plain text into Unicode Bold, Italic, Bold Italic, Monospace, and Strikethrough for high-engagement LinkedIn & 𝕏 posts.',
  },
  {
    slug: 'twitter-character-counter',
    title: 'Multi-Platform Character Counter',
    category: 'Utilities',
    desc: 'Check real-time character limits across 𝕏 (280), Bluesky (300), Threads (500), Mastodon (500), and LinkedIn (3,000) with thread split calculation.',
  },
  {
    slug: 'ai-post-rewriter',
    title: 'Vesper AI Post Rewriter',
    category: 'AI Writing',
    desc: 'Transform rough ideas into punchy hooks, structured threads, or executive LinkedIn posts.',
  },
  {
    slug: 'hook-generator',
    title: 'Viral Thread Hook Generator',
    category: 'AI Writing',
    desc: 'Generate 3 high-curiosity opening lines tailored for technical founders and creators.',
  },
  {
    slug: 'thread-to-carousel',
    title: 'Thread to LinkedIn PDF Carousel',
    category: 'Repurposing',
    desc: 'Turn any multi-post 𝕏 thread into a swipeable LinkedIn PDF document.',
  },
];

export default function ToolsDirectoryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950">
      <PublicNav />
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800">
            FREE CREATOR UTILITIES
          </span>
          <h1 className="text-3xl font-black">Free Social Media Micro-Tools</h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400">
            Interactive formatting, character counting, and AI writing utilities crafted by the Typefully team.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {TOOLS_CATALOG.map((tool) => (
            <Link
              key={tool.slug}
              href={`/tools/${tool.slug}`}
              data-testid={`tool-card-${tool.slug}`}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm hover:border-orange-400 transition flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-bold uppercase text-slate-500">
                  {tool.category}
                </span>
                <h2 className="text-lg font-bold">{tool.title}</h2>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed">
                  {tool.desc}
                </p>
              </div>
              <span className="text-xs font-bold text-orange-600">
                Launch Free Tool →
              </span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
