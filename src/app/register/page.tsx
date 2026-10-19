'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, password, token: token || undefined }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Invitation required.');
      return;
    }
    setSuccess(true);
    window.location.href = data.redirectUrl || '/write';
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950">
      <PublicNav />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="space-y-1 text-center">
            <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800">
              INVITE-ONLY ADMISSION
            </span>
            <h1 className="text-xl font-bold">Create a Typefully Account</h1>
            <p className="text-xs text-slate-500">
              Registration requires a single-use invitation code issued by a Workspace Admin.
            </p>
          </div>

          {error && (
            <div
              role="alert"
              data-testid="register-error"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium"
            >
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
              Account created! Redirecting to workspace…
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold mb-1">Invitation Code / Token</label>
              <input
                type="text"
                data-testid="register-token"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste single-use invite token (optional to test rejection)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Invited Email</label>
              <input
                type="email"
                required
                data-testid="register-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="invited.creator@typefully.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Full Name</label>
              <input
                type="text"
                data-testid="register-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Rivera"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Password (minimum 12 characters)
              </label>
              <input
                type="password"
                required
                data-testid="register-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
            </div>

            <button
              type="submit"
              data-testid="register-submit"
              className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm"
            >
              Claim Invitation & Register
            </button>
          </form>

          <div className="text-center text-xs text-slate-500">
            Already have an account?{' '}
            <Link href="/signin" className="text-orange-600 font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
