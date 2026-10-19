import React from 'react';
import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';

export default function AiAgentsMcpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950">
      <PublicNav />
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-8">
        <div className="space-y-3">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
            MODEL CONTEXT PROTOCOL (MCP) & AGENT SKILLS
          </span>
          <h1 className="text-3xl sm:text-4xl font-black">
            Connect Claude Code, Cursor & AI Agents directly to Typefully
          </h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400 max-w-2xl">
            Use the official Typefully MCP server and REST API v2 (`/api/v2/*`) to draft threads, inspect your Smart Queue, and schedule announcements directly from your terminal or IDE.
          </p>
        </div>

        <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 font-mono text-xs space-y-3 overflow-x-auto">
          <div className="text-orange-400 font-bold">
            // claude_desktop_config.json — Official Typefully MCP Configuration
          </div>
          <pre>{`{
  "mcpServers": {
    "typefully": {
      "command": "npx",
      "args": ["-y", "@typefully/mcp-server"],
      "env": {
        "TYPEFULLY_API_KEY": "tf_live_your_api_v2_token"
      }
    }
  }
}`}</pre>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/settings"
            className="px-4 py-2.5 rounded-xl bg-orange-500 text-white text-xs font-bold"
          >
            Generate API v2 Key in Settings →
          </Link>
          <Link
            href="/docs/api"
            className="px-4 py-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 text-xs font-bold"
          >
            Explore OpenAPI 3.1.0 Spec →
          </Link>
        </div>
      </main>
    </div>
  );
}
