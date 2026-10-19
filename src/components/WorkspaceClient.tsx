'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export type WorkspaceTab = 'write' | 'calendar' | 'queue' | 'grow' | 'settings';

const PLATFORM_DEFS = [
  { key: 'x', label: '𝕏', fullName: '𝕏 (Twitter)', maxChars: 280, color: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' },
  { key: 'linkedin', label: 'in', fullName: 'LinkedIn', maxChars: 3000, color: 'bg-sky-700 text-white' },
  { key: 'threads', label: '@', fullName: 'Threads', maxChars: 500, color: 'bg-zinc-800 text-white' },
  { key: 'bluesky', label: '🦋', fullName: 'Bluesky', maxChars: 300, color: 'bg-blue-500 text-white' },
  { key: 'mastodon', label: 'M', fullName: 'Mastodon', maxChars: 500, color: 'bg-indigo-600 text-white' },
  { key: 'substack', label: 'S', fullName: 'Substack Notes', maxChars: 5000, color: 'bg-orange-600 text-white' },
  { key: 'x_article', label: '📄', fullName: '𝕏 Article', maxChars: 50000, color: 'bg-amber-600 text-white' },
];

export function WorkspaceClient({ initialTab = 'write' }: { initialTab?: WorkspaceTab }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);
  const [darkMode, setDarkMode] = useState(false);

  // Global workspace state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [socialSets, setSocialSets] = useState<any[]>([]);
  const [activeSocialSetId, setActiveSocialSetId] = useState<number>(1);
  const [drafts, setDrafts] = useState<any[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Sidebar filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [orderBy, setOrderBy] = useState<string>('-updated_at');

  // Active editor state
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [posts, setPosts] = useState<Array<{ id: string; text: string; mediaIds?: string[]; mediaUrls?: any[]; hideLinkPreview?: boolean; quotePostUrl?: string }>>([
    { id: 'p_init_0', text: '' },
  ]);
  const [platformsConfig, setPlatformsConfig] = useState<Record<string, { enabled?: boolean }>>({
    x: { enabled: true },
    linkedin: { enabled: true },
    threads: { enabled: true },
    bluesky: { enabled: true },
  });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTagName, setNewTagName] = useState<string>('');
  const [numberingStyle, setNumberingStyle] = useState<string>('none');
  const [isPinned, setIsPinned] = useState<boolean>(false);
  const [isPubliclyShared, setIsPubliclyShared] = useState<boolean>(true);
  const [scratchpadText, setScratchpadText] = useState<string>('');
  const [pollEnabled, setPollEnabled] = useState<boolean>(false);
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollDuration, setPollDuration] = useState<number>(1440);
  const [xSettings, setXSettings] = useState<any>({
    reply_to_url: '',
    community_id: '',
    share_with_followers: true,
    reply_settings: 'everyone',
    subscribers_only: false,
    paid_partnership: false,
    made_with_ai: false,
  });
  const [linkedinSettings, setLinkedinSettings] = useState<any>({
    first_comment: '',
    pdf_carousel_title: '',
  });
  const [threadsSettings, setThreadsSettings] = useState<any>({
    topic_tag: '',
  });
  const [autoPlug, setAutoPlug] = useState<any>({
    enabled: false,
    triggerMetric: 'likes',
    threshold: 50,
    plugText: 'Enjoyed this thread? Subscribe to our weekly dispatch → https://typefully.com',
  });
  const [autoRepost, setAutoRepost] = useState<any>({
    enabled: false,
    delayHours: 12,
  });
  const [autoDm, setAutoDm] = useState<any>({
    enabled: false,
    triggerKeyword: 'MCP',
    requireFollow: true,
    requireRetweet: false,
    dmTemplate: 'Hey! Here is your direct link to the Typefully MCP guide: https://typefully.com/ai-agents',
  });
  const [threadFinisher, setThreadFinisher] = useState<any>({
    enabled: false,
    templateText: 'Follow @typefully for more weekly creator workflows!',
    quoteFirstPost: true,
  });
  const [customScheduleInput, setCustomScheduleInput] = useState<string>('');
  const [showAdvancedPanel, setShowAdvancedPanel] = useState<boolean>(false);

  // Right context drawer state
  const [rightDrawerTab, setRightDrawerTab] = useState<'vesper' | 'comments' | 'scratchpad' | 'preview'>('vesper');
  const [vesperLoading, setVesperLoading] = useState<boolean>(false);
  const [vesperResult, setVesperResult] = useState<any>(null);
  const [vesperCustomPrompt, setVesperCustomPrompt] = useState<string>('');
  const [aiPrompts, setAiPrompts] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [newCommentQuote, setNewCommentQuote] = useState<string>('');

  // Queue & Analytics & Settings state
  const [queueData, setQueueData] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<string>('30d');
  const [calendarMode, setCalendarMode] = useState<'month' | 'week'>('month');
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newlyCreatedRawKey, setNewlyCreatedRawKey] = useState<string | null>(null);
  const [newApiKeyLabel, setNewApiKeyLabel] = useState<string>('Claude Desktop MCP Token');
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState<string>('');
  const [teams, setTeams] = useState<any[]>([]);
  const [newPromptTitle, setNewPromptTitle] = useState<string>('');
  const [newPromptInstruction, setNewPromptInstruction] = useState<string>('');
  const [newBrandUsername, setNewBrandUsername] = useState<string>('');
  const [newBrandName, setNewBrandName] = useState<string>('');
  const [showNewBrandModal, setShowNewBrandModal] = useState<boolean>(false);

  // Overlays
  const [commandBarOpen, setCommandBarOpen] = useState<boolean>(false);
  const [commandSearch, setCommandSearch] = useState<string>('');
  const [shortcutsOpen, setShortcutsOpen] = useState<boolean>(false);

  const showNotice = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ type, text });
    setTimeout(() => {
      setToast((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  }, []);

  const activeSocialSet = useMemo(
    () => socialSets.find((s) => s.id === activeSocialSetId) || socialSets[0] || null,
    [socialSets, activeSocialSetId]
  );

  const selectedDraft = useMemo(
    () => drafts.find((d) => d.id === selectedDraftId) || null,
    [drafts, selectedDraftId]
  );

  // Sync editor fields when a draft is selected
  const hydrateDraftIntoEditor = useCallback((d: any) => {
    if (!d) return;
    setDraftTitle(d.draft_title || '');
    setPosts(
      Array.isArray(d.posts) && d.posts.length > 0
        ? d.posts
        : [{ id: `p_${Date.now()}_0`, text: d.preview || '' }]
    );
    setPlatformsConfig(
      d.platforms_config || {
        x: { enabled: true },
        linkedin: { enabled: true },
        threads: { enabled: true },
        bluesky: { enabled: true },
      }
    );
    setSelectedTags(Array.isArray(d.tags) ? d.tags : []);
    setNumberingStyle(d.numbering_style || 'none');
    setIsPinned(Boolean(d.is_pinned));
    setIsPubliclyShared(Boolean(d.share_url));
    setScratchpadText(d.scratchpad_text || '');
    if (d.poll && Array.isArray(d.poll.options)) {
      setPollEnabled(true);
      setPollOptions(d.poll.options);
      setPollDuration(d.poll.durationMinutes || 1440);
    } else {
      setPollEnabled(false);
      setPollOptions(['', '']);
    }
    if (d.x_settings) setXSettings(d.x_settings);
    if (d.linkedin_settings) setLinkedinSettings(d.linkedin_settings);
    if (d.threads_settings) setThreadsSettings(d.threads_settings);
    if (d.auto_plug) setAutoPlug(d.auto_plug);
    if (d.auto_repost) setAutoRepost(d.auto_repost);
    if (d.auto_dm) setAutoDm(d.auto_dm);
    if (d.thread_finisher) setThreadFinisher(d.thread_finisher);
    setCustomScheduleInput(
      d.scheduled_date ? new Date(d.scheduled_date).toISOString().slice(0, 16) : ''
    );
  }, []);

  const loadWorkspaceData = useCallback(
    async (
      setId = activeSocialSetId,
      keepSelectedId?: number | null,
      hydrateEditor = true
    ) => {
      try {
        const [meRes, draftsRes, queueRes, analyticsRes] = await Promise.all([
          fetch('/api/v2/me'),
          fetch(`/api/v2/social-sets/${setId}/drafts`),
          fetch(`/api/v2/social-sets/${setId}/queue?days=14`),
          fetch(`/api/v2/social-sets/${setId}/analytics?period=${analyticsPeriod}`),
        ]);

        const [meJson, draftsJson, queueJson, analyticsJson] = await Promise.all([
          meRes.json(),
          draftsRes.json(),
          queueRes.json(),
          analyticsRes.json(),
        ]);

        if (meJson.user) setCurrentUser(meJson.user);
        if (Array.isArray(meJson.social_sets)) setSocialSets(meJson.social_sets);
        if (Array.isArray(meJson.api_keys)) setApiKeys(meJson.api_keys);
        if (Array.isArray(meJson.webhooks)) setWebhooks(meJson.webhooks);
        if (Array.isArray(meJson.teams)) setTeams(meJson.teams);
        if (Array.isArray(meJson.ai_prompts)) setAiPrompts(meJson.ai_prompts);

        const loadedDrafts = Array.isArray(draftsJson.results) ? draftsJson.results : [];
        setDrafts(loadedDrafts);
        setQueueData(queueJson);
        setAnalyticsData(analyticsJson);

        const targetId =
          keepSelectedId !== undefined
            ? keepSelectedId
            : selectedDraftId || loadedDrafts[0]?.id || null;
        if (targetId) {
          const found = loadedDrafts.find((item: any) => item.id === targetId) || loadedDrafts[0];
          if (found) {
            setSelectedDraftId(found.id);
            if (hydrateEditor) {
              hydrateDraftIntoEditor(found);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load workspace data:', err);
      } finally {
        setLoading(false);
      }
    },
    [activeSocialSetId, analyticsPeriod, hydrateDraftIntoEditor, selectedDraftId]
  );

  useEffect(() => {
    loadWorkspaceData(activeSocialSetId);
  }, [activeSocialSetId, analyticsPeriod]);

  // Toggle dark class on html element
  useEffect(() => {
    const html = document.documentElement;
    if (darkMode) html.classList.add('dark');
    else html.classList.remove('dark');
  }, [darkMode]);

  // Global keyboard shortcuts (Cmd+K command bar, ? shortcuts modal)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandBarOpen((prev) => !prev);
      } else if (
        e.key === '?' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setShortcutsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setCommandBarOpen(false);
        setShortcutsOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Filtered drafts for left sidebar
  const filteredDrafts = useMemo(() => {
    let list = [...drafts];
    if (statusFilter === 'pinned') {
      list = list.filter((d) => d.is_pinned);
    } else if (statusFilter !== 'all') {
      list = list.filter((d) => d.status === statusFilter);
    }
    if (tagFilter) {
      list = list.filter((d) => Array.isArray(d.tags) && d.tags.includes(tagFilter));
    }
    if (platformFilter !== 'all') {
      list = list.filter((d) => d.platforms?.[platformFilter]?.enabled);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (d) =>
          (d.draft_title || '').toLowerCase().includes(q) ||
          (d.preview || '').toLowerCase().includes(q) ||
          (d.posts || []).some((p: any) => (p.text || '').toLowerCase().includes(q))
      );
    }
    if (orderBy === 'scheduled_date' || orderBy === '-scheduled_date') {
      const desc = orderBy.startsWith('-');
      list.sort((a, b) => {
        const ta = a.scheduled_date ? new Date(a.scheduled_date).getTime() : 0;
        const tb = b.scheduled_date ? new Date(b.scheduled_date).getTime() : 0;
        return desc ? tb - ta : ta - tb;
      });
    }
    return list;
  }, [drafts, statusFilter, tagFilter, platformFilter, searchQuery, orderBy]);

  // Real-time Poll vs Media and Character Limit validation
  const liveValidation = useMemo(() => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const hasMedia = posts.some(
      (p) => (p.mediaIds && p.mediaIds.length > 0) || (p.mediaUrls && p.mediaUrls.length > 0)
    );
    if (pollEnabled) {
      const nonEmptyOpts = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (nonEmptyOpts.length < 2) {
        warnings.push('Add at least 2 poll options before publishing.');
      }
      if (hasMedia) {
        errors.push("Poll with media: A post with a poll can't include images, video, or PDF carousels.");
      }
      const tooLongX = nonEmptyOpts.find((o) => o.length > 25);
      if (tooLongX && (platformsConfig.x?.enabled || platformsConfig.threads?.enabled)) {
        errors.push(`Poll option "${tooLongX}" exceeds the 25-character limit for 𝕏/Threads.`);
      }
    }

    for (const pDef of PLATFORM_DEFS) {
      if (!platformsConfig[pDef.key]?.enabled) continue;
      const maxAllowed =
        pDef.key === 'x' && activeSocialSet?.allow_long_x_posts ? 25000 : pDef.maxChars;
      posts.forEach((p, idx) => {
        if ((p.text || '').length > maxAllowed) {
          warnings.push(
            `Post #${idx + 1} is ${p.text.length}/${maxAllowed} chars (${pDef.fullName} limit exceeded).`
          );
        }
      });
    }
    return { errors, warnings };
  }, [posts, pollEnabled, pollOptions, platformsConfig, activeSocialSet]);

  // Actions
  const handleSelectDraft = (d: any) => {
    setSelectedDraftId(d.id);
    hydrateDraftIntoEditor(d);
    if (activeTab !== 'write') {
      setActiveTab('write');
    }
  };

  const handleCreateNewDraft = async (initialTitle = 'Untitled Thread', initialText = '') => {
    try {
      const res = await fetch(`/api/v2/social-sets/${activeSocialSetId}/drafts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draft_title: initialTitle,
          posts: [{ id: `p_${Date.now()}_0`, text: initialText }],
          platforms_config: platformsConfig,
          share: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showNotice(data.error || 'Failed to create draft', 'error');
        return;
      }
      await loadWorkspaceData(activeSocialSetId, data.id);
      setActiveTab('write');
      showNotice('Created new draft');
    } catch {
      showNotice('Failed to create draft', 'error');
    }
  };

  const handleSaveOrTransitionDraft = async (options?: {
    action?: string;
    publish_at?: string;
    plan_at?: string;
    apply_numbering?: boolean;
    restore_backup_id?: string;
  }) => {
    if (!selectedDraftId) {
      await handleCreateNewDraft(draftTitle || 'New Draft', posts[0]?.text || '');
      return;
    }

    const payload: any = {
      draft_title: draftTitle,
      posts,
      platforms_config: platformsConfig,
      tags: selectedTags,
      numbering_style: numberingStyle,
      is_pinned: isPinned,
      share: isPubliclyShared,
      scratchpad_text: scratchpadText,
      poll: pollEnabled
        ? {
            options: pollOptions,
            durationMinutes: pollDuration,
          }
        : null,
      x_settings: xSettings,
      linkedin_settings: linkedinSettings,
      threads_settings: threadsSettings,
      auto_plug: autoPlug,
      auto_repost: autoRepost,
      auto_dm: autoDm,
      thread_finisher: threadFinisher,
      ...options,
    };

    const res = await fetch(
      `/api/v2/social-sets/${activeSocialSetId}/drafts/${selectedDraftId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );
    const data = await res.json();
    if (!res.ok) {
      showNotice(data.error || 'Validation failed', 'error');
      return;
    }

    await loadWorkspaceData(activeSocialSetId, data.id);
    if (options?.publish_at === 'now') {
      showNotice('Published live across enabled platforms! 🚀');
    } else if (options?.publish_at) {
      showNotice('Scheduled to Smart Queue! 📅');
    } else if (options?.plan_at) {
      showNotice('Planned on Calendar (inert until confirmed) 📌');
    } else if (options?.action === 'confirm_schedule') {
      showNotice('Planned draft confirmed & activated in Queue! ✅');
    } else if (options?.restore_backup_id) {
      showNotice('Restored snapshot backup');
    } else {
      showNotice('Draft saved');
    }
  };

  const handleDeleteDraft = async (idToDelete = selectedDraftId) => {
    if (!idToDelete) return;
    const res = await fetch(
      `/api/v2/social-sets/${activeSocialSetId}/drafts/${idToDelete}`,
      { method: 'DELETE' }
    );
    if (res.ok) {
      showNotice('Draft deleted');
      await loadWorkspaceData(activeSocialSetId, null);
    } else {
      const err = await res.json().catch(() => ({}));
      showNotice(err.error || 'Could not delete draft', 'error');
    }
  };

  const handleRepurposeDraft = async (sourceDraft: any) => {
    const firstText =
      sourceDraft.posts?.[0]?.text || sourceDraft.preview || 'High-performing post';
    await handleCreateNewDraft(
      `Repurposed: ${sourceDraft.draft_title || 'Top Post'}`,
      `♻️ ${firstText}\n\n(Updated for 2026 — here is what changed:)`
    );
  };

  const handleAttachMedia = async (postIndex: number, kind: 'image' | 'pdf') => {
    const fileName =
      kind === 'pdf'
        ? `linkedin-carousel-${Date.now().toString(36)}.pdf`
        : `composer-visual-${Date.now().toString(36)}.png`;
    const mimeType = kind === 'pdf' ? 'application/pdf' : 'image/png';

    const res = await fetch(`/api/v2/social-sets/${activeSocialSetId}/media/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        file_name: fileName,
        mime_type: mimeType,
        alt_text: kind === 'pdf' ? 'LinkedIn PDF Carousel Slides' : 'Product UI preview',
      }),
    });
    const asset = await res.json();
    if (!res.ok) {
      showNotice('Media upload failed', 'error');
      return;
    }

    setPosts((prev) =>
      prev.map((p, idx) =>
        idx === postIndex
          ? {
              ...p,
              mediaIds: [...(p.mediaIds || []), asset.id],
              mediaUrls: [
                ...(p.mediaUrls || []),
                {
                  id: asset.id,
                  url: asset.url,
                  mimeType: asset.mime_type,
                  fileName: asset.file_name,
                  altText: asset.alt_text,
                },
              ],
            }
          : p
      )
    );
    showNotice(
      kind === 'pdf' ? 'Attached LinkedIn PDF Carousel' : 'Attached image to post'
    );
  };

  const handleGenerateAltText = async (postIndex: number, mediaId: string) => {
    const res = await fetch('/api/ai/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'alt-text' }),
    });
    const data = await res.json();
    if (data.altText) {
      await fetch(`/api/v2/social-sets/${activeSocialSetId}/media/upload`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: mediaId, alt_text: data.altText }),
      });
      setPosts((prev) =>
        prev.map((p, idx) =>
          idx === postIndex
            ? {
                ...p,
                mediaUrls: (p.mediaUrls || []).map((m: any) =>
                  m.id === mediaId ? { ...m, altText: data.altText } : m
                ),
              }
            : p
        )
      );
      showNotice('Generated AI Alt-Text for accessibility');
    }
  };

  const handleRunVesperCommand = async (commandSlug: string, customPromptText?: string) => {
    setVesperLoading(true);
    try {
      const combinedText = posts.map((p) => p.text).join('\n\n');
      const existingComments = (selectedDraft?.comment_threads || []).flatMap(
        (t: any) => t.comments || []
      );
      const res = await fetch('/api/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: commandSlug,
          text: combinedText,
          customPrompt: customPromptText || vesperCustomPrompt,
          comments: existingComments,
        }),
      });
      const data = await res.json();
      setVesperResult(data);
    } finally {
      setVesperLoading(false);
    }
  };

  const handleApplyVesperResult = () => {
    if (!vesperResult) return;
    if (Array.isArray(vesperResult.posts) && vesperResult.posts.length > 0) {
      setPosts(vesperResult.posts);
    } else if (vesperResult.suggestion) {
      setPosts([{ id: `p_vesper_${Date.now()}`, text: vesperResult.suggestion }]);
    }
    setVesperResult(null);
    showNotice('Applied Vesper AI rewrite to composer ✨');
  };

  const handleAddCommentThread = async () => {
    if (!selectedDraftId || !newCommentText.trim()) return;
    const res = await fetch(
      `/api/v2/social-sets/${activeSocialSetId}/drafts/${selectedDraftId}/comment-threads`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postIndex: 0,
          quoteText: newCommentQuote || posts[0]?.text?.slice(0, 45) || null,
          content: newCommentText,
        }),
      }
    );
    if (res.ok) {
      setNewCommentText('');
      setNewCommentQuote('');
      await loadWorkspaceData(activeSocialSetId, selectedDraftId, false);
      showNotice('Added inline review comment');
    }
  };

  const handleToggleResolveThread = async (threadId: string, resolved: boolean) => {
    if (!selectedDraftId) return;
    await fetch(
      `/api/v2/social-sets/${activeSocialSetId}/drafts/${selectedDraftId}/comment-threads`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId, resolved }),
      }
    );
    await loadWorkspaceData(activeSocialSetId, selectedDraftId, false);
    showNotice(resolved ? 'Marked comment resolved' : 'Reopened comment thread');
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    const res = await fetch(`/api/v2/social-sets/${activeSocialSetId}/tags`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newTagName.trim(), color: '#f97316' }),
    });
    const tag = await res.json();
    if (res.ok && tag.slug) {
      setNewTagName('');
      if (!selectedTags.includes(tag.slug)) {
        setSelectedTags((prev) => [...prev, tag.slug]);
      }
      await loadWorkspaceData(activeSocialSetId, selectedDraftId, false);
      showNotice(`Created tag #${tag.slug}`);
    }
  };

  const handleSwapQueueDrafts = async (draftIdA: number, draftIdB: number) => {
    const res = await fetch(`/api/v2/social-sets/${activeSocialSetId}/queue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ swapDraftIdA: draftIdA, swapDraftIdB: draftIdB }),
    });
    if (res.ok) {
      await loadWorkspaceData(activeSocialSetId, selectedDraftId);
      showNotice('Swapped queue slot order');
    }
  };

  const handleConfirmPlannedDraftById = async (draftId: number) => {
    const res = await fetch(
      `/api/v2/social-sets/${activeSocialSetId}/drafts/${draftId}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm_schedule' }),
      }
    );
    if (res.ok) {
      await loadWorkspaceData(activeSocialSetId, draftId);
      showNotice('Confirmed planned draft — now active in Queue! ✅');
    }
  };

  const handleCreateNewBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandUsername.trim()) return;
    const res = await fetch('/api/v2/social-sets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: newBrandUsername,
        name: newBrandName || newBrandUsername,
      }),
    });
    const created = await res.json();
    if (res.ok && created.id) {
      setShowNewBrandModal(false);
      setNewBrandUsername('');
      setNewBrandName('');
      setActiveSocialSetId(created.id);
      await loadWorkspaceData(created.id, null);
      showNotice(`Created social set @${created.username}`);
    } else {
      showNotice(created.error || 'Could not create social set', 'error');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100">
      {/* Top Notification Toast */}
      {toast && (
        <div
          role="status"
          data-testid="workspace-toast"
          className={`fixed bottom-16 md:bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2 transition-all ${
            toast.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950/90 dark:border-red-800 dark:text-red-200'
              : 'bg-slate-900 border-slate-800 text-white dark:bg-zinc-800 dark:border-zinc-700'
          }`}
        >
          <span>{toast.type === 'error' ? '⚠️' : '✨'}</span>
          <span>{toast.text}</span>
        </div>
      )}

      {/* Main 3-Pane Responsive Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT PANE: Social Set Switcher, Navigation & Draft List */}
        <aside className="w-full lg:w-80 xl:w-84 border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 flex flex-col shrink-0">
          {/* Brand & Account Header */}
          <div className="p-3.5 border-b border-slate-200/80 dark:border-zinc-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Link
                href="/"
                className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-black text-sm shrink-0 shadow-sm"
                title="Back to Typefully Home"
              >
                T
              </Link>
              <select
                aria-label="Active Social Set"
                data-testid="social-set-switcher"
                value={activeSocialSetId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'new_brand') {
                    setShowNewBrandModal(true);
                  } else {
                    setActiveSocialSetId(Number(val));
                  }
                }}
                className="bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg px-2.5 py-1.5 text-sm font-semibold truncate focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {socialSets.map((s) => (
                  <option key={s.id} value={s.id}>
                    @{s.username} ({s.name})
                  </option>
                ))}
                <option value="new_brand">+ Add New Social Set…</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCommandBarOpen(true)}
                title="Command Bar (⌘K)"
                data-testid="open-command-bar-btn"
                className="px-2 py-1 rounded-lg text-xs font-mono bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200"
              >
                ⌘K
              </button>
              <button
                type="button"
                onClick={() => setShortcutsOpen(true)}
                title="Keyboard Shortcuts (?)"
                data-testid="open-shortcuts-btn"
                className="px-2 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200"
              >
                ?
              </button>
              <button
                type="button"
                onClick={() => setDarkMode((d) => !d)}
                title="Toggle Dark Mode"
                data-testid="toggle-dark-mode-btn"
                className="px-2 py-1 rounded-lg text-xs bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200"
              >
                {darkMode ? '☀️' : '🌙'}
              </button>
            </div>
          </div>

          {/* User & RBAC Role Strip */}
          <div className="px-3.5 py-2 bg-slate-50/80 dark:bg-zinc-950/50 border-b border-slate-200/70 dark:border-zinc-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium truncate">
                {currentUser?.email || 'fabrizio@typefully.com'}
              </span>
              <span
                data-testid="user-role-badge"
                className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-semibold"
              >
                {currentUser?.role || 'Admin'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/admin/invitations"
                className="text-orange-600 dark:text-orange-400 font-semibold hover:underline"
              >
                Invites
              </Link>
              <Link
                href={`/u/${activeSocialSet?.username || 'typefully'}`}
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Wall ↗
              </Link>
            </div>
          </div>

          {/* Primary Workspace Mode Tabs */}
          <div className="p-2 grid grid-cols-5 gap-1 border-b border-slate-200/80 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900">
            {(
              [
                { id: 'write', label: 'Write', icon: '✍️' },
                { id: 'calendar', label: 'Calendar', icon: '📅' },
                { id: 'queue', label: 'Queue', icon: '⚡' },
                { id: 'grow', label: 'Grow', icon: '📈' },
                { id: 'settings', label: 'Settings', icon: '⚙️' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                data-testid={`nav-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`py-1.5 px-1 rounded-lg text-xs font-semibold flex flex-col items-center gap-0.5 transition ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-zinc-800 text-orange-600 dark:text-orange-400 shadow-sm border border-slate-200/80 dark:border-zinc-700'
                    : 'text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* New Draft CTA & Search */}
          <div className="p-3 space-y-2 border-b border-slate-200/80 dark:border-zinc-800">
            <button
              type="button"
              data-testid="new-draft-btn"
              onClick={() => handleCreateNewDraft('New Thread Idea', '')}
              className="w-full py-2 px-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm shadow-sm flex items-center justify-between transition"
            >
              <span>+ New Draft</span>
              <kbd className="text-xs bg-orange-600/80 px-1.5 py-0.5 rounded">C</kbd>
            </button>

            <div className="flex gap-1.5">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drafts, hooks, tags…"
                data-testid="draft-search-input"
                className="flex-1 px-2.5 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <select
                aria-label="Sort drafts"
                value={orderBy}
                onChange={(e) => setOrderBy(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              >
                <option value="-updated_at">Recent</option>
                <option value="scheduled_date">Scheduled ↑</option>
                <option value="-scheduled_date">Scheduled ↓</option>
              </select>
            </div>

            {/* Status Filter Pills */}
            <div className="flex flex-wrap gap-1 pt-0.5">
              {[
                { key: 'all', label: 'All' },
                { key: 'draft', label: 'Drafts' },
                { key: 'planned', label: 'Planned' },
                { key: 'scheduled', label: 'Scheduled' },
                { key: 'published', label: 'Published' },
                { key: 'pinned', label: '📌 Pinned' },
              ].map((st) => (
                <button
                  key={st.key}
                  type="button"
                  data-testid={`status-filter-${st.key}`}
                  onClick={() => setStatusFilter(st.key)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium transition ${
                    statusFilter === st.key
                      ? 'bg-slate-900 text-white dark:bg-orange-500'
                      : 'bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Tag & Platform Filter Row */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <select
                aria-label="Filter by Tag"
                data-testid="tag-filter-select"
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="flex-1 px-2 py-1 rounded text-[11px] bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              >
                <option value="">All Tags</option>
                {(activeSocialSet?.tags || []).map((t: any) => (
                  <option key={t.slug} value={t.slug}>
                    #{t.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Filter by Platform"
                data-testid="platform-filter-select"
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="flex-1 px-2 py-1 rounded text-[11px] bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              >
                <option value="all">All Platforms</option>
                {PLATFORM_DEFS.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Draft List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800/70 max-h-64 lg:max-h-none">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Loading drafts…
              </div>
            ) : filteredDrafts.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No drafts match the current filter.
              </div>
            ) : (
              filteredDrafts.map((d) => {
                const active = d.id === selectedDraftId;
                return (
                  <button
                    key={d.id}
                    type="button"
                    data-testid={`draft-item-${d.id}`}
                    onClick={() => handleSelectDraft(d)}
                    className={`w-full text-left p-3 transition hover:bg-slate-50 dark:hover:bg-zinc-800/60 ${
                      active
                        ? 'bg-orange-50/70 dark:bg-orange-950/25 border-l-4 border-l-orange-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-xs truncate">
                        {d.is_pinned ? '📌 ' : ''}
                        {d.draft_title || 'Untitled Draft'}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                          d.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : d.status === 'scheduled'
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                            : d.status === 'planned'
                            ? 'bg-amber-100 text-amber-800 border border-dashed border-amber-400 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-400'
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2">
                      {d.preview || 'Empty draft…'}
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                      <div className="flex items-center gap-1">
                        {PLATFORM_DEFS.filter((p) => d.platforms?.[p.key]?.enabled).map(
                          (p) => (
                            <span
                              key={p.key}
                              className="px-1 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-semibold"
                            >
                              {p.label}
                            </span>
                          )
                        )}
                      </div>
                      <span>
                        {d.posts?.length || 1} post{(d.posts?.length || 1) > 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* CENTER PANE: Dynamic Workspace View */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* VIEW 1: WRITE / COMPOSER */}
          {activeTab === 'write' && (
            <div className="flex-1 flex flex-col max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-5">
              {/* Top Composer Metadata Bar */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <input
                    type="text"
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    placeholder="Draft title (internal only)…"
                    data-testid="draft-title-input"
                    className="flex-1 min-w-[200px] text-base font-bold bg-transparent border-b border-transparent focus:border-orange-500 focus:outline-none pb-1"
                  />

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsPinned((v) => !v)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                        isPinned
                          ? 'bg-orange-50 border-orange-300 text-orange-700 dark:bg-orange-950/60 dark:border-orange-800 dark:text-orange-300'
                          : 'border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400'
                      }`}
                    >
                      📌 {isPinned ? 'Pinned' : 'Pin'}
                    </button>

                    <select
                      aria-label="Thread Auto-Numbering"
                      data-testid="numbering-style-select"
                      value={numberingStyle}
                      onChange={(e) => setNumberingStyle(e.target.value)}
                      className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 font-medium"
                    >
                      <option value="none">No numbering</option>
                      <option value="1/n">Numbering: 1/n</option>
                      <option value="1.">Numbering: 1.</option>
                      <option value="[1/n]">Numbering: [1/n]</option>
                      <option value="thread_emoji">Numbering: 🧵 + 1/n</option>
                    </select>

                    {selectedDraft?.share_token && (
                      <Link
                        href={`/t/${selectedDraft.share_token}`}
                        data-testid="public-share-link"
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:bg-slate-200"
                      >
                        🔗 Share /t/{selectedDraft.share_token.slice(0, 10)}…
                      </Link>
                    )}

                    {Array.isArray(selectedDraft?.backups) &&
                      selectedDraft.backups.length > 0 && (
                        <select
                          aria-label="Restore Backup Snapshot"
                          data-testid="backup-restore-select"
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleSaveOrTransitionDraft({
                                restore_backup_id: e.target.value,
                              });
                              e.target.value = '';
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                        >
                          <option value="">
                            🕒 Backups ({selectedDraft.backups.length})
                          </option>
                          {selectedDraft.backups.map((bk: any) => (
                            <option key={bk.id} value={bk.id}>
                              Restore: {bk.label}
                            </option>
                          ))}
                        </select>
                      )}
                  </div>
                </div>

                {/* Multi-Platform Toggle Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-medium text-slate-500 mr-1">
                      Platforms:
                    </span>
                    {PLATFORM_DEFS.map((p) => {
                      const enabled = Boolean(platformsConfig[p.key]?.enabled);
                      return (
                        <button
                          key={p.key}
                          type="button"
                          data-testid={`toggle-platform-${p.key}`}
                          onClick={() =>
                            setPlatformsConfig((prev) => ({
                              ...prev,
                              [p.key]: { enabled: !prev[p.key]?.enabled },
                            }))
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
                            enabled
                              ? 'bg-slate-900 text-white border-slate-900 dark:bg-orange-500 dark:border-orange-500'
                              : 'bg-slate-50 dark:bg-zinc-800/50 text-slate-400 border-slate-200 dark:border-zinc-700'
                          }`}
                        >
                          <span>{p.label}</span>
                          <span>{p.fullName}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Tags Row */}
                  <div className="flex items-center gap-1.5">
                    {(activeSocialSet?.tags || []).map((t: any) => {
                      const active = selectedTags.includes(t.slug);
                      return (
                        <button
                          key={t.slug}
                          type="button"
                          onClick={() =>
                            setSelectedTags((prev) =>
                              active
                                ? prev.filter((item) => item !== t.slug)
                                : [...prev, t.slug]
                            )
                          }
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border transition ${
                            active
                              ? 'bg-orange-100 border-orange-400 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                              : 'border-slate-200 dark:border-zinc-700 text-slate-500'
                          }`}
                        >
                          #{t.name}
                        </button>
                      );
                    })}
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => setNewTagName(e.target.value)}
                        placeholder="+ Tag"
                        className="w-20 px-2 py-0.5 rounded text-xs bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                      />
                      {newTagName && (
                        <button
                          type="button"
                          onClick={handleCreateTag}
                          className="px-2 py-0.5 rounded bg-orange-500 text-white text-xs font-semibold"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Planned Draft Inert Banner (if status === 'planned') */}
              {selectedDraft?.status === 'planned' && (
                <div
                  data-testid="planned-inert-banner"
                  className="bg-amber-50 dark:bg-amber-950/60 border border-dashed border-amber-400 dark:border-amber-700 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="text-xs text-amber-900 dark:text-amber-200">
                    <span className="font-bold">📌 Planned Draft (Inert): </span>
                    This draft holds a placeholder date on your Calendar (
                    {selectedDraft.scheduled_date
                      ? new Date(selectedDraft.scheduled_date).toLocaleString()
                      : 'TBD'}
                    ), but will <strong>not</strong> auto-publish until you confirm the schedule.
                  </div>
                  <button
                    type="button"
                    data-testid="confirm-planned-schedule-btn"
                    onClick={() =>
                      handleSaveOrTransitionDraft({ action: 'confirm_schedule' })
                    }
                    className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm"
                  >
                    Confirm Schedule →
                  </button>
                </div>
              )}

              {/* Validation Error / Warning Alert Box */}
              {(liveValidation.errors.length > 0 ||
                liveValidation.warnings.length > 0) && (
                <div
                  data-testid="composer-validation-banner"
                  className={`rounded-2xl p-3.5 border text-xs space-y-1 ${
                    liveValidation.errors.length > 0
                      ? 'bg-red-50 border-red-300 text-red-900 dark:bg-red-950/60 dark:border-red-800 dark:text-red-200'
                      : 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/60 dark:border-amber-800 dark:text-amber-200'
                  }`}
                >
                  {liveValidation.errors.map((err, i) => (
                    <div key={i} className="font-semibold flex items-center gap-1.5">
                      <span>⛔</span>
                      <span>{err}</span>
                    </div>
                  ))}
                  {liveValidation.warnings.map((w, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span>⚠️</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Thread Posts Stack */}
              <div className="space-y-4">
                {posts.map((post, idx) => {
                  const charLen = (post.text || '').length;
                  const xOver = charLen > 280;
                  return (
                    <div
                      key={post.id}
                      data-testid={`thread-post-card-${idx}`}
                      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3 transition focus-within:ring-2 focus-within:ring-orange-500/40"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-zinc-200">
                            @{activeSocialSet?.username || 'typefully'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            • Post {idx + 1} of {posts.length}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              // Split current post at double newline or midpoint
                              const parts = post.text.includes('\n\n')
                                ? post.text.split(/\n\n+/)
                                : [
                                    post.text.slice(0, Math.ceil(post.text.length / 2)),
                                    post.text.slice(Math.ceil(post.text.length / 2)),
                                  ];
                              if (parts.filter(Boolean).length >= 2) {
                                const nextPosts = [...posts];
                                nextPosts.splice(
                                  idx,
                                  1,
                                  ...parts.filter(Boolean).map((chunk, cIdx) => ({
                                    id: `p_split_${Date.now()}_${cIdx}`,
                                    text: chunk.trim(),
                                  }))
                                );
                                setPosts(nextPosts);
                                showNotice('Split post into thread items');
                              }
                            }}
                            className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 hover:bg-slate-200"
                            title="Split Post into Thread"
                          >
                            ✂️ Split
                          </button>
                          {posts.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setPosts((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="px-2 py-0.5 rounded bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>

                      <textarea
                        rows={4}
                        value={post.text}
                        data-testid={`post-textarea-${idx}`}
                        onChange={(e) => {
                          const val = e.target.value;
                          // Auto-split on 3 consecutive newlines
                          if (val.includes('\n\n\n')) {
                            const chunks = val.split('\n\n\n');
                            const nextPosts = [...posts];
                            nextPosts.splice(
                              idx,
                              1,
                              ...chunks.map((c, cIdx) => ({
                                id: cIdx === 0 ? post.id : `p_${Date.now()}_${cIdx}`,
                                text: c,
                              }))
                            );
                            setPosts(nextPosts);
                            return;
                          }
                          setPosts((prev) =>
                            prev.map((item, i) =>
                              i === idx ? { ...item, text: val } : item
                            )
                          );
                        }}
                        placeholder="Write your hook or insight… (Press Enter 3x to split into next thread post)"
                        className="w-full bg-transparent resize-y text-sm sm:text-base leading-relaxed focus:outline-none"
                      />

                      {/* Attached Media & PDF Carousels */}
                      {Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {post.mediaUrls.map((m: any) => (
                            <div
                              key={m.id}
                              className="p-2.5 rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800/60 flex items-center justify-between gap-2 text-xs"
                            >
                              <div className="truncate">
                                <div className="font-semibold truncate">
                                  {m.mimeType === 'application/pdf' ? '📑 ' : '🖼️ '}
                                  {m.fileName || 'Attachment'}
                                </div>
                                <div className="text-[11px] text-slate-500 truncate">
                                  Alt: {m.altText || 'No alt text'}
                                </div>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  data-testid={`ai-alt-text-btn-${idx}`}
                                  onClick={() => handleGenerateAltText(idx, m.id)}
                                  className="px-2 py-1 rounded bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-semibold text-[11px]"
                                >
                                  ✨ AI Alt
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPosts((prev) =>
                                      prev.map((item, i) =>
                                        i === idx
                                          ? {
                                              ...item,
                                              mediaIds: (item.mediaIds || []).filter(
                                                (id) => id !== m.id
                                              ),
                                              mediaUrls: (item.mediaUrls || []).filter(
                                                (u: any) => u.id !== m.id
                                              ),
                                            }
                                          : item
                                      )
                                    )
                                  }
                                  className="px-1.5 py-1 rounded text-red-600"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Post Bottom Toolbar & Character Counters */}
                      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            data-testid={`attach-image-btn-${idx}`}
                            onClick={() => handleAttachMedia(idx, 'image')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 font-medium"
                          >
                            🖼️ Image
                          </button>
                          <button
                            type="button"
                            data-testid={`attach-pdf-btn-${idx}`}
                            onClick={() => handleAttachMedia(idx, 'pdf')}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 font-medium"
                          >
                            📑 LinkedIn PDF
                          </button>
                          {idx === 0 && (
                            <button
                              type="button"
                              data-testid="toggle-poll-btn"
                              onClick={() => setPollEnabled((v) => !v)}
                              className={`px-2.5 py-1 rounded-lg font-medium ${
                                pollEnabled
                                  ? 'bg-orange-500 text-white'
                                  : 'bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200'
                              }`}
                            >
                              📊 Poll
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setRightDrawerTab('vesper');
                              handleRunVesperCommand('punchier');
                            }}
                            className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 font-semibold"
                          >
                            ✨ Vesper Rewrite
                          </button>
                        </div>

                        {/* Per-platform character counters */}
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span
                            data-testid={`char-counter-x-${idx}`}
                            className={
                              xOver
                                ? 'text-red-600 font-bold'
                                : 'text-slate-500 dark:text-zinc-400'
                            }
                          >
                            𝕏 {charLen}/280
                          </span>
                          {platformsConfig.bluesky?.enabled && (
                            <span
                              className={
                                charLen > 300
                                  ? 'text-red-600 font-bold'
                                  : 'text-slate-400'
                              }
                            >
                              🦋 {charLen}/300
                            </span>
                          )}
                          {platformsConfig.linkedin?.enabled && (
                            <span className="text-slate-400">in {charLen}/3000</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  type="button"
                  data-testid="add-thread-post-btn"
                  onClick={() =>
                    setPosts((prev) => [
                      ...prev,
                      { id: `p_${Date.now()}_${prev.length}`, text: '' },
                    ])
                  }
                  className="w-full py-2.5 rounded-2xl border-2 border-dashed border-slate-200 dark:border-zinc-800 text-xs font-semibold text-slate-500 hover:border-orange-400 hover:text-orange-600 transition"
                >
                  + Add Another Post to Thread
                </button>
              </div>

              {/* Poll Builder Card */}
              {pollEnabled && (
                <div
                  data-testid="poll-builder-card"
                  className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      📊 Interactive Poll (𝕏, LinkedIn, Threads, Mastodon)
                    </h3>
                    <button
                      type="button"
                      onClick={() => setPollEnabled(false)}
                      className="text-xs text-red-600 font-medium"
                    >
                      Remove Poll
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {pollOptions.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={opt}
                          data-testid={`poll-option-input-${oIdx}`}
                          onChange={(e) =>
                            setPollOptions((prev) =>
                              prev.map((item, i) => (i === oIdx ? e.target.value : item))
                            )
                          }
                          placeholder={`Option ${oIdx + 1} (max 25 chars on 𝕏)`}
                          className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() =>
                              setPollOptions((prev) => prev.filter((_, i) => i !== oIdx))
                            }
                            className="text-xs text-slate-400 hover:text-red-500 px-1"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    {pollOptions.length < 4 ? (
                      <button
                        type="button"
                        onClick={() => setPollOptions((prev) => [...prev, ''])}
                        className="text-orange-600 font-semibold"
                      >
                        + Add Option (up to 4)
                      </button>
                    ) : (
                      <span className="text-slate-400">Maximum 4 options</span>
                    )}

                    <select
                      aria-label="Poll Duration"
                      value={pollDuration}
                      onChange={(e) => setPollDuration(Number(e.target.value))}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                    >
                      <option value={60}>1 Hour</option>
                      <option value={1440}>1 Day (24h)</option>
                      <option value={4320}>3 Days</option>
                      <option value={10080}>7 Days</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Advanced Platform Settings & Growth Automations Accordion */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                <button
                  type="button"
                  data-testid="toggle-advanced-settings-btn"
                  onClick={() => setShowAdvancedPanel((v) => !v)}
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                >
                  <span>
                    ⚡ Platform Settings (Reply Gate, First Comment, Topic) & Growth Automations (Auto-Plug, Auto-DM, Auto-Repost)
                  </span>
                  <span>{showAdvancedPanel ? '▲' : '▼'}</span>
                </button>

                {showAdvancedPanel && (
                  <div className="p-4 border-t border-slate-100 dark:border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Platform Specifics */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        Platform-Specific Options
                      </h4>
                      <div>
                        <label className="block text-slate-500 mb-1">
                          𝕏 Who can reply (`reply_settings`)
                        </label>
                        <select
                          value={xSettings.reply_settings || 'everyone'}
                          onChange={(e) =>
                            setXSettings({ ...xSettings, reply_settings: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                        >
                          <option value="everyone">Everyone</option>
                          <option value="verified">Verified accounts only</option>
                          <option value="following">Accounts you follow</option>
                          <option value="mentioned">Only mentioned users</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1">
                          𝕏 Community ID (optional)
                        </label>
                        <input
                          type="text"
                          value={xSettings.community_id || ''}
                          onChange={(e) =>
                            setXSettings({ ...xSettings, community_id: e.target.value })
                          }
                          placeholder="e.g. 14929182910"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1">
                          LinkedIn First Comment (auto-posted on publish, max 1,250 chars)
                        </label>
                        <input
                          type="text"
                          data-testid="linkedin-first-comment-input"
                          value={linkedinSettings.first_comment || ''}
                          onChange={(e) =>
                            setLinkedinSettings({
                              ...linkedinSettings,
                              first_comment: e.target.value,
                            })
                          }
                          placeholder="Full docs & benchmarks → https://typefully.com/docs/api"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-500 mb-1">
                          Threads Topic Tag
                        </label>
                        <input
                          type="text"
                          value={threadsSettings.topic_tag || ''}
                          onChange={(e) =>
                            setThreadsSettings({
                              ...threadsSettings,
                              topic_tag: e.target.value,
                            })
                          }
                          placeholder="e.g. AI Agents"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                        />
                      </div>
                    </div>

                    {/* Growth Automations */}
                    <div className="space-y-3">
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        Growth Automations
                      </h4>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 space-y-2">
                        <label className="flex items-center justify-between font-semibold">
                          <span>🔌 Auto-Plug (Viral Follow-up Reply)</span>
                          <input
                            type="checkbox"
                            data-testid="auto-plug-checkbox"
                            checked={Boolean(autoPlug.enabled)}
                            onChange={(e) =>
                              setAutoPlug({ ...autoPlug, enabled: e.target.checked })
                            }
                          />
                        </label>
                        {autoPlug.enabled && (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span>Trigger at</span>
                              <input
                                type="number"
                                value={autoPlug.threshold || 50}
                                onChange={(e) =>
                                  setAutoPlug({
                                    ...autoPlug,
                                    threshold: Number(e.target.value),
                                  })
                                }
                                className="w-16 px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                              />
                              <span>likes</span>
                            </div>
                            <input
                              type="text"
                              value={autoPlug.plugText || ''}
                              onChange={(e) =>
                                setAutoPlug({ ...autoPlug, plugText: e.target.value })
                              }
                              className="w-full px-2 py-1 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                            />
                          </div>
                        )}
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 space-y-2">
                        <label className="flex items-center justify-between font-semibold">
                          <span>🔁 Auto-Repost (Timezone Boost)</span>
                          <input
                            type="checkbox"
                            data-testid="auto-repost-checkbox"
                            checked={Boolean(autoRepost.enabled)}
                            onChange={(e) =>
                              setAutoRepost({ ...autoRepost, enabled: e.target.checked })
                            }
                          />
                        </label>
                        {autoRepost.enabled && (
                          <div className="flex items-center gap-2">
                            <span>Repost after</span>
                            <input
                              type="number"
                              value={autoRepost.delayHours || 12}
                              onChange={(e) =>
                                setAutoRepost({
                                  ...autoRepost,
                                  delayHours: Number(e.target.value),
                                })
                              }
                              className="w-16 px-2 py-0.5 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                            />
                            <span>hours</span>
                          </div>
                        )}
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 space-y-2">
                        <label className="flex items-center justify-between font-semibold">
                          <span>📩 Auto-DM Lead Magnet Campaign</span>
                          <input
                            type="checkbox"
                            data-testid="auto-dm-checkbox"
                            checked={Boolean(autoDm.enabled)}
                            onChange={(e) =>
                              setAutoDm({ ...autoDm, enabled: e.target.checked })
                            }
                          />
                        </label>
                        {autoDm.enabled && (
                          <div className="space-y-1.5">
                            <input
                              type="text"
                              value={autoDm.triggerKeyword || 'MCP'}
                              onChange={(e) =>
                                setAutoDm({ ...autoDm, triggerKeyword: e.target.value })
                              }
                              placeholder="Trigger keyword (e.g. MCP)"
                              className="w-full px-2 py-1 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                            />
                            <input
                              type="text"
                              value={autoDm.dmTemplate || ''}
                              onChange={(e) =>
                                setAutoDm({ ...autoDm, dmTemplate: e.target.value })
                              }
                              placeholder="DM message template…"
                              className="w-full px-2 py-1 rounded bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Composer Bottom Publishing Action Bar */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid="save-draft-btn"
                    onClick={() =>
                      handleSaveOrTransitionDraft({
                        apply_numbering: numberingStyle !== 'none',
                      })
                    }
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-zinc-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-zinc-800"
                  >
                    💾 Save Draft
                  </button>

                  <button
                    type="button"
                    data-testid="plan-draft-btn"
                    onClick={() =>
                      handleSaveOrTransitionDraft({
                        plan_at: customScheduleInput
                          ? new Date(customScheduleInput).toISOString()
                          : 'next-free-slot',
                      })
                    }
                    className="px-3.5 py-2 rounded-xl border border-dashed border-amber-400 bg-amber-50/70 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100"
                    title="Put on Calendar without auto-publishing until confirmed"
                  >
                    📌 Plan on Calendar (Inert)
                  </button>

                  {selectedDraftId && (
                    <button
                      type="button"
                      data-testid="delete-draft-btn"
                      onClick={() => handleDeleteDraft(selectedDraftId)}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      Delete
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="datetime-local"
                    aria-label="Custom Schedule Date"
                    value={customScheduleInput}
                    onChange={(e) => setCustomScheduleInput(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl text-xs bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />

                  <button
                    type="button"
                    data-testid="schedule-next-slot-btn"
                    onClick={() =>
                      handleSaveOrTransitionDraft({
                        publish_at: customScheduleInput
                          ? new Date(customScheduleInput).toISOString()
                          : 'next-free-slot',
                      })
                    }
                    className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90"
                  >
                    📅 {customScheduleInput ? 'Schedule at Time' : 'Schedule Next Slot'}
                  </button>

                  <button
                    type="button"
                    data-testid="publish-now-btn"
                    onClick={() => handleSaveOrTransitionDraft({ publish_at: 'now' })}
                    className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-sm"
                  >
                    🚀 Publish Now
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 2: CALENDAR */}
          {activeTab === 'calendar' && (
            <div
              data-testid="calendar-view"
              className="flex-1 p-4 sm:p-6 space-y-5 max-w-6xl w-full mx-auto"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold">Content Calendar</h1>
                  <p className="text-xs text-slate-500">
                    Timezone: {activeSocialSet?.timezone || 'America/New_York'} •{' '}
                    <span className="text-sky-600 font-semibold">● Scheduled</span>{' '}
                    auto-publishes at slot time •{' '}
                    <span className="text-amber-600 font-semibold">◌ Planned</span> holds a
                    slot inertly until confirmed.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-xl bg-slate-200/70 dark:bg-zinc-800 flex text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => setCalendarMode('month')}
                      className={`px-3 py-1 rounded-lg ${
                        calendarMode === 'month'
                          ? 'bg-white dark:bg-zinc-900 shadow-sm'
                          : 'text-slate-500'
                      }`}
                    >
                      Month
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarMode('week')}
                      className={`px-3 py-1 rounded-lg ${
                        calendarMode === 'week'
                          ? 'bg-white dark:bg-zinc-900 shadow-sm'
                          : 'text-slate-500'
                      }`}
                    >
                      Week
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {(queueData?.days || [])
                  .slice(0, calendarMode === 'week' ? 7 : 14)
                  .map((day: any) => (
                    <div
                      key={day.date}
                      className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3.5 flex flex-col justify-between min-h-[170px] shadow-sm"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs pb-2 mb-2 border-b border-slate-100 dark:border-zinc-800">
                          <span className="font-bold uppercase text-slate-500">
                            {day.day_name}
                          </span>
                          <span className="font-mono font-semibold">{day.date}</span>
                        </div>

                        <div className="space-y-2">
                          {(day.items || []).map((slot: any, sIdx: number) =>
                            slot.draft ? (
                              <div
                                key={sIdx}
                                className={`p-2 rounded-xl text-xs border ${
                                  slot.draft.status === 'planned'
                                    ? 'bg-amber-50/80 dark:bg-amber-950/40 border-dashed border-amber-400'
                                    : 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800'
                                }`}
                              >
                                <div className="flex items-center justify-between font-semibold mb-0.5">
                                  <span>{slot.time_label}</span>
                                  <span className="uppercase text-[10px]">
                                    {slot.draft.status}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleSelectDraft(slot.draft)}
                                  className="text-left font-medium line-clamp-2 hover:underline"
                                >
                                  {slot.draft.draft_title || slot.draft.preview}
                                </button>
                                {slot.draft.status === 'planned' && (
                                  <button
                                    type="button"
                                    data-testid={`calendar-confirm-planned-${slot.draft.id}`}
                                    onClick={() =>
                                      handleConfirmPlannedDraftById(slot.draft.id)
                                    }
                                    className="mt-1.5 w-full py-1 rounded bg-amber-600 text-white font-bold text-[10px]"
                                  >
                                    ✓ Confirm Schedule
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div
                                key={sIdx}
                                className="px-2.5 py-1.5 rounded-lg border border-dashed border-slate-200 dark:border-zinc-800 text-[11px] text-slate-400 flex items-center justify-between"
                              >
                                <span>{slot.time_label} slot</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomScheduleInput(slot.at.slice(0, 16));
                                    setActiveTab('write');
                                  }}
                                  className="text-orange-600 font-semibold hover:underline"
                                >
                                  + Fill
                                </button>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* VIEW 3: SMART QUEUE */}
          {activeTab === 'queue' && (
            <div
              data-testid="queue-view"
              className="flex-1 p-4 sm:p-6 space-y-5 max-w-5xl w-full mx-auto"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold">Smart Queue</h1>
                  <p className="text-xs text-slate-500">
                    Reorder upcoming posts, confirm planned drafts, or customize your recurring weekly posting schedule.
                  </p>
                </div>
                <button
                  type="button"
                  data-testid="run-queue-worker-btn"
                  onClick={async () => {
                    const res = await fetch('/api/cron/publish-due', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        socialSetId: activeSocialSetId,
                        forceNext: true,
                      }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      await loadWorkspaceData(activeSocialSetId, selectedDraftId);
                      showNotice(
                        `Queue Worker published ${data.publishedCount} scheduled item(s) (skipped ${data.skippedInertPlannedCount} inert planned)`
                      );
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-orange-500 text-white text-xs font-bold shadow-xs hover:opacity-95"
                >
                  ⚡ Process Next Scheduled Slot
                </button>
              </div>

              {/* Scheduled & Planned Queue Cards with Swap Controls */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
                <h2 className="text-sm font-bold">
                  Upcoming Queue ({(queueData?.scheduled_drafts || []).length} items)
                </h2>
                <div className="space-y-2.5">
                  {(queueData?.scheduled_drafts || []).map(
                    (d: any, qIdx: number, arr: any[]) => (
                      <div
                        key={d.id}
                        data-testid={`queue-item-${d.id}`}
                        className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
                          d.status === 'planned'
                            ? 'border-dashed border-amber-400 bg-amber-50/40 dark:bg-amber-950/20'
                            : 'border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-800/40'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                              {d.scheduled_date
                                ? new Date(d.scheduled_date).toLocaleString()
                                : 'Unscheduled'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                d.status === 'planned'
                                  ? 'bg-amber-200 text-amber-900'
                                  : 'bg-sky-100 text-sky-800'
                              }`}
                            >
                              {d.status === 'planned'
                                ? 'Planned (Inert)'
                                : 'Scheduled (Active)'}
                            </span>
                          </div>
                          <div className="font-semibold text-sm truncate">
                            {d.draft_title || d.preview}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {d.status === 'planned' && (
                            <button
                              type="button"
                              data-testid={`queue-confirm-btn-${d.id}`}
                              onClick={() => handleConfirmPlannedDraftById(d.id)}
                              className="px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold"
                            >
                              ✓ Confirm Schedule
                            </button>
                          )}
                          {qIdx > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleSwapQueueDrafts(d.id, arr[qIdx - 1].id)
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-semibold"
                              title="Swap with previous slot"
                            >
                              ↑ Move Up
                            </button>
                          )}
                          {qIdx < arr.length - 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                handleSwapQueueDrafts(d.id, arr[qIdx + 1].id)
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-700 text-xs font-semibold"
                              title="Swap with next slot"
                            >
                              ↓ Move Down
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleSelectDraft(d)}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 text-xs font-semibold"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 4: GROW / ANALYTICS */}
          {activeTab === 'grow' && (
            <div
              data-testid="grow-view"
              className="flex-1 p-4 sm:p-6 space-y-6 max-w-6xl w-full mx-auto"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold">
                    Grow & Analytics — @{activeSocialSet?.username}
                  </h1>
                  <p className="text-xs text-slate-500">
                    Track cross-platform impressions, engagement rate, publishing streaks, and best times to post.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {['7d', '30d', '90d', '1y'].map((p) => (
                    <button
                      key={p}
                      type="button"
                      data-testid={`analytics-period-${p}`}
                      onClick={() => setAnalyticsPeriod(p)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                        analyticsPeriod === p
                          ? 'bg-slate-900 text-white dark:bg-orange-500'
                          : 'bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}

                  <a
                    href={`/api/v2/social-sets/${activeSocialSetId}/analytics?period=${analyticsPeriod}&format=csv`}
                    data-testid="export-analytics-csv-btn"
                    className="px-3.5 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold"
                  >
                    ⬇ Export CSV
                  </a>
                </div>
              </div>

              {/* Streak & Consistency Banner */}
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-xs uppercase font-bold opacity-90">
                    🔥 Publishing Streak
                  </div>
                  <div className="text-2xl font-black">
                    {activeSocialSet?.streak_days || 18} Days Active Streak
                  </div>
                  <div className="text-xs opacity-90">
                    Longest streak: {activeSocialSet?.longest_streak || 42} days • Target:{' '}
                    {activeSocialSet?.target_days_per_week || 5} days/week
                  </div>
                </div>
                <Link
                  href={`/stats/${activeSocialSet?.username || 'typefully'}`}
                  className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-sm"
                >
                  Share Public Stats Snapshot ↗
                </Link>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  {
                    label: 'Impressions',
                    value: (analyticsData?.kpis?.impressions || 84200).toLocaleString(),
                    delta: analyticsData?.kpis?.impressions_delta || '+28.4%',
                  },
                  {
                    label: 'Engagement Rate',
                    value: analyticsData?.kpis?.engagement_rate || '5.4%',
                    delta: analyticsData?.kpis?.engagement_delta || '+0.9%',
                  },
                  {
                    label: 'Total Followers',
                    value: (analyticsData?.kpis?.followers || 48920).toLocaleString(),
                    delta: analyticsData?.kpis?.followers_delta || '+14.2%',
                  },
                  {
                    label: 'Profile Clicks',
                    value: (analyticsData?.kpis?.profile_clicks || 1950).toLocaleString(),
                    delta: analyticsData?.kpis?.profile_clicks_delta || '+19.1%',
                  },
                ].map((kpi) => (
                  <div
                    key={kpi.label}
                    className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm"
                  >
                    <div className="text-xs text-slate-500 font-medium">{kpi.label}</div>
                    <div className="text-2xl font-black mt-1">{kpi.value}</div>
                    <div className="text-xs font-semibold text-emerald-600 mt-1">
                      {kpi.delta} vs prior period
                    </div>
                  </div>
                ))}
              </div>

              {/* Best Times Heatmap */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
                <h2 className="text-sm font-bold">
                  Best Times to Post (Audience Engagement Heatmap)
                </h2>
                <div className="grid grid-cols-7 gap-2 text-center text-xs">
                  {(analyticsData?.best_times_heatmap || []).map((col: any) => (
                    <div key={col.day} className="space-y-1.5">
                      <div className="font-bold uppercase text-slate-500">{col.day}</div>
                      {(col.slots || []).map((s: any) => (
                        <div
                          key={s.hour}
                          className={`py-1.5 rounded-lg text-[10px] font-semibold ${
                            s.score >= 90
                              ? 'bg-orange-500 text-white'
                              : s.score >= 75
                              ? 'bg-orange-200 text-orange-900 dark:bg-orange-900/60 dark:text-orange-200'
                              : 'bg-slate-100 dark:bg-zinc-800 text-slate-500'
                          }`}
                        >
                          {s.hour} ({s.score}%)
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Published Posts with One-Click Repurpose */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
                <h2 className="text-sm font-bold">Top Performing Published Posts</h2>
                <div className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {(analyticsData?.posts || []).map((post: any) => (
                    <div
                      key={post.id}
                      className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-sm truncate">
                          {post.draft_title || post.preview}
                        </div>
                        <div className="text-slate-500 mt-0.5">
                          👁️ {(post.metrics?.impressions || 18400).toLocaleString()} views • ❤️{' '}
                          {post.metrics?.likes || 610} likes • 🔁{' '}
                          {post.metrics?.reposts || 140} reposts • 🔖{' '}
                          {post.metrics?.bookmarks || 290} bookmarks
                        </div>
                      </div>
                      <button
                        type="button"
                        data-testid={`repurpose-post-btn-${post.id}`}
                        onClick={() => handleRepurposeDraft(post)}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 font-semibold"
                      >
                        ♻️ Repurpose High Performer
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: SETTINGS (Voice Profile, AI Prompts, API Keys, Webhooks, Teams) */}
          {activeTab === 'settings' && (
            <div
              data-testid="settings-view"
              className="flex-1 p-4 sm:p-6 space-y-6 max-w-5xl w-full mx-auto"
            >
              <div>
                <h1 className="text-xl font-bold">Workspace & API Settings</h1>
                <p className="text-xs text-slate-500">
                  Manage connected social platforms, Vesper AI custom prompts, API keys (`/api/v2/*`), webhooks, and team RBAC.
                </p>
              </div>

              {/* Vesper AI Custom Prompt Library */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold">✨ Custom Vesper AI Prompt Library</h2>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await fetch('/api/ai/prompts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'reset_defaults' }),
                      });
                      const data = await res.json();
                      if (data.results) setAiPrompts(data.results);
                      showNotice('Reset AI prompts to factory defaults');
                    }}
                    className="text-xs text-orange-600 font-semibold hover:underline"
                  >
                    Reset to Defaults
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {aiPrompts.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-zinc-800 flex items-start justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-bold">{p.title}</div>
                        <div className="text-slate-500 mt-0.5">{p.prompt}</div>
                      </div>
                      {!p.isDefault && (
                        <button
                          type="button"
                          onClick={async () => {
                            await fetch(`/api/ai/prompts?id=${p.id}`, {
                              method: 'DELETE',
                            });
                            await loadWorkspaceData(activeSocialSetId, selectedDraftId);
                          }}
                          className="text-red-500 font-semibold"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <input
                    type="text"
                    value={newPromptTitle}
                    onChange={(e) => setNewPromptTitle(e.target.value)}
                    placeholder="Command title (e.g. Founder Contrarian Take)"
                    data-testid="new-ai-prompt-title"
                    className="px-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                  <input
                    type="text"
                    value={newPromptInstruction}
                    onChange={(e) => setNewPromptInstruction(e.target.value)}
                    placeholder="Instruction for Vesper AI…"
                    data-testid="new-ai-prompt-instruction"
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                  <button
                    type="button"
                    data-testid="create-ai-prompt-btn"
                    onClick={async () => {
                      if (!newPromptTitle || !newPromptInstruction) return;
                      const res = await fetch('/api/ai/prompts', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          title: newPromptTitle,
                          prompt: newPromptInstruction,
                        }),
                      });
                      if (res.ok) {
                        setNewPromptTitle('');
                        setNewPromptInstruction('');
                        await loadWorkspaceData(activeSocialSetId, selectedDraftId);
                        showNotice('Added custom Vesper AI command');
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold"
                  >
                    + Add Prompt
                  </button>
                </div>
              </div>

              {/* Public API v2 Keys */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-4">
                <h2 className="text-sm font-bold">🔑 API Keys (Typefully Public API v2 & MCP)</h2>
                {newlyCreatedRawKey && (
                  <div
                    data-testid="newly-created-api-key-banner"
                    className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 text-xs font-mono flex items-center justify-between"
                  >
                    <span>New Secret Key: {newlyCreatedRawKey}</span>
                    <button
                      type="button"
                      onClick={() => setNewlyCreatedRawKey(null)}
                      className="text-emerald-800 font-sans font-bold"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                <div className="space-y-2">
                  {apiKeys.map((k) => (
                    <div
                      key={k.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold">{k.label}</span>
                        <span className="ml-2 font-mono text-slate-500">
                          {k.keyPrefix}••••••••
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/settings?kind=api_key&id=${k.id}`, {
                            method: 'DELETE',
                          });
                          await loadWorkspaceData(activeSocialSetId, selectedDraftId);
                          showNotice('Revoked API key');
                        }}
                        className="text-red-600 font-semibold"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newApiKeyLabel}
                    onChange={(e) => setNewApiKeyLabel(e.target.value)}
                    placeholder="Key label…"
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                  <button
                    type="button"
                    data-testid="generate-api-key-btn"
                    onClick={async () => {
                      const res = await fetch('/api/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          kind: 'api_key',
                          label: newApiKeyLabel,
                        }),
                      });
                      const data = await res.json();
                      if (data.rawKey) {
                        setNewlyCreatedRawKey(data.rawKey);
                        await loadWorkspaceData(activeSocialSetId, selectedDraftId);
                        showNotice('Generated new API v2 key');
                      }
                    }}
                    className="px-4 py-1.5 rounded-lg bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 text-xs font-bold"
                  >
                    + Generate API Key
                  </button>
                </div>
              </div>

              {/* Webhooks */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-4">
                <h2 className="text-sm font-bold">🪝 Outbound Webhooks</h2>
                <div className="space-y-2">
                  {webhooks.map((wh) => (
                    <div
                      key={wh.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700 flex items-center justify-between text-xs"
                    >
                      <div className="truncate">
                        <div className="font-mono font-semibold truncate">{wh.url}</div>
                        <div className="text-[11px] text-slate-500">
                          Secret: {wh.secret.slice(0, 12)}… • Events: {wh.eventsJson}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          await fetch(`/api/settings?kind=webhook&id=${wh.id}`, {
                            method: 'DELETE',
                          });
                          await loadWorkspaceData(activeSocialSetId, selectedDraftId);
                          showNotice('Removed webhook endpoint');
                        }}
                        className="text-red-600 font-semibold"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    placeholder="https://hooks.zapier.com/hooks/catch/…"
                    data-testid="new-webhook-url-input"
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                  <button
                    type="button"
                    data-testid="add-webhook-btn"
                    onClick={async () => {
                      if (!newWebhookUrl) return;
                      const res = await fetch('/api/settings', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          kind: 'webhook',
                          url: newWebhookUrl,
                          socialSetId: activeSocialSetId,
                        }),
                      });
                      if (res.ok) {
                        setNewWebhookUrl('');
                        await loadWorkspaceData(activeSocialSetId, selectedDraftId);
                        showNotice('Registered webhook endpoint');
                      }
                    }}
                    className="px-4 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold"
                  >
                    + Add Webhook
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* RIGHT PANE: Context Drawer (Vesper AI, Comments, Scratchpad, Multi-Platform Preview) */}
        <aside className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 flex flex-col shrink-0">
          <div className="p-2 grid grid-cols-4 gap-1 border-b border-slate-200/80 dark:border-zinc-800">
            {(
              [
                { id: 'vesper', label: '✨ Vesper AI' },
                {
                  id: 'comments',
                  label: `💬 Comments (${selectedDraft?.comment_threads?.length || 0})`,
                },
                { id: 'scratchpad', label: '📝 Notes' },
                { id: 'preview', label: '👁️ Preview' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                data-testid={`drawer-tab-${t.id}`}
                onClick={() => setRightDrawerTab(t.id)}
                className={`py-1.5 px-1.5 rounded-lg text-[11px] font-semibold truncate transition ${
                  rightDrawerTab === t.id
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-4">
            {/* TAB 1: VESPER AI */}
            {rightDrawerTab === 'vesper' && (
              <div className="space-y-4" data-testid="vesper-ai-drawer">
                <div>
                  <h3 className="text-sm font-bold">Vesper AI Writing Assistant</h3>
                  <p className="text-xs text-slate-500">
                    Context-aware thread transformations, viral hooks, and reviewer feedback incorporation.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { slug: 'punchier', label: '⚡ Make it punchier' },
                    { slug: 'threadify', label: '🧵 Turn into thread' },
                    { slug: 'adapt-linkedin', label: '💼 Adapt for LinkedIn' },
                    { slug: 'viral-hooks', label: '🎣 3 Viral Hooks' },
                    { slug: 'fix-grammar', label: '✓ Fix grammar' },
                    { slug: 'address-comments', label: '💬 Address comments' },
                  ].map((cmd) => (
                    <button
                      key={cmd.slug}
                      type="button"
                      data-testid={`vesper-cmd-${cmd.slug}`}
                      onClick={() => handleRunVesperCommand(cmd.slug)}
                      className="p-2 rounded-xl border border-slate-200 dark:border-zinc-800 hover:border-orange-400 text-left text-xs font-semibold transition"
                    >
                      {cmd.label}
                    </button>
                  ))}
                </div>

                {/* Custom user prompt execution */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                  <label className="block text-xs font-semibold text-slate-500">
                    Ask Vesper anything:
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={vesperCustomPrompt}
                      onChange={(e) => setVesperCustomPrompt(e.target.value)}
                      placeholder="e.g. Add a developer benchmark…"
                      className="flex-1 px-2.5 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleRunVesperCommand('custom', vesperCustomPrompt)
                      }
                      className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 text-xs font-bold"
                    >
                      Run
                    </button>
                  </div>
                </div>

                {vesperLoading && (
                  <div className="p-4 rounded-xl bg-orange-50/60 dark:bg-orange-950/30 text-xs text-orange-700 animate-pulse">
                    Vesper AI is crafting a suggestion…
                  </div>
                )}

                {vesperResult && (
                  <div
                    data-testid="vesper-suggestion-box"
                    className="p-3.5 rounded-2xl border-2 border-orange-400 bg-orange-50/40 dark:bg-orange-950/30 space-y-2.5 text-xs"
                  >
                    <div className="font-bold text-orange-800 dark:text-orange-300">
                      ✨ Vesper Suggestion ({vesperResult.command})
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {vesperResult.explanation}
                    </p>
                    <pre className="whitespace-pre-wrap font-sans bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-xs">
                      {vesperResult.suggestion}
                    </pre>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        data-testid="vesper-apply-btn"
                        onClick={handleApplyVesperResult}
                        className="flex-1 py-1.5 rounded-xl bg-orange-500 text-white font-bold"
                      >
                        ✓ Apply to Composer
                      </button>
                      <button
                        type="button"
                        onClick={() => setVesperResult(null)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-700"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: INLINE COMMENTS */}
            {rightDrawerTab === 'comments' && (
              <div className="space-y-4" data-testid="comments-drawer">
                <div>
                  <h3 className="text-sm font-bold">Inline Review Comments</h3>
                  <p className="text-xs text-slate-500">
                    Highlight text or leave collaborative notes for your team.
                  </p>
                </div>

                <div className="space-y-2">
                  <input
                    type="text"
                    value={newCommentQuote}
                    onChange={(e) => setNewCommentQuote(e.target.value)}
                    placeholder="Quoted text snippet (optional)…"
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                  <textarea
                    rows={2}
                    value={newCommentText}
                    data-testid="new-comment-input"
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Leave a review comment…"
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
                  />
                  <button
                    type="button"
                    data-testid="add-comment-btn"
                    onClick={handleAddCommentThread}
                    className="w-full py-1.5 rounded-xl bg-slate-900 dark:bg-zinc-100 text-white dark:text-slate-900 text-xs font-bold"
                  >
                    + Post Comment
                  </button>
                </div>

                <div className="space-y-2.5">
                  {(selectedDraft?.comment_threads || []).map((th: any) => (
                    <div
                      key={th.id}
                      data-testid={`comment-thread-${th.id}`}
                      className={`p-3 rounded-xl border text-xs space-y-2 ${
                        th.resolved
                          ? 'opacity-60 bg-slate-50 dark:bg-zinc-900 border-slate-200 dark:border-zinc-800'
                          : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                      }`}
                    >
                      {th.quoteText && (
                        <blockquote className="pl-2 border-l-2 border-orange-400 italic text-[11px] text-slate-500">
                          “{th.quoteText}”
                        </blockquote>
                      )}
                      {(th.comments || []).map((c: any) => (
                        <div key={c.id}>
                          <span className="font-bold">{c.authorName}: </span>
                          <span>{c.content}</span>
                        </div>
                      ))}
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleToggleResolveThread(th.id, !th.resolved)}
                          className="text-[11px] font-semibold text-orange-600 hover:underline"
                        >
                          {th.resolved ? 'Reopen' : '✓ Resolve'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: SCRATCHPAD */}
            {rightDrawerTab === 'scratchpad' && (
              <div className="space-y-3" data-testid="scratchpad-drawer">
                <h3 className="text-sm font-bold">Private Draft Scratchpad</h3>
                <p className="text-xs text-slate-500">
                  Jot down links, rough bullets, or research notes for this draft. Never published.
                </p>
                <textarea
                  rows={10}
                  value={scratchpadText}
                  data-testid="scratchpad-textarea"
                  onChange={(e) => setScratchpadText(e.target.value)}
                  placeholder="Paste URLs, stats, or rough hooks here…"
                  className="w-full p-3 rounded-xl text-xs bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 leading-relaxed"
                />
                <button
                  type="button"
                  onClick={() => handleSaveOrTransitionDraft()}
                  className="w-full py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold"
                >
                  Save Scratchpad Notes
                </button>
              </div>
            )}

            {/* TAB 4: MULTI-PLATFORM LIVE PREVIEW */}
            {rightDrawerTab === 'preview' && (
              <div className="space-y-4" data-testid="preview-drawer">
                <h3 className="text-sm font-bold">Native Multi-Platform Previews</h3>
                {PLATFORM_DEFS.filter((p) => platformsConfig[p.key]?.enabled).map(
                  (p) => (
                    <div
                      key={p.key}
                      className="p-3.5 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-slate-50/70 dark:bg-zinc-800/40 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">
                          {p.label} {p.fullName} Preview
                        </span>
                        <span className="text-[10px] text-slate-400">
                          @{activeSocialSet?.username}
                        </span>
                      </div>
                      <div className="whitespace-pre-wrap text-slate-700 dark:text-zinc-200 leading-relaxed">
                        {p.key === 'linkedin'
                          ? posts.map((item) => item.text).join('\n\n')
                          : posts[0]?.text || 'Start typing to preview…'}
                      </div>
                      {p.key === 'linkedin' && linkedinSettings.first_comment && (
                        <div className="pt-2 border-t border-slate-200 dark:border-zinc-700 text-[11px] text-slate-500">
                          💬 First comment: {linkedinSettings.first_comment}
                        </div>
                      )}
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* COMMAND BAR MODAL (⌘K) */}
      {commandBarOpen && (
        <div
          data-testid="command-bar-modal"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center pt-20 px-4"
          onClick={() => setCommandBarOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-slate-200 dark:border-zinc-800">
              <input
                type="text"
                autoFocus
                value={commandSearch}
                onChange={(e) => setCommandSearch(e.target.value)}
                placeholder="Type a command or search actions… (Esc to close)"
                className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-zinc-800 rounded-xl focus:outline-none"
              />
            </div>
            <div className="p-2 max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
              {[
                {
                  label: '✍️ Create New Draft',
                  run: () => handleCreateNewDraft('New Command Draft', ''),
                },
                {
                  label: '🚀 Publish Current Draft Now',
                  run: () => handleSaveOrTransitionDraft({ publish_at: 'now' }),
                },
                {
                  label: '📅 Schedule to Next Free Queue Slot',
                  run: () =>
                    handleSaveOrTransitionDraft({ publish_at: 'next-free-slot' }),
                },
                {
                  label: '📌 Plan Draft on Calendar (Inert)',
                  run: () => handleSaveOrTransitionDraft({ plan_at: 'next-free-slot' }),
                },
                {
                  label: '✨ Vesper AI: Make It Punchier',
                  run: () => {
                    setRightDrawerTab('vesper');
                    handleRunVesperCommand('punchier');
                  },
                },
                {
                  label: '🧵 Vesper AI: Turn Into Thread',
                  run: () => {
                    setRightDrawerTab('vesper');
                    handleRunVesperCommand('threadify');
                  },
                },
                {
                  label: '🌙 Toggle Dark / Light Theme',
                  run: () => setDarkMode((d) => !d),
                },
                {
                  label: '🛡️ Open Admin Invitations & Audit Console',
                  run: () => router.push('/admin/invitations'),
                },
              ]
                .filter((item) =>
                  item.label.toLowerCase().includes(commandSearch.toLowerCase())
                )
                .map((cmd, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      cmd.run();
                      setCommandBarOpen(false);
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-orange-50 dark:hover:bg-zinc-800 rounded-lg font-medium flex items-center justify-between"
                  >
                    <span>{cmd.label}</span>
                    <span className="text-slate-400">↵</span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* KEYBOARD SHORTCUTS DIALOG (?) */}
      {shortcutsOpen && (
        <div
          data-testid="shortcuts-modal"
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShortcutsOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base">⌨️ Keyboard Shortcuts</h3>
              <button
                type="button"
                onClick={() => setShortcutsOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-2 text-xs">
              {[
                ['Open Command Bar', '⌘ K'],
                ['Show Keyboard Shortcuts', '?'],
                ['Split Thread Post', 'Enter 3x'],
                ['Publish / Schedule Dialog', '⌘ Enter'],
                ['Ask Vesper AI', '⌘ J'],
                ['Toggle Preview Drawer', '⌘ P'],
              ].map(([desc, key]) => (
                <div
                  key={desc}
                  className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-zinc-800"
                >
                  <span>{desc}</span>
                  <kbd className="px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 font-mono font-semibold">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW SOCIAL SET / BRAND MODAL */}
      {showNewBrandModal && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setShowNewBrandModal(false)}
        >
          <form
            onSubmit={handleCreateNewBrand}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 space-y-4 shadow-xl"
          >
            <h3 className="font-bold text-base">Create New Social Set</h3>
            <div className="space-y-2 text-xs">
              <label className="block font-semibold">Handle / Username</label>
              <input
                type="text"
                required
                value={newBrandUsername}
                onChange={(e) => setNewBrandUsername(e.target.value)}
                placeholder="e.g. acmelabs"
                className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
              <label className="block font-semibold">Display Name</label>
              <input
                type="text"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="e.g. Acme Labs"
                className="w-full px-3 py-2 rounded-lg bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700"
              />
            </div>
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowNewBrandModal(false)}
                className="px-3 py-1.5 rounded-lg border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg bg-orange-500 text-white font-bold"
              >
                Create Social Set
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
