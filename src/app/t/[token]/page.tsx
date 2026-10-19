'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { PublicNav } from '@/components/PublicNav';

export default function SharedDraftPage() {
  const params = useParams<{ token: string }>();
  const token = String(params?.token || '');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authorName, setAuthorName] = useState('Guest Reviewer');
  const [commentText, setCommentText] = useState('');
  const [quoteText, setQuoteText] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const loadSharedDraft = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/shared/${encodeURIComponent(token)}`);
      if (res.ok) {
        setData(await res.json());
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadSharedDraft();
  }, [loadSharedDraft]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    const res = await fetch(`/api/shared/${encodeURIComponent(token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        authorName,
        content: commentText,
        quoteText: quoteText || undefined,
      }),
    });
    if (res.ok) {
      setCommentText('');
      setQuoteText('');
      setNotice('Comment posted to draft thread!');
      await loadSharedDraft();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950">
      <PublicNav />
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8">
        {loading ? (
          <div className="text-center py-12 text-sm text-slate-500">
            Loading shared draft…
          </div>
        ) : !data?.draft ? (
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 rounded-2xl p-8 text-center space-y-3">
            <h1 className="text-xl font-bold">Shared Draft Not Found</h1>
            <Link
              href="/write"
              className="inline-block px-4 py-2 rounded-xl bg-orange-500 text-white text-xs font-bold"
            >
              Open Composer
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Thread Preview Column */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex items-center justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 text-[10px] font-bold uppercase">
                    PUBLIC SHARED DRAFT
                  </span>
                  <h1 className="text-xl font-bold mt-1">
                    {data.draft.draft_title || 'Shared Thread'}
                  </h1>
                  <p className="text-xs text-slate-500">
                    By @{data.social_set?.username} ({data.social_set?.name}) •{' '}
                    {data.draft.posts?.length || 1} posts in thread
                  </p>
                </div>
                <Link
                  href="/write"
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Open in Typefully →
                </Link>
              </div>

              <div className="space-y-3">
                {(data.draft.posts || []).map((post: any, idx: number) => (
                  <div
                    key={post.id || idx}
                    data-testid={`shared-post-${idx}`}
                    className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="font-bold text-slate-800 dark:text-zinc-200">
                        @{data.social_set?.username}
                      </span>
                      <span>
                        Post {idx + 1}/{data.draft.posts.length}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                      {post.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Collaborative Review Comments Column */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h2 className="text-sm font-bold">
                  💬 Collaborative Review ({data.draft.comment_threads?.length || 0})
                </h2>

                {notice && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-medium">
                    {notice}
                  </div>
                )}

                <form onSubmit={handlePostComment} className="space-y-2.5 text-xs">
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    placeholder="Your Name"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                  <input
                    type="text"
                    value={quoteText}
                    onChange={(e) => setQuoteText(e.target.value)}
                    placeholder="Quoted phrase from thread (optional)"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                  <textarea
                    rows={3}
                    required
                    data-testid="shared-comment-textarea"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Leave inline feedback for the author…"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                  <button
                    type="submit"
                    data-testid="shared-comment-submit"
                    className="w-full py-2 rounded-xl bg-orange-500 text-white font-bold"
                  >
                    Post Feedback Comment
                  </button>
                </form>

                <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  {(data.draft.comment_threads || []).map((th: any) => (
                    <div
                      key={th.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 text-xs space-y-1"
                    >
                      {th.quoteText && (
                        <div className="italic text-slate-500 border-l-2 border-orange-400 pl-2">
                          “{th.quoteText}”
                        </div>
                      )}
                      {(th.comments || []).map((c: any) => (
                        <div key={c.id}>
                          <strong className="text-slate-900 dark:text-white">
                            {c.authorName}:{' '}
                          </strong>
                          <span>{c.content}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
