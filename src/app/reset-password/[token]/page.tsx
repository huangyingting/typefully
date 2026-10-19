'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';

export default function ResetPasswordTokenPage() {
  const params = useParams<{ token: string }>();
  const token = String(params?.token || '');

  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not reset password');
        return;
      }
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950">
      <PublicNav />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold">Choose a New Password</h1>
            <p className="text-xs text-slate-500">
              Minimum 10 characters. All existing sessions will be revoked upon reset.
            </p>
          </div>

          {error && (
            <div
              data-testid="reset-password-error"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs"
            >
              {error}
            </div>
          )}

          {done ? (
            <div
              data-testid="reset-password-success"
              className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-3 text-center"
            >
              <div className="font-bold">Password updated successfully!</div>
              <Link
                href="/signin"
                className="inline-block px-4 py-2 rounded-xl bg-slate-900 text-white font-bold"
              >
                Sign in with New Password →
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  New Password (min 10 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={10}
                  data-testid="reset-new-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                data-testid="reset-submit-btn"
                className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-sm font-bold"
              >
                {loading ? 'Updating password…' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
