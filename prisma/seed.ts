import { prisma } from '../src/lib/prisma';
import { hashPassword, hashOpaqueToken } from '../src/lib/account-admission';

async function main() {
  console.log('Seeding Typefully database...');

  const now = new Date();
  const adminPasswordHash = await hashPassword('TypefullyAdmin2026!');

  // 1. Seed Users (Admin, Editor, Viewer)
  const adminUser = await prisma.user.upsert({
    where: { email: 'fabrizio@typefully.com' },
    update: {
      name: 'Fabrizio Rinaldi',
      role: 'Admin',
      status: 'active',
      passwordHash: adminPasswordHash,
      emailVerified: now,
    },
    create: {
      id: 'u_fabrizio',
      email: 'fabrizio@typefully.com',
      name: 'Fabrizio Rinaldi',
      role: 'Admin',
      status: 'active',
      passwordHash: adminPasswordHash,
      emailVerified: now,
    },
  });

  await prisma.passwordCredential.upsert({
    where: { userId: adminUser.id },
    update: { passwordHash: adminPasswordHash, passwordChangedAt: now },
    create: { userId: adminUser.id, passwordHash: adminPasswordHash, passwordChangedAt: now },
  });

  const editorUser = await prisma.user.upsert({
    where: { email: 'francesco@typefully.com' },
    update: {
      name: 'Francesco Di Lorenzo',
      role: 'Editor',
      status: 'active',
      passwordHash: adminPasswordHash,
      emailVerified: now,
    },
    create: {
      id: 'u_francesco',
      email: 'francesco@typefully.com',
      name: 'Francesco Di Lorenzo',
      role: 'Editor',
      status: 'active',
      passwordHash: adminPasswordHash,
      emailVerified: now,
    },
  });

  await prisma.passwordCredential.upsert({
    where: { userId: editorUser.id },
    update: { passwordHash: adminPasswordHash, passwordChangedAt: now },
    create: { userId: editorUser.id, passwordHash: adminPasswordHash, passwordChangedAt: now },
  });

  const viewerUser = await prisma.user.upsert({
    where: { email: 'thomas@typefully.com' },
    update: {
      name: 'Thomas Paul Mann',
      role: 'Viewer',
      status: 'active',
      passwordHash: adminPasswordHash,
      emailVerified: now,
    },
    create: {
      id: 'u_thomas',
      email: 'thomas@typefully.com',
      name: 'Thomas Paul Mann',
      role: 'Viewer',
      status: 'active',
      passwordHash: adminPasswordHash,
      emailVerified: now,
    },
  });

  await prisma.passwordCredential.upsert({
    where: { userId: viewerUser.id },
    update: { passwordHash: adminPasswordHash, passwordChangedAt: now },
    create: { userId: viewerUser.id, passwordHash: adminPasswordHash, passwordChangedAt: now },
  });

  // 2. Seed Teams
  const coreTeam = await prisma.team.upsert({
    where: { slug: 'typefully-core' },
    update: { name: 'Typefully Core', color: '#1D9BF0', planTier: 'BUSINESS' },
    create: {
      id: 'team_typefully',
      name: 'Typefully Core',
      slug: 'typefully-core',
      color: '#1D9BF0',
      planTier: 'BUSINESS',
    },
  });

  const framerTeam = await prisma.team.upsert({
    where: { slug: 'framer-growth' },
    update: { name: 'Framer Growth', color: '#4F46E5', planTier: 'BUSINESS' },
    create: {
      id: 'team_framer',
      name: 'Framer Growth',
      slug: 'framer-growth',
      color: '#4F46E5',
      planTier: 'BUSINESS',
    },
  });

  for (const [uId, role] of [
    [adminUser.id, 'Admin'],
    [editorUser.id, 'Editor'],
    [viewerUser.id, 'Viewer'],
  ] as const) {
    await prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: coreTeam.id, userId: uId } },
      update: { role },
      create: { teamId: coreTeam.id, userId: uId, role },
    });
  }

  // 3. Seed Social Sets
  const defaultQueueRules = [
    { h: 9, m: 0, days: ['mon', 'tue', 'wed', 'thu', 'fri'] },
    { h: 14, m: 25, days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'] },
    { h: 18, m: 0, days: ['tue', 'thu', 'sun'] },
  ];

  const defaultVoiceProfile = {
    persona: 'Product-led founder & builder sharing crisp, tactical insights without fluff.',
    tone: 'Punchy, conversational, high-signal',
    rules: [
      'Never use em dashes on LinkedIn',
      'Start threads with a concrete metric or contrarian hook',
      'Keep sentences under 18 words where possible',
      'Use line breaks generously for scannability',
    ],
  };

  const analyticsSummary = {
    followers: 45840,
    followersDeltaPct: 3.3,
    impressions: 526050,
    impressionsDeltaPct: 7.8,
    publishedPosts: 39,
    publishedPostsDeltaPct: 12.5,
    profileClicks: 5470,
    profileClicksDeltaPct: 1.8,
    engagements: 21340,
    engagementsDeltaPct: 10.3,
    profileConversionRate: 11.4,
    dailySeries: [
      { date: 'Sep 22', impressions: 14200, engagements: 610, followers: 44420 },
      { date: 'Sep 26', impressions: 18900, engagements: 820, followers: 44680 },
      { date: 'Sep 30', impressions: 22400, engagements: 980, followers: 44910 },
      { date: 'Oct 04', impressions: 19800, engagements: 870, followers: 45120 },
      { date: 'Oct 08', impressions: 26300, engagements: 1240, followers: 45360 },
      { date: 'Oct 12', impressions: 31500, engagements: 1580, followers: 45590 },
      { date: 'Oct 16', impressions: 28900, engagements: 1390, followers: 45740 },
      { date: 'Oct 19', impressions: 34200, engagements: 1690, followers: 45840 },
    ],
  };

  const typefullySocialSet = await prisma.socialSet.upsert({
    where: { username: 'typefully' },
    update: {
      name: 'Typefully',
      bio: 'Write, schedule & publish on 𝕏, LinkedIn, Threads, Bluesky & Mastodon without distractions. Used by 45,000+ creators ⚡️',
      teamId: coreTeam.id,
      ownerId: adminUser.id,
      timezone: 'America/New_York',
      platformsJson: JSON.stringify({
        x: { enabled: true, handle: '@typefully', name: 'Typefully', verified: true, followers: 45840 },
        linkedin: { enabled: true, handle: 'typefully', name: 'Typefully Inc.', verified: true, followers: 21400 },
        threads: { enabled: true, handle: '@typefully', name: 'Typefully', verified: true, followers: 14200 },
        bluesky: { enabled: true, handle: 'typefully.bsky.social', name: 'Typefully', verified: true, followers: 9850 },
        mastodon: { enabled: true, handle: '@typefully@mastodon.social', name: 'Typefully', verified: false, followers: 6300 },
        substack: { enabled: true, handle: 'typefully.substack.com', name: 'Typefully Notes', verified: true, followers: 12900 },
        x_article: { enabled: true, handle: '@typefully', name: 'Typefully X Articles', verified: true },
      }),
      queueRulesJson: JSON.stringify(defaultQueueRules),
      voiceProfileJson: JSON.stringify(defaultVoiceProfile),
      streakDays: 18,
      bestStreakDays: 42,
      streakGoalPerWeek: 5,
      monthlyQuotaLimit: 1500,
      monthlyQuotaUsed: 39,
      analyticsSummaryJson: JSON.stringify(analyticsSummary),
    },
    create: {
      id: 1,
      username: 'typefully',
      name: 'Typefully',
      bio: 'Write, schedule & publish on 𝕏, LinkedIn, Threads, Bluesky & Mastodon without distractions. Used by 45,000+ creators ⚡️',
      teamId: coreTeam.id,
      ownerId: adminUser.id,
      timezone: 'America/New_York',
      platformsJson: JSON.stringify({
        x: { enabled: true, handle: '@typefully', name: 'Typefully', verified: true, followers: 45840 },
        linkedin: { enabled: true, handle: 'typefully', name: 'Typefully Inc.', verified: true, followers: 21400 },
        threads: { enabled: true, handle: '@typefully', name: 'Typefully', verified: true, followers: 14200 },
        bluesky: { enabled: true, handle: 'typefully.bsky.social', name: 'Typefully', verified: true, followers: 9850 },
        mastodon: { enabled: true, handle: '@typefully@mastodon.social', name: 'Typefully', verified: false, followers: 6300 },
        substack: { enabled: true, handle: 'typefully.substack.com', name: 'Typefully Notes', verified: true, followers: 12900 },
        x_article: { enabled: true, handle: '@typefully', name: 'Typefully X Articles', verified: true },
      }),
      queueRulesJson: JSON.stringify(defaultQueueRules),
      voiceProfileJson: JSON.stringify(defaultVoiceProfile),
      streakDays: 18,
      bestStreakDays: 42,
      streakGoalPerWeek: 5,
      monthlyQuotaLimit: 1500,
      monthlyQuotaUsed: 39,
      analyticsSummaryJson: JSON.stringify(analyticsSummary),
    },
  });

  const framerSocialSet = await prisma.socialSet.upsert({
    where: { username: 'framer' },
    update: {
      name: 'Framer',
      bio: 'Design and publish modern sites at the speed of thought. Built for designers and high-velocity teams.',
      teamId: framerTeam.id,
      ownerId: adminUser.id,
      timezone: 'Europe/Amsterdam',
      platformsJson: JSON.stringify({
        x: { enabled: true, handle: '@framer', name: 'Framer', verified: true, followers: 128400 },
        linkedin: { enabled: true, handle: 'framer', name: 'Framer', verified: true, followers: 89200 },
        threads: { enabled: true, handle: '@framer', name: 'Framer', verified: true, followers: 34100 },
        bluesky: { enabled: true, handle: 'framer.bsky.social', name: 'Framer', verified: true, followers: 19400 },
      }),
      queueRulesJson: JSON.stringify(defaultQueueRules),
      voiceProfileJson: JSON.stringify(defaultVoiceProfile),
      streakDays: 24,
      bestStreakDays: 60,
      streakGoalPerWeek: 5,
      monthlyQuotaLimit: 1500,
      monthlyQuotaUsed: 52,
      analyticsSummaryJson: JSON.stringify({
        ...analyticsSummary,
        followers: 128400,
        impressions: 940200,
        publishedPosts: 52,
        engagements: 44120,
      }),
    },
    create: {
      id: 2,
      username: 'framer',
      name: 'Framer',
      bio: 'Design and publish modern sites at the speed of thought. Built for designers and high-velocity teams.',
      teamId: framerTeam.id,
      ownerId: adminUser.id,
      timezone: 'Europe/Amsterdam',
      platformsJson: JSON.stringify({
        x: { enabled: true, handle: '@framer', name: 'Framer', verified: true, followers: 128400 },
        linkedin: { enabled: true, handle: 'framer', name: 'Framer', verified: true, followers: 89200 },
        threads: { enabled: true, handle: '@framer', name: 'Framer', verified: true, followers: 34100 },
        bluesky: { enabled: true, handle: 'framer.bsky.social', name: 'Framer', verified: true, followers: 19400 },
      }),
      queueRulesJson: JSON.stringify(defaultQueueRules),
      voiceProfileJson: JSON.stringify(defaultVoiceProfile),
      streakDays: 24,
      bestStreakDays: 60,
      streakGoalPerWeek: 5,
      monthlyQuotaLimit: 1500,
      monthlyQuotaUsed: 52,
      analyticsSummaryJson: JSON.stringify({
        ...analyticsSummary,
        followers: 128400,
        impressions: 940200,
        publishedPosts: 52,
        engagements: 44120,
      }),
    },
  });

  // 4. Seed Tags
  const tagDefinitions = [
    { slug: 'product-launch', name: 'Product Launch', color: '#4F46E5' },
    { slug: 'build-in-public', name: 'Build in Public', color: '#0EA5E9' },
    { slug: 'ai-agents', name: 'AI Agents & MCP', color: '#8B5CF6' },
    { slug: 'growth-playbook', name: 'Growth Playbook', color: '#10B981' },
    { slug: 'changelog', name: 'Changelog', color: '#F59E0B' },
    { slug: 'newsletter', name: 'Newsletter', color: '#EC4899' },
  ];

  for (const t of tagDefinitions) {
    await prisma.tag.upsert({
      where: { socialSetId_slug: { socialSetId: typefullySocialSet.id, slug: t.slug } },
      update: { name: t.name, color: t.color },
      create: {
        socialSetId: typefullySocialSet.id,
        slug: t.slug,
        name: t.name,
        color: t.color,
      },
    });
  }

  // 5. Seed Drafts across all statuses ('draft', 'planned', 'scheduled', 'published')
  await prisma.comment.deleteMany();
  await prisma.commentThread.deleteMany();
  await prisma.draft.deleteMany();

  const tomorrow9am = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  tomorrow9am.setHours(9, 0, 0, 0);

  const tomorrow2pm = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  tomorrow2pm.setHours(14, 25, 0, 0);

  const twoDaysOut = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);
  twoDaysOut.setHours(9, 0, 0, 0);

  const threeDaysOut = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  threeDaysOut.setHours(18, 0, 0, 0);

  const draft1 = await prisma.draft.create({
    data: {
      id: 101,
      socialSetId: typefullySocialSet.id,
      createdById: adminUser.id,
      draftTitle: 'Typefully v2 Public API + MCP Server Launch Thread',
      status: 'draft',
      isPinned: true,
      shareToken: 'share-mcp-launch-2026',
      isPubliclyShared: true,
      previewText: 'We just shipped Typefully API v2 and our official MCP Server for Claude, Cursor, and Codex! 🚀',
      scratchpadText: '- Mention OpenAPI 3.1.0 Scalar docs\n- Link to /ai-agents\n- Include LinkedIn first comment with GitHub repo',
      tagsJson: JSON.stringify(['product-launch', 'ai-agents']),
      numberingStyle: '1/n',
      postsJson: JSON.stringify([
        {
          id: 'p1',
          text: 'We just shipped Typefully API v2 and our official MCP Server for Claude, Cursor, and Codex! 🚀\n\nNow your AI agents can draft threads, schedule across 6 platforms, and resolve team comments directly from your terminal.',
          mediaIds: [],
          hideLinkPreview: false,
          quotePostUrl: '',
        },
        {
          id: 'p2',
          text: 'Why we built this:\n\n1. Write once, publish everywhere (𝕏, LinkedIn, Threads, Bluesky, Mastodon, Substack Notes)\n2. Inert "Planned" drafts so agents can propose a content calendar that only ships when you click Confirm\n3. Full webhook support for every lifecycle transition',
          mediaIds: [],
          hideLinkPreview: false,
          quotePostUrl: '',
        },
        {
          id: 'p3',
          text: 'Try the new Command Bar (⌘K), Vesper AI custom slash commands, and our free API today at typefully.com/docs/api ⚡️',
          mediaIds: [],
          hideLinkPreview: false,
          quotePostUrl: 'https://x.com/typefully/status/2025894220243063023',
        },
      ]),
      platformsJson: JSON.stringify({
        x: { enabled: true },
        linkedin: { enabled: true },
        threads: { enabled: true },
        bluesky: { enabled: true },
        mastodon: { enabled: false },
        substack: { enabled: true },
        x_article: { enabled: false },
      }),
      xSettingsJson: JSON.stringify({
        reply_to_url: null,
        community_id: null,
        share_with_followers: true,
        reply_settings: 'everyone',
        subscribers_only: false,
        paid_partnership: false,
        made_with_ai: false,
      }),
      linkedinSettingsJson: JSON.stringify({
        first_comment: 'Full OpenAPI 3.1.0 specification and MCP setup guide here: https://typefully.com/docs/api',
        linkedin_reshare_target: null,
        pdf_carousel_title: 'Typefully-v2-Architecture-Deck.pdf',
      }),
      threadsSettingsJson: JSON.stringify({
        topic_tag: 'AI Agents',
      }),
      autoPlugJson: JSON.stringify({
        enabled: true,
        triggerMetric: 'likes',
        threshold: 50,
        plugText: 'If you enjoyed this thread, grab our free AI Agent Skills kit at typefully.com/ai-agents 🛠️',
      }),
      autoRepostJson: JSON.stringify({
        enabled: true,
        delayHours: 12,
      }),
      autoDmJson: JSON.stringify({
        enabled: true,
        triggerKeyword: 'MCP',
        requireFollow: true,
        requireRetweet: false,
        dmTemplate: 'Hey! Here is your direct link to the Typefully MCP Server & API v2 starter kit: https://typefully.com/ai-agents 🚀',
        sentCount: 142,
      }),
      threadFinisherJson: JSON.stringify({
        enabled: true,
        templateText: 'TL;DR — Follow @typefully for weekly creator workflows and repost the first post below to share with your team 👇',
        quoteFirstPost: true,
      }),
      backupsJson: JSON.stringify([
        {
          id: 'bk_1',
          savedAt: new Date(now.getTime() - 3600 * 1000).toISOString(),
          label: 'Auto-backup (1 hour ago)',
          previewText: 'Early hook draft: Launching Typefully API v2 and MCP Server...',
        },
        {
          id: 'bk_2',
          savedAt: new Date(now.getTime() - 1800 * 1000).toISOString(),
          label: 'Auto-backup (30 mins ago)',
          previewText: 'We just shipped Typefully API v2 and our official MCP Server...',
        },
      ]),
      metricsJson: JSON.stringify({ impressions: 0, likes: 0, replies: 0, reposts: 0, bookmarks: 0, engagementRate: 0 }),
    },
  });

  // Add Comment Threads on Draft 101
  const ct1 = await prisma.commentThread.create({
    data: {
      id: 'ct_hook_review',
      draftId: draft1.id,
      platform: 'x',
      postIndex: 0,
      selectedText: 'We just shipped Typefully API v2',
      status: 'unresolved',
      comments: {
        create: [
          {
            authorId: editorUser.id,
            authorName: 'Francesco Di Lorenzo',
            authorEmail: 'francesco@typefully.com',
            text: 'I think this thread hook could be improved — let us highlight that Claude and Cursor work out of the box!',
          },
          {
            authorId: adminUser.id,
            authorName: 'Fabrizio Rinaldi',
            authorEmail: 'fabrizio@typefully.com',
            text: 'On it 🔥 Updated the first sentence to call out Claude, Cursor, and Codex.',
          },
        ],
      },
    },
  });

  await prisma.commentThread.create({
    data: {
      id: 'ct_linkedin_carousel',
      draftId: draft1.id,
      platform: 'linkedin',
      postIndex: 1,
      selectedText: 'Inert "Planned" drafts',
      status: 'resolved',
      comments: {
        create: [
          {
            authorId: viewerUser.id,
            authorName: 'Thomas Paul Mann',
            authorEmail: 'thomas@typefully.com',
            text: 'Love how clear the Planned vs Scheduled explanation is here.',
          },
        ],
      },
    },
  });

  // Draft 2: PLANNED state (inert on calendar until confirmed!)
  await prisma.draft.create({
    data: {
      id: 102,
      socialSetId: typefullySocialSet.id,
      createdById: editorUser.id,
      draftTitle: 'Cross-Platform Polls on LinkedIn, Threads & Mastodon',
      status: 'planned',
      isPinned: false,
      shareToken: 'share-polls-launch-2026',
      isPubliclyShared: true,
      previewText: 'You can now add polls to your LinkedIn, Threads, and Mastodon posts in Typefully, not just X 📊',
      scratchpadText: 'Planned for tomorrow morning slot — waiting on final poll options sign-off.',
      tagsJson: JSON.stringify(['changelog', 'product-launch']),
      numberingStyle: 'none',
      scheduledDate: tomorrow9am,
      pollJson: JSON.stringify({
        question: 'Which platform drives your highest engagement in 2026?',
        options: ['𝕏 / Twitter', 'LinkedIn', 'Threads', 'Bluesky'],
        durationMinutes: 1440,
      }),
      postsJson: JSON.stringify([
        {
          id: 'p_poll_1',
          text: 'You can now add polls to your LinkedIn, Threads, and Mastodon posts in Typefully, not just 𝕏 📊\n\nWrite a poll once and the options carry over to every platform in your draft that supports polls.',
          mediaIds: [],
          hideLinkPreview: false,
          quotePostUrl: '',
        },
      ]),
      platformsJson: JSON.stringify({
        x: { enabled: true },
        linkedin: { enabled: true },
        threads: { enabled: true },
        bluesky: { enabled: false },
        mastodon: { enabled: true },
        substack: { enabled: false },
        x_article: { enabled: false },
      }),
    },
  });

  // Draft 3: SCHEDULED state
  await prisma.draft.create({
    data: {
      id: 103,
      socialSetId: typefullySocialSet.id,
      createdById: adminUser.id,
      draftTitle: 'Team Calendar & Planned Drafts Workflow',
      status: 'scheduled',
      isPinned: true,
      shareToken: 'share-calendar-workflow-2026',
      isPubliclyShared: true,
      previewText: 'Big calendar updates! 📆 Drafts sidebar for drag & drop scheduling + New Queue view with kanban board.',
      scratchpadText: 'Confirmed for tomorrow afternoon queue slot.',
      tagsJson: JSON.stringify(['growth-playbook', 'build-in-public']),
      numberingStyle: '1/n',
      scheduledDate: tomorrow2pm,
      postsJson: JSON.stringify([
        {
          id: 'p_sched_1',
          text: 'Big calendar updates! 📆\n→ Drafts sidebar for drag & drop scheduling so you can batch a full week in minutes.\n❇️ New Queue view with kanban board so building a content pipeline is effortless.',
          mediaIds: [],
          hideLinkPreview: false,
          quotePostUrl: '',
        },
        {
          id: 'p_sched_2',
          text: 'Plan now, confirm later:\n\nSketch out your team launch across brand and founder accounts as Planned drafts, then let each owner click Confirm Schedule when ready.',
          mediaIds: [],
          hideLinkPreview: false,
          quotePostUrl: '',
        },
      ]),
      platformsJson: JSON.stringify({
        x: { enabled: true },
        linkedin: { enabled: true },
        threads: { enabled: true },
        bluesky: { enabled: true },
        mastodon: { enabled: false },
        substack: { enabled: false },
        x_article: { enabled: false },
      }),
    },
  });

  // Draft 4: SCHEDULED X Article long-form
  await prisma.draft.create({
    data: {
      id: 104,
      socialSetId: typefullySocialSet.id,
      createdById: adminUser.id,
      draftTitle: 'How We Built Vesper AI to Learn Your Writing Voice',
      status: 'scheduled',
      isPinned: false,
      shareToken: 'share-vesper-article-2026',
      isPubliclyShared: true,
      previewText: 'Articles are a great way to publish long-form content on X. Here is how Vesper AI personalizes every rewrite.',
      tagsJson: JSON.stringify(['ai-agents', 'newsletter']),
      numberingStyle: 'none',
      scheduledDate: twoDaysOut,
      postsJson: JSON.stringify([
        {
          id: 'p_art_1',
          text: '# How We Built Vesper AI to Learn Your Writing Voice\n\nMost AI writing tools sound robotic because they ignore rhythm, sentence length, and platform norms.\n\nIn Typefully, Vesper AI combines your top-performing historical posts with explicit voice rules (like "never use em dashes on LinkedIn") right inside your editor.',
          mediaIds: [],
          hideLinkPreview: false,
          quotePostUrl: '',
        },
      ]),
      platformsJson: JSON.stringify({
        x: { enabled: true },
        linkedin: { enabled: true },
        threads: { enabled: false },
        bluesky: { enabled: false },
        mastodon: { enabled: false },
        substack: { enabled: true },
        x_article: { enabled: true },
      }),
    },
  });

  // Drafts 5..9: PUBLISHED posts with rich analytics matching https://typefully.com/grow
  const publishedPosts = [
    {
      id: 105,
      title: 'NEW: Publish X Articles with Typefully ✍️',
      text: 'NEW: publish X Articles with Typefully ✍️\nArticles are a great way to publish long-form content on X.\nNow you can draft them in Typefully, get feedback with comments, and preview them before you publish or schedule.',
      tags: ['product-launch', 'changelog'],
      hoursAgo: 8,
      metrics: { impressions: 17400, likes: 55, replies: 13, reposts: 8, bookmarks: 21, engagementRate: 2.1, type: 'Long post' },
    },
    {
      id: 106,
      title: 'Auto-DMs: Boost Engagement and Gain Followers 📬',
      text: 'Auto-DMs: Boost Engagement and Gain Followers 📬\n\nEasily create giveaways, send content to your community, and boost engagement on your posts.\n\nCreators who tried the beta have gained hundreds of followers 🚀',
      tags: ['growth-playbook', 'product-launch'],
      hoursAgo: 48,
      metrics: { impressions: 28400, likes: 112, replies: 44, reposts: 19, bookmarks: 63, engagementRate: 3.4, type: 'Thread · 4' },
    },
    {
      id: 107,
      title: 'PDF Carousels in the LinkedIn Editor ✨',
      text: 'Today we are introducing PDF Carousels in the LinkedIn editor.\nPDF Carousels are great to make content stand out ✨\nStep-by-step guide? Your brilliant framework? Simply drop a PDF on your LinkedIn draft and publish!',
      tags: ['changelog', 'build-in-public'],
      hoursAgo: 96,
      metrics: { impressions: 14600, likes: 83, replies: 7, reposts: 3, bookmarks: 12, engagementRate: 1.9, type: 'Post' },
    },
    {
      id: 108,
      title: 'Auto Numbering Across All Platforms 🥹',
      text: 'Auto numbering is back! 🥹\nAnd now available on all platforms!\nChoose a numbering style (1/n, 1., [1/n]), and easily apply it to your thread to improve readability and engagement 📈',
      tags: ['changelog'],
      hoursAgo: 144,
      metrics: { impressions: 12800, likes: 50, replies: 12, reposts: 4, bookmarks: 17, engagementRate: 2.0, type: 'Thread · 3' },
    },
    {
      id: 109,
      title: 'Choose an Audience & Reply Settings for X Posts 📣',
      text: 'You can now choose an audience and reply settings for your 𝕏 posts 📣\nPick any 𝕏 Community, or restrict replies to accounts you follow, verified accounts, or subscribers.',
      tags: ['product-launch'],
      hoursAgo: 192,
      metrics: { impressions: 11800, likes: 54, replies: 9, reposts: 5, bookmarks: 15, engagementRate: 1.9, type: 'Post' },
    },
  ];

  for (const pub of publishedPosts) {
    const pubDate = new Date(now.getTime() - pub.hoursAgo * 3600 * 1000);
    await prisma.draft.create({
      data: {
        id: pub.id,
        socialSetId: typefullySocialSet.id,
        createdById: adminUser.id,
        draftTitle: pub.title,
        status: 'published',
        publishState: 'finished',
        isPinned: false,
        shareToken: `share-pub-${pub.id}`,
        isPubliclyShared: true,
        previewText: pub.text.slice(0, 120),
        tagsJson: JSON.stringify(pub.tags),
        postsJson: JSON.stringify([{ id: `pub_p_${pub.id}`, text: pub.text, mediaIds: [], hideLinkPreview: false, quotePostUrl: '' }]),
        platformsJson: JSON.stringify({
          x: { enabled: true },
          linkedin: { enabled: true },
          threads: { enabled: true },
          bluesky: { enabled: true },
        }),
        metricsJson: JSON.stringify(pub.metrics),
        scheduledDate: pubDate,
        publishedAt: pubDate,
        xPublishedUrl: `https://x.com/typefully/status/20260000${pub.id}`,
        linkedinPublishedUrl: `https://www.linkedin.com/feed/update/urn:li:share:7437089${pub.id}`,
        threadsPublishedUrl: `https://www.threads.net/@typefully/post/TF${pub.id}`,
        blueskyPublishedUrl: `https://bsky.app/profile/typefully.bsky.social/post/bsky${pub.id}`,
      },
    });
  }

  // Also seed a published post for @framer
  await prisma.draft.create({
    data: {
      id: 201,
      socialSetId: framerSocialSet.id,
      createdById: adminUser.id,
      draftTitle: 'Mastering Framer Agent & Responsive Layouts',
      status: 'published',
      publishState: 'finished',
      shareToken: 'share-framer-agent-2026',
      isPubliclyShared: true,
      previewText: 'Mastering Framer Agent: Ship responsive layouts, CMS collections, and interactive components in seconds.',
      tagsJson: JSON.stringify(['product-launch']),
      postsJson: JSON.stringify([
        {
          id: 'fr_1',
          text: 'Mastering Framer Agent: Ship responsive layouts, CMS collections, and interactive components in seconds ⚡️',
          mediaIds: [],
          hideLinkPreview: false,
          quotePostUrl: '',
        },
      ]),
      platformsJson: JSON.stringify({ x: { enabled: true }, linkedin: { enabled: true }, threads: { enabled: true } }),
      metricsJson: JSON.stringify({ impressions: 42100, likes: 310, replies: 29, reposts: 48, bookmarks: 95, engagementRate: 2.8, type: 'Thread · 5' }),
      publishedAt: new Date(now.getTime() - 24 * 3600 * 1000),
      xPublishedUrl: 'https://x.com/framer/status/20260000201',
    },
  });

  // 6. Seed Vesper AI Prompt Commands
  await prisma.aiPromptCommand.deleteMany();
  const builtInPrompts = [
    {
      label: 'Make it punchier 👊',
      slug: 'punchier',
      icon: 'Zap',
      instruction: 'Tighten the hook, remove filler words, and make every line high-impact.',
      isBuiltIn: true,
      sortOrder: 1,
    },
    {
      label: 'Convert to thread 🧵',
      slug: 'threadify',
      icon: 'ListOrdered',
      instruction: 'Split long-form notes into a numbered multi-post thread with a strong hook and takeaway.',
      isBuiltIn: true,
      sortOrder: 2,
    },
    {
      label: 'Adapt for LinkedIn 💼',
      slug: 'adapt-linkedin',
      icon: 'Briefcase',
      instruction: 'Reformat with professional storytelling, scannable bullet points, and zero em dashes.',
      isBuiltIn: true,
      sortOrder: 3,
    },
    {
      label: 'Write 5 viral hooks 🎯',
      slug: 'viral-hooks',
      icon: 'Sparkles',
      instruction: 'Generate 5 high-curiosity opening hooks (contrarian, metric-driven, story-driven).',
      isBuiltIn: true,
      sortOrder: 4,
    },
    {
      label: 'Fix grammar & polish ✨',
      slug: 'fix-grammar',
      icon: 'CheckCircle2',
      instruction: 'Fix spelling, grammar, and awkward phrasing while preserving the author voice.',
      isBuiltIn: true,
      sortOrder: 5,
    },
    {
      label: 'Address open comments 💬',
      slug: 'address-comments',
      icon: 'MessageSquare',
      instruction: 'Revise the draft to incorporate all unresolved team comments and feedback.',
      isBuiltIn: true,
      sortOrder: 6,
    },
  ];

  for (const p of builtInPrompts) {
    await prisma.aiPromptCommand.create({
      data: {
        socialSetId: typefullySocialSet.id,
        ...p,
        isEnabled: true,
      },
    });
  }

  // 7. Seed Invitations (including deterministic demo-invite-token-2026)
  await prisma.accountEmailOutbox.deleteMany();
  await prisma.accountInvitation.deleteMany();

  const demoToken = 'demo-invite-token-2026';
  const demoTokenHash = hashOpaqueToken(demoToken);
  const demoExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  await prisma.accountInvitation.create({
    data: {
      id: 'inv_demo_pending',
      email: 'invited.creator@typefully.com',
      normalizedEmail: 'invited.creator@typefully.com',
      activeForEmail: 'invited.creator@typefully.com',
      tokenHash: demoTokenHash,
      role: 'Editor',
      status: 'PENDING',
      invitedById: adminUser.id,
      expiresAt: demoExpiresAt,
    },
  });

  await prisma.accountInvitation.create({
    data: {
      id: 'inv_francesco_accepted',
      email: 'francesco@typefully.com',
      normalizedEmail: 'francesco@typefully.com',
      activeForEmail: null,
      tokenHash: null,
      role: 'Editor',
      status: 'ACCEPTED',
      invitedById: adminUser.id,
      acceptedById: editorUser.id,
      expiresAt: demoExpiresAt,
      acceptedAt: new Date(now.getTime() - 2 * 24 * 3600 * 1000),
    },
  });

  await prisma.accountInvitation.create({
    data: {
      id: 'inv_revoked_sample',
      email: 'former.contractor@agency.io',
      normalizedEmail: 'former.contractor@agency.io',
      activeForEmail: null,
      tokenHash: null,
      role: 'Viewer',
      status: 'REVOKED',
      invitedById: adminUser.id,
      expiresAt: demoExpiresAt,
      revokedAt: new Date(now.getTime() - 12 * 3600 * 1000),
    },
  });

  // 8. Seed Webhooks & API Keys
  await prisma.webhookEndpoint.deleteMany();
  await prisma.webhookEndpoint.create({
    data: {
      id: 'wh_slack_sync',
      socialSetId: typefullySocialSet.id,
      name: 'Slack #social-launches Notifier',
      url: 'https://hooks.slack.com/services/T000/B000/TYPEFULLY2026',
      eventsJson: JSON.stringify(['draft.created', 'draft.planned', 'draft.scheduled', 'draft.published']),
      secret: 'whsec_typefully_2026_secret',
      isActive: true,
      lastTriggeredAt: new Date(now.getTime() - 8 * 3600 * 1000),
    },
  });

  await prisma.apiKey.deleteMany();
  await prisma.apiKey.create({
    data: {
      id: 'ak_mcp_default',
      userId: adminUser.id,
      name: 'Claude & Cursor MCP Server Key',
      keyPrefix: 'typ_live_98f2...4a1c',
      keyHash: hashOpaqueToken('typ_live_98f2b71d00e14a1c'),
      lastUsedAt: new Date(now.getTime() - 1800 * 1000),
    },
  });

  // 9. Seed Audit Logs
  await prisma.auditLog.deleteMany();
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        actorRole: 'Admin',
        action: 'system.admin.bootstrap',
        targetType: 'User',
        targetId: adminUser.id,
        metadataJson: JSON.stringify({ source: 'cli', role: 'Admin' }),
        ipAddress: '127.0.0.1 (CLI)',
      },
      {
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        actorRole: 'Admin',
        action: 'account.invitation.create',
        targetType: 'AccountInvitation',
        targetId: 'inv_demo_pending',
        metadataJson: JSON.stringify({ email: 'invited.creator@typefully.com', role: 'Editor' }),
        ipAddress: '127.0.0.1',
      },
      {
        actorId: editorUser.id,
        actorEmail: editorUser.email,
        actorRole: 'Editor',
        action: 'account.invitation.accept',
        targetType: 'AccountInvitation',
        targetId: 'inv_francesco_accepted',
        metadataJson: JSON.stringify({ email: 'francesco@typefully.com', role: 'Editor' }),
        ipAddress: '127.0.0.1',
      },
      {
        actorId: adminUser.id,
        actorEmail: adminUser.email,
        actorRole: 'Admin',
        action: 'account.invitation.revoke',
        targetType: 'AccountInvitation',
        targetId: 'inv_revoked_sample',
        metadataJson: JSON.stringify({ email: 'former.contractor@agency.io', role: 'Viewer' }),
        ipAddress: '127.0.0.1',
      },
    ],
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
