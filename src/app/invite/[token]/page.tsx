'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';

export default function InviteRedeemPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const token = String(params?.token || '');

  const [inspection, setInspection] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('invited.creator@typefully.com');
  const [name, setName] = useState('Invited Creator');
  const [password, setPassword] = useState('TypefullyCreator2026!');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/auth/invitation?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data) => {
        setInspection(data.invitation);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          name,
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not redeem invitation');
        return;
      }
      window.location.assign(data.redirectUrl || '/write');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950">
      <PublicNav />
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
          <div className="text-center space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800">
              SINGLE-USE WORKSPACE INVITATION
            </span>
            <h1 className="text-xl font-bold">Accept Your Invitation</h1>
          </div>

          {loading ? (
            <div className="text-center text-xs text-slate-500 py-6">
              Inspecting invitation token…
            </div>
          ) : (
            <div
              data-testid="invitation-inspection-card"
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/70 border border-slate-200 dark:border-zinc-700 text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Invitation Status:</span>
                <span
                  data-testid="invitation-status-badge"
                  className={`px-2 py-0.5 rounded font-bold uppercase ${
                    inspection?.status === 'pending'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {inspection?.status || 'invalid'}
                </span>
              </div>
              {inspection?.maskedEmail && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Target Email:</span>
                  <span className="font-mono font-semibold">
                    {inspection.maskedEmail}
                  </span>
                </div>
              )}
              {inspection?.role && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Assigned Role:</span>
                  <span className="font-semibold text-orange-600">
                    {inspection.role}
                  </span>
                </div>
              )}
            </div>
          )}

          {error && (
            <div
              role="alert"
              data-testid="invite-claim-error"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium"
            >
              {error}
            </div>
          )}

          {inspection?.status === 'pending' ? (
            <form onSubmit={handleClaim} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold mb-1">
                  Confirm Invited Email Address
                </label>
                <input
                  type="email"
                  required
                  data-testid="invite-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  data-testid="invite-name-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">
                  Create Password (12+ chars)
                </label>
                <input
                  type="password"
                  required
                  data-testid="invite-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                data-testid="invite-claim-submit"
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm"
              >
                {submitting ? 'Activating Account…' : 'Complete Registration →'}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-3 py-2">
              <p className="text-xs text-slate-500">
                This invitation link is {inspection?.status || 'invalid'} and cannot be redeemed.
              </p>
              <Link
                href="/signin"
                className="inline-block px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Go to Sign In
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
