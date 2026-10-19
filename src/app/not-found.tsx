import React from 'react';
import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950">
      <PublicNav />
      <main
        data-testid="not-found-page"
        className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-5"
      >
        <div className="w-14 h-14 rounded-2xl bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 font-black text-xl flex items-center justify-center">
          404
        </div>
        <div className="space-y-1.5 max-w-md">
          <h1 className="text-2xl font-extrabold">This page drifted out of the queue</h1>
          <p className="text-xs text-slate-500">
            The draft, creator profile, or route you requested could not be found.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/write"
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-orange-500 text-white text-xs font-bold"
          >
            Open Composer →
          </Link>
          <Link
            href="/"
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold"
          >
            Return Home
          </Link>
        </div>
      </main>
    </div>
  );
}
