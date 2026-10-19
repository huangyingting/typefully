# Product Requirements Document (PRD): Typefully Social Publishing & Creator Growth Platform

## 1. Executive Summary & Product Vision
Typefully is a distraction-free, AI-powered, collaborative social media writing, scheduling, cross-posting, and analytics platform built for creators, founders, and marketing teams across **𝕏 (Twitter)**, **LinkedIn**, **Threads**, **Bluesky**, **Mastodon**, and **Substack Notes**. In addition to Typefully's core product capabilities and public API v2, our application integrates an enterprise-grade **Invite-Only Account Admission, RBAC, and Audit Logging** system modeled on `../Arcade`.

---

## 2. Target Personas
1. **Solo Creator / Indie Hacker ("Creator")**: Writes daily threads and long-form posts, cross-posts to X, LinkedIn, Bluesky, and Threads, uses Vesper AI to sharpen hooks, configures Auto-Plugs and Auto-DMs to grow followers, and tracks streaks and engagement rates.
2. **Marketing Lead / Content Editor ("Editor")**: Collaborates across multiple brand and executive Social Sets, plans weekly campaigns on the unified Calendar using `planned` drafts, leaves inline text-anchored comments (`@mentions`), and confirms schedules once approved.
3. **Workspace Administrator ("Admin")**: Bootstrapped via deployment CLI (`npm run bootstrap:admin`), manages team invitations (`/admin/invitations`) with single-use expiring tokens, assigns roles (`Admin`, `Editor`, `Viewer`), rotates/revokes invites, configures API keys & webhooks, and audits security events.
4. **Client / Stakeholder Reviewer ("Viewer")**: Reviews shared drafts (`/t/[token]`) or workspace calendar in read-and-comment mode without publishing permissions.

---

## 3. Core Functional Requirements

### FR-1: Invite-Only Authentication, RBAC & Audit Logging
- **FR-1.1:** Default admission mode is `invitation-only`; uninvited sign-ups via `/api/auth/register`, Credentials, or OAuth are rejected (`403 invitation_required`).
- **FR-1.2:** Root Admin accounts are provisioned exclusively via CLI (`npm run bootstrap:admin -- --email <email> --password-stdin`); no HTTP bootstrap endpoint exists.
- **FR-1.3:** Admins can create single-use invitations with custom or 7-day default expiry and target role (`Admin`, `Editor`, `Viewer`), rotate pending invitation tokens, and revoke pending invitations at `/admin/invitations`.
- **FR-1.4:** Invited users inspect and claim their one-time token at `/invite/[token]`, setting their name and password (minimum 12 characters, scrypt hashed).
- **FR-1.5:** Every admission, invitation, authentication, and administrative state change writes an immutable `AuditLog` entry visible in the Admin Console.

### FR-2: Multi-Platform Composer & Thread Studio (`/write`)
- **FR-2.1:** Multi-post thread composer supporting adding posts (`Ctrl+Enter`), reordering posts (`Alt+Up/Down`), splitting long text into threads, merging posts, and customizable **Auto-Numbering** (`1/n`, `1.`, `[1/n]`).
- **FR-2.2:** Per-draft platform selection across **X**, **LinkedIn**, **Threads**, **Bluesky**, **Mastodon**, **Substack**, and **X Article** (long-form rich article mode), with per-platform character limits and circular progress rings.
- **FR-2.3:** Cross-posting with either synced content or per-platform custom overrides.
- **FR-2.4:** Rich attachments & platform controls:
  - Media attachments (images, 1080p video, GIF, **LinkedIn PDF Carousel**, AI Alt-text generation).
  - **Polls** (2–4 options, duration selector, conflict checks against media and option length limits).
  - **Quote Post**, **Reply to Post**, and **LinkedIn Reshare** URL linking.
  - **X Audience & Reply Settings** (Everyone vs X Community + Share with followers; Reply permissions: Everyone, Following, Mentioned, Verified, Subscribers; Subscribers-only toggle; Paid Partnership & Made with AI disclosures).
  - **LinkedIn First Comment** (`first_comment` up to 1,250 chars) and Organization Mentions.
  - **Threads Topic** tag and **Hide Link Preview** toggle.
- **FR-2.5:** **Realistic 1:1 Preview** modal/drawer with Light/Dark theme toggle, platform switcher, and Shareable Public Draft Link (`/t/[token]`).
- **FR-2.6:** Automatic version snapshots (**Auto Backups**) with 1-click restore.

### FR-3: Vesper AI Writing Assistant & Custom Commands
- **FR-3.1:** In-editor AI Assistant sidebar (`Ctrl+J`) and inline selection refinement (`Ctrl+I`).
- **FR-3.2:** Built-in commands: *Make it punchier 👊*, *Convert to thread 🧵*, *Adapt for LinkedIn*, *Write 5 viral hooks*, *Fix grammar & spelling*, *Condense*, *Expand with examples*, and *Address open comments*.
- **FR-3.3:** Custom AI Command manager (create, edit, toggle, delete, reset to defaults) and Voice Profile instructions.

### FR-4: Engagement Automations (Auto-Plug, Auto-Repost, Auto-DM, Thread Finisher)
- **FR-4.1:** **Auto-Plug**: Automatically publish a follow-up reply/plug when a post reaches a configured Likes or Reposts threshold.
- **FR-4.2:** **Auto-Repost**: Schedule automatic repost/retweet after N hours or days.
- **FR-4.3:** **Auto-DM & Giveaways**: Configure keyword-triggered automated DM campaigns when users Reply, Like, or Repost.
- **FR-4.4:** **Thread Finisher**: Append a closing post quoting the first post of the thread with a customizable CTA template.

### FR-5: Queue, Kanban Pipeline & Team Calendar (`/calendar` & `/queue`)
- **FR-5.1:** Configurable posting schedule rules (`HH:MM` + days of week + timezone) per Social Set.
- **FR-5.2:** **Queue Timeline** showing upcoming slots, "Schedule in Next Free Slot" (`Ctrl+Alt+Enter`), slot swapping, and unscheduling.
- **FR-5.3:** **Kanban Board** view organizing drafts across `Draft`, `Planned`, `Scheduled`, and `Published` columns.
- **FR-5.4:** **Team Calendar** supporting both **Planned Drafts** (inert dated drafts requiring confirmation) and **Scheduled Drafts**, multi-account filtering, quick slot creation, and 1-click "Confirm Schedule".

### FR-6: Collaboration, Inline Comments & Shared Review Links
- **FR-6.1:** Inline comment threads anchored to selected text or specific platform posts, with `@mentions`, replies, edit/delete, and `unresolved` / `resolved` state transitions.
- **FR-6.2:** Public/team shareable review page (`/t/[token]`) allowing stakeholders to preview multi-platform posts and leave comments.

### FR-7: Creator Analytics & Growth Insights (`/grow` & `/stats/[slug]`)
- **FR-7.1:** 5 Hero KPI cards (`Followers`, `Impressions`, `Published Posts`, `Profile Clicks`, `Engagements`) with period-over-period deltas (`7d`, `30d`, `90d`, `1y`, `all`).
- **FR-7.2:** Publishing Streaks tracker, Best Times to Post engagement heatmap, and Profile Conversion funnel.
- **FR-7.3:** Searchable, sortable Posts Performance table (`All`, `Posts`, `Threads`, `Replies`, `Articles`) with **1-Click Repurpose into Draft** and **CSV Export**.
- **FR-7.4:** Public Creator Social Blog (`/[username]`) and Public Verified Stats page (`/stats/[slug]`).

### FR-8: Free Creator Mini-Tools (`/tools/*`) & Public API v2 (`/api/v2/*`)
- **FR-8.1:** Interactive **Twitter/X Character & Bio Counter** (`/tools/twitter-character-counter`), **LinkedIn Text Formatter** (`/tools/linkedin-text-formatter`), **Realistic Tweet Generator** (`/tools/fake-tweet-generator`), and **Free AI Writer** (`/tools/ai/ai-writer`).
- **FR-8.2:** Full Typefully OpenAPI v2 endpoints (`/api/v2/me`, `/api/v2/social-sets`, `/api/v2/social-sets/[id]/drafts`, `/api/v2/social-sets/[id]/queue`, `/api/v2/social-sets/[id]/tags`, `/api/v2/social-sets/[id]/media/upload`, `/api/v2/social-sets/[id]/drafts/[draftId]/comment-threads`) + API Key & Webhook management.
