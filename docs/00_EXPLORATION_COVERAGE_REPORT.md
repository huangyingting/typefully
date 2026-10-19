# Typefully Exploration Coverage & Behavioral Analysis Report

**Target URL:** `https://typefully.com`  
**Exploration Tooling:** Playwright (Chromium headless) across Desktop (`1440×900`), Tablet (`768×1024`), and Mobile (`390×844`) viewports  
**Authentication Context:** `.cred` cookies loaded into Playwright browser context + Next.js client bundle (`window.__BUILD_MANIFEST`) + Typefully OpenAPI 3.1.0 (`v2.0.0`) specification extraction  
**Screenshots Captured:** 35 screenshots stored in `/screenshots/`

---

## 1. Route & Page Exploration Coverage Matrix

| # | Route / URL | Category | HTTP Status | Viewports Tested | Screenshot Artifact(s) | Observed Capabilities & UX Notes |
|---|---|---|---|---|---|---|
| 1 | `/` | Public Landing & Auth Gate | `200 OK` | Desktop, Tablet, Mobile | `01-home-landing-desktop.png`, `01-home-landing-tablet.png`, `01-home-landing-mobile.png`, `22-home-email-auth-modal-desktop.png` | Hero value proposition, OAuth/Email sign-in buttons (Google, X/Twitter, LinkedIn, Email magic-link modal), interactive feature showcases for Writing Assistant, Queue scheduling, Multi-platform cross-posting, Analytics, Collaboration comments, and Zapier/MCP automations. |
| 2 | `/grow` | Analytics Workspace Demo | `200 OK` | Desktop, Tablet, Mobile | `02-grow-analytics-desktop.png`, `02-grow-analytics-tablet.png`, `02-grow-analytics-mobile.png` | Interactive creator analytics dashboard with sample data: 5 KPI summary cards (`Followers 45.84K +3.3%`, `Impressions 526.05K +7.8%`, `Published Posts 39`, `Profile Clicks 5.47K +1.8%`, `Engagements 21.34K +10.3%`), date range filter (`1 month`, `Sep 20 – Oct 19`), and searchable/sortable Posts Performance table (`All`, `Posts`, `Replies`) showing Impressions, Likes, Replies, Reposts, Bookmarks, and Engagement Rate. |
| 3 | `/ai` | Vesper AI Writing Assistant | `200 OK` | Desktop | `03-ai-assistant-desktop.png` | Showcases in-editor AI writing assistant ("Vesper AI") that learns creator voice, custom style instructions ("Never use em dashes for LinkedIn"), slash commands (`Make it punchier`, `Adapt for LinkedIn`, `Schedule it for tomorrow`), and inline text refinement (`Ctrl+I` / `Ctrl+J`). |
| 4 | `/ai-agents` | AI Agents & MCP Server | `200 OK` | Desktop | `04-ai-agents-mcp-desktop.png` | Documents Typefully MCP Server (`typefully-mcp-server`) and CLI Agent Skills enabling Claude, ChatGPT, Cursor, and Codex to create drafts, schedule posts, and resolve draft comments. |
| 5 | `/pricing` | Plans, Quotas & Feature Matrix | `200 OK` | Desktop, Tablet, Mobile | `05-pricing-plans-desktop.png`, `05-pricing-plans-tablet.png`, `05-pricing-plans-mobile.png` | Full pricing tiers (**Free**: 1 social set, 10 posts/mo; **Creator**: 1 social set, 1000 posts/mo, X analytics, AI writing; **Business**: up to 50 social sets, 1500 posts/mo, unlimited users, teams/roles/permissions, comments & Slack notifications) and complete feature comparison matrix across Publishing, Platforms, Collaboration, AI, Analytics, Integrations, Editing, LinkedIn, and Engagement. |
| 6 | `/changelog` | Product Changelog | `200 OK` | Desktop | `06-changelog-desktop.png` | Chronological product release notes detailing Polls on LinkedIn/Threads/Mastodon, Quote Posts on Bluesky/Mastodon/Substack, X Reply Settings, Official Claude Connector, 1080p Video on X, and Team Calendar with Planned Drafts. |
| 7 | `/shortcuts` | Keyboard Shortcuts Reference | `200 OK` | Desktop | `07-keyboard-shortcuts-desktop.png` | Full shortcut catalog across Navigation (`Ctrl+/`, `Ctrl+\`, `Ctrl+K`, `?`, `Ctrl+Shift+1/2/3`, `Ctrl+,`), Drafts (`Ctrl+.`, `Ctrl+Shift+P`, `Ctrl+Alt+S`, `Ctrl+Shift+Enter`, `Ctrl+Alt+Enter`), Editor (`Ctrl+Enter`, `Alt+Up/Down`, `Ctrl+Shift+I`, `Ctrl+Shift+F`, `Ctrl+Shift+H`, `Ctrl+Shift+M`), and AI (`Ctrl+J`, `Ctrl+I`). |
| 8 | `/docs/api` | Public REST API v2 Docs | `200 OK` | Desktop, Tablet, Mobile | `08-api-docs-desktop.png`, `08-api-docs-tablet.png`, `08-api-docs-mobile.png` | Scalar-powered OpenAPI 3.1.0 documentation for Typefully API v2.0.0 covering `/v2/me`, `/v2/social-sets`, `/v2/social-sets/{id}/drafts`, `/v2/social-sets/{id}/queue`, `/v2/social-sets/{id}/tags`, `/v2/social-sets/{id}/media/upload`, `/v2/social-sets/{id}/drafts/{id}/comment-threads`, and Webhooks. |
| 9 | `/typefully` & `/framer` | Public Creator Social Blog (`/[account_username]`) | `200 OK` | Desktop | `09-creator-profile-typefully-desktop.png` | Public social blog displaying creator avatar, bio, handle, follower badge, and published threads/posts with "Continue reading" expansion and "View on X" links. |
| 10 | `/stats/typefully-typefully-vPV3m` | Public Creator Stats (`/stats/[slug]`) | `200 OK` | Desktop | `10-creator-stats-public-desktop.png` | Public shareable creator analytics scorecard showing verified posting streaks, impressions, follower growth, and top posts. |
| 11 | `/tools` | Free Mini Tools Directory | `200 OK` | Desktop | `11-tools-hub-desktop.png` | Directory of free creator utilities and AI writing generators. |
| 12 | `/tools/twitter-character-counter` | X/Twitter Character & Bio Counter | `200 OK` | Desktop, Tablet, Mobile | `12-tool-twitter-counter-desktop.png`, `12-tool-twitter-counter-tablet.png`, `12-tool-twitter-counter-mobile.png`, `23-tool-twitter-counter-active.png` | Interactive real-time character counter for X posts (280 chars), X Premium long posts (25,000 chars), X Bio (160 chars), X Display Name (50 chars), and X DM (10,000 chars) with word/sentence/thread counters. |
| 13 | `/tools/linkedin-text-formatter` | LinkedIn Text Formatter | `200 OK` | Desktop | `13-tool-linkedin-formatter-desktop.png`, `24-tool-linkedin-formatter-active.png` | Interactive Unicode text styler (Bold, Italic, Bold Italic, Underline, Strikethrough, Monospace, Script, Circled) with live LinkedIn post preview and one-click copy. |
| 14 | `/tools/fake-tweet-generator` | Realistic Tweet Card Generator | `200 OK` | Desktop | `14-tool-fake-tweet-desktop.png` | Interactive tweet mockup studio with custom display name, `@handle`, verified badge, theme (Light/Dim/Dark), post text, timestamp, and engagement metrics. |
| 15 | `/tools/ai/ai-writer` | Free AI Social Post Writer | `200 OK` | Desktop | `15-tool-ai-writer-desktop.png` | Interactive AI prompt-to-post generator with tone selector and platform formatting. |
| 16 | `/x-twitter`, `/linkedin`, `/schedule-threads-posts` | Platform Landing Pages | `200 OK` | Desktop | `16-platform-x-twitter-desktop.png`, `17-platform-linkedin-desktop.png`, `18-platform-threads-desktop.png` | Platform-specific capabilities: X threads/communities/auto-plugs, LinkedIn PDF carousels/first comments/company mentions, Threads topic tags & cross-posting. |
| 17 | `/minimal-twitter` | Minimal Theme for X Extension | `200 OK` | Desktop | `19-minimal-twitter-desktop.png` | Companion browser extension showcase for distraction-free X reading. |
| 18 | `/oauth/consent` | OAuth 2.0 Consent Screen (Edge State) | `200 OK` | Desktop | `20-error-oauth-invalid-desktop.png` | Displays clean error state (`Invalid link — Missing or invalid OAuth parameters`) when visited without valid client_id/redirect_uri. |
| 19 | `/non-existent-route-404` | 404 Error Boundary | `404` | Desktop | `21-error-404-desktop.png` | Custom 404 page (`Not found... | Typefully`) with navigation recovery links. |

---

## 2. Authenticated Workspace Route & Bundle Analysis

By inspecting `window.__BUILD_MANIFEST` and the 840 UI strings in Typefully's production Next.js chunks alongside the OpenAPI 3.1.0 specification, we mapped every authenticated route, store, and UI state:

### 2.1 Core Authenticated Workspace Views
1. **Write View (`/write` / Workspace Composer)**:
   - **Left Sidebar (`Ctrl+/`)**:
     - Social Set switcher with multi-platform icons (`X`, `LinkedIn`, `Threads`, `Bluesky`, `Mastodon`, `Substack`) and Team switcher (`Create new team`, `Add social set`, publishing quota indicator).
     - Primary navigation tabs: **Write** (`Ctrl+Shift+1`), **Plan** (`Ctrl+Shift+2`), **Analyze** (`Ctrl+Shift+3`), **Tools**, **Settings** (`Ctrl+,`).
     - Publishing Streak pill (`Grow faster with streaks`, current streak count, weekly heatmap).
     - Drafts list with filter tabs: **Drafts** (`FILTER_DRAFTS`), **Queue** (`FILTER_QUEUE`), **Published** (`FILTER_PUBLISHED`), **Trash** (`Trash`), plus Pinned drafts (`Pin draft`), Tag filter (`Filter drafts by tag`), Platform filter, and full-text search (`Search drafts & posts...`).
   - **Center Composer Canvas**:
     - Draft title header (`draft_title`), Platform enable/disable bar (`X`, `LinkedIn`, `Threads`, `Bluesky`, `Mastodon`, `Substack`, `X Article` long-form editor), Cross-post sync mode vs per-platform custom text.
     - Multi-post Thread editor (`Add post below` `Ctrl+Enter`, `Move post up/down` `Alt+Up/Down`, **Auto-numbering** `1/n`, `1.`, etc., split long text into thread).
     - Per-post attachments & settings:
       - Media uploader (images, 1080p video, GIF, **LinkedIn PDF Carousel**, AI alt-text).
       - **Poll Builder** (2–4 options, duration selector `1 day`, `3 days`, `1 week`, `2 weeks`, cross-platform validation).
       - **Quote Post / Reply to Post / LinkedIn Reshare** URL attachment (`reply_to_url`, `quote_post_url`, `linkedin_reshare_target`).
       - **X Audience & Reply Settings**: X Community selector (`Everyone` vs specific Community + `Share with followers`), Reply filter (`Everyone`, `Accounts you follow`, `Mentioned users`, `Verified accounts`, `Subscribers`), `Subscribers only`, Content disclosures (`Paid partnership`, `Made with AI`).
       - **LinkedIn First Comment** (`first_comment` up to 1,250 chars) & Company Mention tagger.
       - **Threads Topic** tagger & **Hide Link Preview** toggle.
     - **Realistic 1:1 Preview Modal/Drawer** (`See a 1:1 preview of your post before publishing`, Light/Dark card mode, Share as Image).
   - **Right Sidebar (`Ctrl+\` / `Ctrl+J`)**:
     - **Draft Properties & Automations**:
       - **Tags** (`Create New Tag`, color-coded pills, `Manage Tags`).
       - **Scratchpad** (`scratchpad_text` internal notes).
       - **Auto-Plug** (trigger follow-up plug post when Likes or Reposts cross threshold).
       - **Auto-Repost / Schedule Retweets** (auto-repost after N hours/days).
       - **Auto-DMs & Giveaways** (trigger DM when users Reply/Like/Repost with keyword).
       - **Thread Finisher** (append final post quoting the thread hook).
       - **Auto Backups** (version snapshots with 1-click restore).
     - **Vesper AI Writing Assistant (`Ctrl+J` / `Ctrl+I`)**:
       - Interactive chat & selection rewrite with slash commands (`Make it punchier 👊`, `Convert to thread 🧵`, `Adapt for LinkedIn`, `Write 5 viral hooks`, `Fix grammar`, `Condense`, `Expand`, `Address open comments`).
       - Custom AI Command builder (`AiPromptsStore` — add, edit, enable/disable, and reset custom commands) & Voice Style rules.
     - **Inline Comments & Collaboration (`Ctrl+Shift+M`)**:
       - Comment threads anchored to selected text or specific platform post, status filter (`All`, `Unresolved`, `Resolved`), resolve/reopen, replies, and shareable review link (`/t/[token]`).

2. **Plan View (`/calendar` & `/queue`)**:
   - **Queue Timeline & Kanban View**:
     - Daily time slots generated from `QueueScheduleRuleSchema` (`h`, `m`, `days`, `timezone`).
     - Schedule in Next Free Slot (`Ctrl+Alt+Enter`), swap two scheduled drafts, unschedule, or drag drafts into slots.
     - Kanban Pipeline view (`Draft` → `Planned` → `Scheduled` → `Published`).
   - **Multi-Account Team Calendar (`CalendarV2`)**:
     - Weekly and Monthly calendar grid with Drafts Sidebar for drag-and-drop scheduling.
     - **Planned Drafts (`status: "planned"`)** vs **Scheduled Drafts (`status: "scheduled"`)**: Planned drafts sit on a date/time on the calendar in an inert state until confirmed (`Confirm schedule`).
     - Filters by Social Set, Team, Tag, Platform, and Status.

3. **Analyze View (`/grow`)**:
   - Interactive metrics across date ranges (`7d`, `30d`, `90d`, `1y`, `all`), platform filter, 5 KPI cards, Follower Growth & Impressions charts, Best Time to Post heatmap, Tweeting Streaks tracker, and Posts Performance Table with **1-Click Repurpose into Draft** and **CSV Export**.

---

## 3. Observed Edge & Error States Documented

1. **Empty Draft / Validation Guards**:
   - Attempting to publish or schedule an empty post shows `EMPTY_DRAFT_ERROR_MESSAGE` ("Cannot publish an empty draft").
   - Exceeding platform character limits (e.g., >280 on standard X, >300 on Bluesky, >500 on Threads/Mastodon, >3000 on LinkedIn) highlights overflow characters and warns before publishing.
2. **Poll Validation Edge Cases**:
   - Combining a Poll with Media triggers `Poll with media` conflict error ("A post with a poll can't include images or video").
   - Poll option length exceeding platform limits (25 chars on Threads, 30 chars on LinkedIn) or fewer than 2 non-empty options blocks publishing with explicit inline error.
3. **Scheduling & Queue Edge Cases**:
   - `No free timeline slot found` when all queue rules are disabled.
   - `Planned` vs `Scheduled` distinction: a `planned` draft whose date has passed is inert (not failed) until confirmed via `Confirm schedule`.
4. **Authentication & Invite-Only Edge Cases**:
   - Uninvited registration or OAuth login in `invitation-only` mode fails closed (`403 invitation_required` / `/signin?error=InvitationRequired`).
   - Expired, revoked, or already-accepted invitation links at `/invite/[token]` render explicit terminal status cards (`expired`, `revoked`, `accepted`, `invalid`).
   - Mismatched email during invitation acceptance returns `403 email_mismatch`.
