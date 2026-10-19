'use client';

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';

function toUnicodeVariant(
  str: string,
  upperStart: number,
  lowerStart: number,
  digitStart?: number
): string {
  return Array.from(str)
    .map((ch) => {
      const code = ch.charCodeAt(0);
      if (code >= 65 && code <= 90) {
        return String.fromCodePoint(upperStart + (code - 65));
      }
      if (code >= 97 && code <= 122) {
        return String.fromCodePoint(lowerStart + (code - 97));
      }
      if (digitStart && code >= 48 && code <= 57) {
        return String.fromCodePoint(digitStart + (code - 48));
      }
      return ch;
    })
    .join('');
}

export default function InteractiveToolPage() {
  const params = useParams<{ slug: string }>();
  const slug = String(params?.slug || 'linkedin-text-formatter');

  const [inputText, setInputText] = useState(
    'Typefully 2.0 is live: Write once, schedule across X, LinkedIn, Threads & Bluesky with Vesper AI.'
  );
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const unicodeVariants = useMemo(() => {
    return [
      {
        label: 'Sans-Serif Bold',
        text: toUnicodeVariant(inputText, 0x1d5d4, 0x1d5ee, 0x1d7ec),
      },
      {
        label: 'Sans-Serif Italic',
        text: toUnicodeVariant(inputText, 0x1d608, 0x1d622),
      },
      {
        label: 'Sans-Serif Bold Italic',
        text: toUnicodeVariant(inputText, 0x1d63c, 0x1d656),
      },
      {
        label: 'Monospace',
        text: toUnicodeVariant(inputText, 0x1d670, 0x1d68a, 0x1d7f6),
      },
      {
        label: 'Strikethrough',
        text: Array.from(inputText)
          .map((c) => `${c}\u0336`)
          .join(''),
      },
    ];
  }, [inputText]);

  const charStats = useMemo(() => {
    const len = inputText.length;
    const words = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
    return {
      chars: len,
      words,
      xThreadsNeeded: Math.max(1, Math.ceil(len / 280)),
      platforms: [
        { name: '𝕏 (Twitter)', limit: 280, remaining: 280 - len },
        { name: 'Bluesky', limit: 300, remaining: 300 - len },
        { name: 'Threads', limit: 500, remaining: 500 - len },
        { name: 'Mastodon', limit: 500, remaining: 500 - len },
        { name: 'LinkedIn', limit: 3000, remaining: 3000 - len },
      ],
    };
  }, [inputText]);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950">
      <PublicNav />
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/tools"
              className="text-xs font-bold text-orange-600 hover:underline"
            >
              ← All Free Tools
            </Link>
            <h1 className="text-2xl font-black mt-1 capitalize">
              {slug.replace(/-/g, ' ')}
            </h1>
          </div>
          <Link
            href="/write"
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
          >
            Open in Typefully Composer →
          </Link>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
            Input Post Text
          </label>
          <textarea
            rows={4}
            data-testid="tool-input-textarea"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-orange-500"
          />

          {/* Live Platform Character Limits Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
            {charStats.platforms.map((p) => (
              <div
                key={p.name}
                className={`p-2.5 rounded-xl border text-xs ${
                  p.remaining < 0
                    ? 'bg-red-50 border-red-300 text-red-800'
                    : 'bg-slate-50 dark:bg-zinc-800/70 border-slate-200 dark:border-zinc-700'
                }`}
              >
                <div className="font-bold">{p.name}</div>
                <div className="font-mono text-[11px] mt-0.5">
                  {charStats.chars}/{p.limit} ({p.remaining} left)
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Unicode Formatted Outputs */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold">
            Formatted Unicode Variants (Click to Copy)
          </h2>
          <div className="space-y-2.5">
            {unicodeVariants.map((variant) => (
              <div
                key={variant.label}
                data-testid={`unicode-variant-${variant.label.toLowerCase().replace(/\s+/g, '-')}`}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="font-bold text-slate-500">{variant.label}</div>
                  <div className="text-sm break-words">{variant.text}</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(variant.text);
                    setCopiedLabel(variant.label);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-semibold shrink-0"
                >
                  {copiedLabel === variant.label ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
