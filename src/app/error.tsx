'use client';

import React from 'react';
import Link from 'next/link';

export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-stone-50 dark:bg-zinc-950 text-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-700 font-black flex items-center justify-center">
        !
      </div>
      <div className="space-y-1 max-w-md">
        <h1 className="text-xl font-bold">Something went wrong</h1>
        <p className="text-xs text-slate-500">
          {error?.message || 'An unexpected error occurred while rendering this view.'}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => reset()}
          className="px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold"
        >
          Try Again
        </button>
        <Link
          href="/write"
          className="px-4 py-2 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs font-semibold"
        >
          Back to Workspace
        </Link>
      </div>
    </div>
  );
}
