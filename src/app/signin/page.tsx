'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { PublicNav } from '@/components/PublicNav';

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState('fabrizio@typefully.com');
  const [password, setPassword] = useState('TypefullyAdmin2026!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid credentials');
        return;
      }
      window.location.assign(data.redirectUrl || '/write');
    } catch {
      setError('Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950">
      <PublicNav />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-black flex items-center justify-center mx-auto">
              T
            </div>
            <h1 className="text-xl font-bold">Sign in to Typefully</h1>
            <p className="text-xs text-slate-500">
              Invite-only creator workspace • Single-use invitation admission enabled
            </p>
          </div>

          {error && (
            <div
              role="alert"
              data-testid="signin-error"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                data-testid="signin-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  data-testid="forgot-password-link"
                  className="text-[11px] font-semibold text-orange-600 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                required
                data-testid="signin-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              data-testid="signin-submit"
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-orange-500 text-white text-sm font-bold hover:opacity-95 transition"
            >
              {loading ? 'Signing in…' : 'Sign in to Workspace →'}
            </button>
          </form>

          {/* Quick Demo Role Switcher */}
          <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 space-y-2 text-xs">
            <div className="font-semibold text-slate-500">
              Quick Demo Credentials (RBAC Roles):
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setEmail('fabrizio@typefully.com');
                  setPassword('TypefullyAdmin2026!');
                }}
                className="py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-zinc-800 font-medium hover:bg-orange-50"
              >
                Admin (Fabrizio)
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('francesco@typefully.com');
                  setPassword('TypefullyAdmin2026!');
                }}
                className="py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-zinc-800 font-medium hover:bg-orange-50"
              >
                Editor (Francesco)
              </button>
              <button
                type="button"
                onClick={() => {
                  setEmail('thomas@typefully.com');
                  setPassword('TypefullyAdmin2026!');
                }}
                className="py-1.5 px-2 rounded-lg bg-slate-100 dark:bg-zinc-800 font-medium hover:bg-orange-50"
              >
                Viewer (Thomas)
              </button>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500">
            Have an invitation token?{' '}
            <Link
              href="/invite/demo-invite-token-2026"
              className="text-orange-600 font-semibold hover:underline"
            >
              Claim Invitation Link
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
