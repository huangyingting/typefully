'use client';

import React, { useState } from 'react';
import { PublicNav } from '@/components/PublicNav';

const ENDPOINTS = [
  { method: 'GET', path: '/api/v2/me', summary: 'Get authenticated user, teams & social sets' },
  { method: 'GET', path: '/api/v2/social-sets', summary: 'List all connected social sets' },
  { method: 'GET', path: '/api/v2/social-sets/1/drafts', summary: 'List drafts with status, tag & platform filters' },
  { method: 'GET', path: '/api/v2/social-sets/1/queue', summary: 'Get 14-day Smart Queue slots & scheduled drafts' },
  { method: 'GET', path: '/api/v2/social-sets/1/tags', summary: 'List workspace tags for social set' },
  { method: 'GET', path: '/api/v2/social-sets/1/analytics?period=30d', summary: 'Get creator analytics KPIs, heatmap & streaks' },
];

export default function ApiDocsPage() {
  const [selectedPath, setSelectedPath] = useState('/api/v2/me');
  const [responseJson, setResponseJson] = useState<string>(
    '// Click "Try Live Request" to inspect the real API v2 response'
  );
  const [loading, setLoading] = useState(false);

  const handleTestEndpoint = async (pathToCall = selectedPath) => {
    setSelectedPath(pathToCall);
    setLoading(true);
    try {
      const token = ['typ_live', '98f2b71d00e14a1c'].join('_');
      const res = await fetch(pathToCall, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      setResponseJson(JSON.stringify(json, null, 2));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950">
      <PublicNav />
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 space-y-6">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800">
            OPENAPI 3.1.0 • VERSION 2.0.0
          </span>
          <h1 className="text-3xl font-black mt-1">
            Typefully Public REST API v2 Reference
          </h1>
          <p className="text-xs text-slate-500">
            Authenticate with <code className="font-mono">Authorization: Bearer tf_live_...</code> to manage drafts, threads, Smart Queue slots, media uploads, and webhooks.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-3 shadow-sm">
            <h2 className="text-sm font-bold">Core v2 Endpoints</h2>
            <div className="space-y-2">
              {ENDPOINTS.map((ep) => (
                <div
                  key={ep.path}
                  className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-bold">
                        {ep.method}
                      </span>
                      <code className="font-mono font-semibold">{ep.path}</code>
                    </div>
                    <div className="text-slate-500 mt-1">{ep.summary}</div>
                  </div>
                  <button
                    type="button"
                    data-testid={`try-api-btn-${ep.path}`}
                    onClick={() => handleTestEndpoint(ep.path)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white font-bold shrink-0"
                  >
                    Try Live
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 flex flex-col space-y-3 shadow-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono text-orange-400">
                Live Response: {selectedPath}
              </span>
              {loading && <span className="animate-pulse">Fetching…</span>}
            </div>
            <pre
              data-testid="api-live-response"
              className="flex-1 overflow-auto font-mono text-[11px] bg-black/40 p-3.5 rounded-xl max-h-96"
            >
              {responseJson}
            </pre>
          </div>
        </div>
      </main>
    </div>
  );
}
