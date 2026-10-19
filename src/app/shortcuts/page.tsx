import React from 'react';
import { PublicNav } from '@/components/PublicNav';

export default function ShortcutsPage() {
  const groups = [
    {
      title: 'Global Navigation',
      items: [
        ['Open Command Bar', '⌘ K'],
        ['New Draft', 'C'],
        ['Go to Write View', 'G then W'],
        ['Go to Calendar View', 'G then C'],
        ['Go to Smart Queue', 'G then Q'],
        ['Go to Grow Analytics', 'G then A'],
      ],
    },
    {
      title: 'Thread Composer & Vesper AI',
      items: [
        ['Split Post into Thread', 'Enter 3x'],
        ['Publish or Schedule Draft', '⌘ Enter'],
        ['Trigger Vesper AI Assistant', '⌘ J'],
        ['Bold / Italic Formatting', '⌘ B / ⌘ I'],
        ['Toggle Multi-Platform Preview', '⌘ P'],
      ],
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950">
      <PublicNav />
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-black">Keyboard Shortcuts</h1>
          <p className="text-xs text-slate-500 mt-1">
            Typefully is designed for keyboard-first speed. Press <kbd className="px-1.5 py-0.5 rounded bg-slate-200">?</kbd> anywhere in the workspace to open this reference.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {groups.map((g) => (
            <div
              key={g.title}
              className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 shadow-sm"
            >
              <h2 className="text-sm font-bold">{g.title}</h2>
              <div className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                {g.items.map(([label, key]) => (
                  <div
                    key={label}
                    className="py-2 flex items-center justify-between"
                  >
                    <span>{label}</span>
                    <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-mono font-semibold">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
