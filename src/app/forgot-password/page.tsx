'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setResetUrl(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/password/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to request password reset');
        return;
      }
      setMessage(data.message);
      if (data.resetUrl) setResetUrl(data.resetUrl);
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
            <h1 className="text-xl font-bold">Reset Your Password</h1>
            <p className="text-xs text-slate-500">
              Enter your workspace email to receive a single-use password reset link.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
              {error}
            </div>
          )}

          {message && (
            <div
              data-testid="forgot-password-success"
              className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2"
            >
              <div className="font-semibold">{message}</div>
              {resetUrl && (
                <div>
                  <span className="text-emerald-700">Single-use reset link: </span>
                  <Link
                    href={resetUrl}
                    data-testid="generated-reset-link"
                    className="font-mono underline break-all font-bold"
                  >
                    {resetUrl}
                  </Link>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                data-testid="forgot-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="francesco@typefully.com"
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              data-testid="forgot-submit-btn"
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-orange-500 text-white text-sm font-bold"
            >
              {loading ? 'Generating link…' : 'Send Reset Link'}
            </button>
          </form>

          <div className="text-center text-xs text-slate-500">
            Remembered your password?{' '}
            <Link href="/signin" className="text-orange-600 font-semibold hover:underline">
              Back to Sign In
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
