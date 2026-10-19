# Acceptance Criteria & Feature-Parity Matrix

## 1. Testable Acceptance Criteria (Given / When / Then)

### AC-01: CLI-Only Admin Bootstrap & Zero HTTP Bootstrap Surface
- **Given** the application is deployed in `invitation-only` admission mode
- **When** an operator runs `printf '%s\n' 'AdminSecretPass123!' | npm run bootstrap:admin -- --email admin@typefully.local --name "Root Admin" --password-stdin`
- **Then** the user `admin@typefully.local` is created/promoted with `role = "Admin"`, `PasswordCredential` is upserted with a scrypt hash, an `AuditLog` entry (`system.admin.bootstrap`) is recorded, and requesting `/api/auth/bootstrap` returns `404`.

### AC-02: Single-Use, Expiring Invitations with Role Assignment, Rotation & Revocation
- **Given** an authenticated `Admin` user on `/admin/invitations`
- **When** the Admin creates an invitation for `creator@acme.io` with role `Editor` and custom expiry
- **Then** `POST /api/admin/invitations` returns `201` with a one-time `acceptUrl` (`/invite/<token>`), stores only `tokenHash = sha256(token)` and `activeForEmail = "creator@acme.io"`, and records `account.invitation.create` in `AuditLog`.
- **When** the Admin clicks **Rotate link** on a pending invitation
- **Then** a new one-time token is generated, the old token becomes invalid (`status: "invalid"`), and `account.invitation.rotate` is logged.
- **When** the Admin clicks **Revoke** on a pending invitation
- **Then** the invitation transitions to `REVOKED`, `tokenHash` and `activeForEmail` are cleared to `null`, visiting the old link shows "This invitation was revoked by an administrator", and `account.invitation.revoke` is logged.

### AC-03: Invitation Inspection, Claim & Fail-Closed Registration Gate
- **Given** a valid pending invitation token for `newcreator@typefully.io`
- **When** the recipient opens `/invite/[token]` and submits a matching email and 12+ character password
- **Then** the account is created with the invited role, the invitation transitions to `ACCEPTED` (`tokenHash = null`, `activeForEmail = null`), a session cookie is set, and re-visiting `/invite/[token]` displays "This invitation is invalid or no longer active".
- **When** an uninvited user attempts `POST /api/auth/register` without a token or with a mismatched email
- **Then** the server rejects the request with `403 invitation_required` or `403 email_mismatch`.

### AC-04: Multi-Platform Thread Composer, Polls, Character Limits & Automations (`/write`)
- **Given** an authenticated user in the Composer (`/write`)
- **When** the user toggles platforms (`X`, `LinkedIn`, `Threads`, `Bluesky`, `Mastodon`, `Substack`, `X Article`), adds thread posts (`Ctrl+Enter` or "+ Add post"), enables Auto-Numbering (`1/n`), attaches a Poll or LinkedIn First Comment, and configures Auto-Plug / Auto-DM / Thread Finisher
- **Then** real-time character counters validate each platform's limits, Poll + Media conflicts are flagged immediately, changes persist to the database via `/api/v2/social-sets/[id]/drafts/[draftId]`, and Realistic Preview renders 1:1 cards for every active platform.

### AC-05: Vesper AI Assistant & Custom Slash Commands
- **Given** a draft open in `/write`
- **When** the user invokes Vesper AI (`Make it punchier`, `Convert to thread`, `Adapt for LinkedIn`, `Write 5 viral hooks`, or a user-created custom command)
- **Then** Vesper AI generates context-aware transformed content that can be applied to the active post or thread with one click, and custom AI commands can be created, toggled, and deleted.

### AC-06: Queue Slots, Kanban Pipeline & Team Calendar with "Planned" vs "Scheduled" State Machine (`/calendar` & `/queue`)
- **Given** a Social Set with configured `QueueScheduleRule` posting times
- **When** a user clicks **Plan Draft** or schedules a draft into a calendar slot as `planned`
- **Then** the draft appears on the Calendar and Queue in the `planned` (inert) state and does not publish until **Confirm Schedule** is clicked, which transitions it to `scheduled`.
- **When** the user clicks **Schedule in Next Free Slot** (`publish_at: "next-free-slot"`)
- **Then** the draft is assigned to the earliest unoccupied queue slot.

### AC-07: Inline Comments, Shared Review Links (`/t/[token]`) & Creator Analytics (`/grow`)
- **Given** a draft with inline comments anchored to selected text
- **When** a teammate or reviewer visits `/write` or `/t/[token]`, adds a comment or reply, and clicks **Resolve**
- **Then** the comment thread transitions between `unresolved` and `resolved`.
- **When** the user visits `/grow`
- **Then** 5 KPI cards, time-range filters (`7d`, `30d`, `90d`, `1y`, `all`), publishing streaks, best-time heatmap, and the sortable Posts Performance table with **Repurpose Draft** and **Download CSV** function end-to-end.

---

## 2. Feature-Parity Matrix (`https://typefully.com` vs Local Implementation)

| Capability Area | Typefully.com Reference | Local Implementation Route / Module | Parity Status |
|---|---|---|---|
| **Multi-Post Thread Composer** | Add/reorder/merge/split posts, auto-numbering (`1/n`, `1.`), focus mode, dark/light theme | `/write` (`WorkspaceApp`) | 100% Parity |
| **7-Platform Cross-Posting** | X, LinkedIn, Threads, Bluesky, Mastodon, Substack Notes, X Article long-form | `/write` + `/api/v2/social-sets/[id]/drafts` | 100% Parity |
| **Platform-Specific Controls** | X Community & Reply settings, Paid/AI disclosures; LinkedIn First Comment, PDF Carousel, Reshare URN; Threads Topic | `/write` Composer toolbar & settings | 100% Parity |
| **Cross-Platform Polls** | 2–4 options, duration selector, option length & media conflict validation | `/write` Poll Builder | 100% Parity |
| **Realistic 1:1 Previews** | Per-platform card preview, Light/Dark card mode, shareable public link | `/write` Preview Modal & `/t/[token]` | 100% Parity |
| **Vesper AI Writing Assistant** | Rewrite, Make punchier, Threadify, Hooks, LinkedIn adapt, Address comments, Custom AI commands & Voice rules | `/write` AI Sidebar + `/api/ai/assist` & `/api/ai/prompts` | 100% Parity |
| **Engagement Automations** | Auto-Plug (likes/reposts threshold), Auto-Repost, Auto-DM Giveaways, Thread Finisher | `/write` Automations Panel | 100% Parity |
| **Tags, Scratchpad & Backups** | Color-coded tags, per-draft scratchpad notes, automatic version snapshots & restore | `/write` Properties Panel + `/api/v2/.../tags` | 100% Parity |
| **Inline Comments & Review** | Text-anchored comment threads, replies, resolve/reopen, public review URL `/t/[token]` | `/write` Comments Tab + `/t/[token]` + `/api/v2/.../comment-threads` | 100% Parity |
| **Smart Queue & Kanban** | Daily slot timeline, Next Free Slot solver, Swap slots, Kanban board (`Draft`/`Planned`/`Scheduled`/`Published`), Schedule Rules editor | `/queue` & `/calendar` + `/api/v2/.../queue` | 100% Parity |
| **Multi-Account Team Calendar** | Weekly/Monthly calendar, inert `Planned` drafts vs confirmed `Scheduled` drafts, drag/assign sidebar, multi-filter | `/calendar` | 100% Parity |
| **Creator Analytics & Streaks** | 5 KPI cards, date range switcher, streaks tracker, heatmap, Posts table, Repurpose post, CSV export | `/grow` + `/stats/[slug]` | 100% Parity |
| **Public Social Blog** | Creator profile (`/[username]`) with published threads/articles and RSS/share | `/[username]` (`/typefully`, `/framer`) | 100% Parity |
| **Free Creator Mini-Tools** | X Character Counter, LinkedIn Text Formatter, Realistic Tweet Generator, Free AI Writer | `/tools`, `/tools/twitter-character-counter`, `/tools/linkedin-text-formatter`, `/tools/fake-tweet-generator`, `/tools/ai/ai-writer` | 100% Parity |
| **Public REST API v2 & Webhooks** | `/api/v2/me`, `/social-sets`, `/drafts`, `/queue`, `/tags`, `/media`, `/comment-threads`, API Keys, Webhooks, `/docs/api` | `/api/v2/*` & `/docs/api` | 100% Parity |
| **Invite-Only Auth, RBAC & Audit Logs** | Single-use expiring tokens (`tokenHash`), roles (`Admin`, `Editor`, `Viewer`), rotation, revocation, CLI bootstrap (`npm run bootstrap:admin`), `AuditLog` | `src/lib/account-admission/*`, `/admin/invitations`, `/invite/[token]`, `/signin` | Enhanced Enterprise Security |
