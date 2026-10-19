'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';

export default function AdminInvitationsPage() {
  const [invitations, setInvitations] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Admin' | 'Editor' | 'Viewer'>('Editor');
  const [latestIssuedLink, setLatestIssuedLink] = useState<{
    token: string;
    inviteUrl: string;
    email: string;
    role: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAdminConsole = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/admin/invitations');
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Admin access required. Sign in as fabrizio@typefully.com.');
        return;
      }
      setInvitations(data.invitations || []);
      setAuditLogs(data.auditLogs || []);
      setUsers(data.users || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAdminConsole();
  }, [loadAdminConsole]);

  const handleIssueInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/admin/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Failed to issue invitation');
      return;
    }
    setEmail('');
    setLatestIssuedLink({
      token: data.token,
      inviteUrl: data.inviteUrl,
      email: data.invitation.email,
      role: data.invitation.role,
    });
    await loadAdminConsole();
  };

  const handleRotateInvitation = async (id: string) => {
    const res = await fetch(`/api/admin/invitations/${id}/rotate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (res.ok) {
      setLatestIssuedLink({
        token: data.token,
        inviteUrl: data.inviteUrl,
        email: data.invitation.email,
        role: data.invitation.role,
      });
      await loadAdminConsole();
    }
  };

  const handleRevokeInvitation = async (id: string) => {
    const res = await fetch(`/api/admin/invitations/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      await loadAdminConsole();
    }
  };

  const handleUpdateUserRole = async (userId: string, nextRole: string) => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role: nextRole }),
    });
    await loadAdminConsole();
  };

  const handleUpdateUserStatus = async (userId: string, nextStatus: string) => {
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, status: nextStatus }),
    });
    await loadAdminConsole();
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950">
      <PublicNav />
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-100 text-orange-800">
              SECURITY & ADMISSION GOVERNANCE
            </span>
            <h1 className="text-2xl font-bold mt-1">
              Invite-Only Registration, RBAC Roles & Audit Logs
            </h1>
            <p className="text-xs text-slate-500">
              Single-use expiring invitation tokens (`SHA-256` hashed at rest), role assignment (`Admin`, `Editor`, `Viewer`), revocation, and immutable audit trail. Root admins are provisioned exclusively via CLI (`npm run bootstrap:admin`).
            </p>
          </div>
          <Link
            href="/write"
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
          >
            ← Back to Composer
          </Link>
        </div>

        {error && (
          <div
            role="alert"
            data-testid="admin-error-banner"
            className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between"
          >
            <span>{error}</span>
            <Link
              href="/signin"
              className="px-3 py-1.5 rounded-lg bg-red-700 text-white font-bold"
            >
              Sign in as Admin
            </Link>
          </div>
        )}

        {/* Issue New Single-Use Invitation Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold">Issue Single-Use Invitation Code</h2>
          <form
            onSubmit={handleIssueInvitation}
            className="flex flex-wrap items-end gap-3 text-xs"
          >
            <div className="flex-1 min-w-[220px]">
              <label className="block font-semibold mb-1">Invitee Email Address</label>
              <input
                type="email"
                required
                data-testid="admin-invite-email-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="new.teammate@typefully.com"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Assigned Role</label>
              <select
                data-testid="admin-invite-role-select"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-semibold"
              >
                <option value="Admin">Admin (Full Governance)</option>
                <option value="Editor">Editor (Write & Schedule)</option>
                <option value="Viewer">Viewer (Read & Comment Only)</option>
              </select>
            </div>

            <button
              type="submit"
              data-testid="admin-issue-invite-btn"
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
            >
              + Issue Single-Use Invite
            </button>
          </form>

          {latestIssuedLink && (
            <div
              data-testid="issued-invite-banner"
              className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 text-xs space-y-1.5"
            >
              <div className="font-bold text-emerald-900 dark:text-emerald-200">
                ✓ Issued Single-Use Invitation for {latestIssuedLink.email} ({latestIssuedLink.role})
              </div>
              <div className="font-mono break-all">
                Token: <strong data-testid="issued-invite-token">{latestIssuedLink.token}</strong>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href={`/invite/${latestIssuedLink.token}`}
                  data-testid="issued-invite-link"
                  className="text-orange-600 font-bold underline"
                >
                  Open Redeem Page (/invite/{latestIssuedLink.token.slice(0, 10)}…) ↗
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Invitations Table */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold">
            Issued Invitations ({invitations.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500">
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2 px-3">Role</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Expires</th>
                  <th className="py-2 pl-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                {invitations.map((inv) => (
                  <tr key={inv.id} data-testid={`invitation-row-${inv.id}`}>
                    <td className="py-2.5 pr-3 font-medium">{inv.email}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-semibold">
                        {inv.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        data-testid={`invitation-status-${inv.id}`}
                        className={`px-2 py-0.5 rounded font-bold uppercase text-[10px] ${
                          inv.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : inv.status === 'accepted'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                      {new Date(inv.expiresAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 pl-3 text-right space-x-2">
                      {inv.status !== 'accepted' && (
                        <>
                          <button
                            type="button"
                            data-testid={`rotate-invite-${inv.id}`}
                            onClick={() => handleRotateInvitation(inv.id)}
                            className="px-2.5 py-1 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 font-semibold"
                          >
                            Rotate Token
                          </button>
                          {inv.status !== 'revoked' && (
                            <button
                              type="button"
                              data-testid={`revoke-invite-${inv.id}`}
                              onClick={() => handleRevokeInvitation(inv.id)}
                              className="px-2.5 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 font-semibold"
                            >
                              Revoke
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Workspace Users & Role Assignment */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3">
          <h2 className="text-sm font-bold">Workspace Members & RBAC Roles</h2>
          <div className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
            {users.map((u) => (
              <div
                key={u.id}
                className="py-2.5 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <span className="font-bold">{u.name || u.email}</span>
                  <span className="ml-2 text-slate-500">{u.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    data-testid={`user-status-${u.id}`}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      u.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {u.status || 'active'}
                  </span>
                  <select
                    aria-label={`Role for ${u.email}`}
                    data-testid={`user-role-select-${u.id}`}
                    value={u.role}
                    onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-semibold"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Editor">Editor</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                  <button
                    type="button"
                    data-testid={`user-toggle-status-${u.id}`}
                    onClick={() =>
                      handleUpdateUserStatus(
                        u.id,
                        u.status === 'active' ? 'SUSPENDED' : 'active'
                      )
                    }
                    className={`px-2.5 py-1 rounded-lg font-semibold ${
                      u.status === 'active'
                        ? 'bg-red-50 text-red-600 hover:bg-red-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {u.status === 'active' ? 'Suspend & Revoke Sessions' : 'Reactivate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Immutable Security Audit Log Table */}
        <div
          data-testid="audit-log-table"
          className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-3"
        >
          <h2 className="text-sm font-bold">
            Immutable Security & Governance Audit Trail ({auditLogs.length} events)
          </h2>
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-500">
                  <th className="py-2 pr-3">Timestamp</th>
                  <th className="py-2 px-3">Action</th>
                  <th className="py-2 px-3">Actor</th>
                  <th className="py-2 px-3">Target</th>
                  <th className="py-2 pl-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 pr-3 text-slate-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 px-3 font-bold text-orange-600 dark:text-orange-400">
                      {log.action}
                    </td>
                    <td className="py-2 px-3">{log.actorEmail || 'system/cli'}</td>
                    <td className="py-2 px-3">
                      {log.targetType}:{log.targetId || '-'}
                    </td>
                    <td className="py-2 pl-3 text-slate-500 truncate max-w-xs">
                      {JSON.stringify(log.metadata)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
