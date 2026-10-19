# Implementation Plan & Task Backlog

## 1. Phased Implementation Plan

### Phase 1: Discovery & Architecture Documentation (Completed)
- Explore `https://typefully.com` via Playwright across Desktop (`1440×900`), Tablet (`768×1024`), and Mobile (`390×844`).
- Extract OpenAPI 3.1.0 (`v2.0.0`) schema and 840 workspace UI strings.
- Produce Exploration Coverage Report, ADRs, PRD, Technical Specification, Architecture & Data Model, Implementation Plan, and Acceptance Criteria / Feature-Parity Matrix.

### Phase 2: Project Scaffolding, Dual Prisma Setup & Invite-Only Auth Core
- Configure `package.json` with Next.js 16, React 19, NextAuth 4, Prisma 7 (`@prisma/client`, `@prisma/adapter-better-sqlite3`, `@prisma/adapter-pg`, `better-sqlite3`, `pg`), Tailwind CSS, Lucide icons, and Playwright.
- Create `prisma/schema.prisma` (SQLite) and `prisma/schema.postgres.prisma` (PostgreSQL), `prisma.config.ts`, and initial SQL migration (`prisma/migrations/0001_init/migration.sql`).
- Implement `src/lib/account-admission/*` (`errors.ts`, `policy.ts`, `tokens.ts`, `passwords.ts`, `bootstrap.ts`, `invitations.ts`, `registration.ts`, `credentials.ts`, `session.ts`, `social.ts`, `audit.ts`, `index.ts`) and `scripts/bootstrap-admin.ts`.
- Create deterministic seed script (`prisma/seed.ts`) populating rich Social Sets (`@typefully`, `@framer`, `@marclou`), multi-platform Drafts (`draft`, `planned`, `scheduled`, `published`), Tags, Comment Threads, AI Prompt Commands, Queue Schedule Rules, Analytics time-series, Webhooks, API Keys, a seeded pending invitation (`demo-invite-token-2026`), and Audit Logs.

### Phase 3: Backend REST API v2, AI Engine & Admin APIs
- Implement Authentication & Admin Invitation endpoints (`/api/auth/[...nextauth]`, `/api/auth/invitation`, `/api/auth/register`, `/api/admin/invitations`, `/api/admin/invitations/[id]`, `/api/admin/invitations/[id]/rotate`, `/api/admin/audit-logs`, `/api/admin/users`).
- Implement Typefully Public API v2 & Workspace endpoints (`/api/v2/me`, `/api/v2/social-sets`, `/api/v2/social-sets/[id]`, `/api/v2/social-sets/[id]/drafts`, `/api/v2/social-sets/[id]/drafts/[draftId]`, `/api/v2/social-sets/[id]/drafts/[draftId]/comment-threads`, `/api/v2/social-sets/[id]/queue`, `/api/v2/social-sets/[id]/queue/schedule`, `/api/v2/social-sets/[id]/tags`, `/api/v2/social-sets/[id]/media/upload`, `/api/v2/social-sets/[id]/analytics`).
- Implement Vesper AI endpoint (`/api/ai/assist`, `/api/ai/prompts`) and Webhooks/API Keys endpoints (`/api/webhooks`, `/api/api-keys`).

### Phase 4: Frontend Workspace, Public Pages, Mini-Tools & Admin Portal
- **Workspace (`/write`, `/calendar`, `/queue`, `/grow`, `/settings`)**:
  - Unified Workspace Shell with Left Sidebar (Social Set switcher, Write/Plan/Analyze nav, Streak badge, Draft status tabs, Tag/Platform filters, Search), Center Canvas (Multi-post Thread Composer, 7-platform toggles, X Article mode, Character counters, Polls, Media/PDF Carousel, Quote/Reply URL, X Community/Reply settings, LinkedIn First Comment, Auto-numbering, Realistic 1:1 Preview modal, Command Bar `⌘K`, Keyboard Shortcuts modal `?`), and Right Sidebar (Tags, Scratchpad, Auto-Plug, Auto-Repost, Auto-DM & Giveaways, Thread Finisher, Auto Backups, Vesper AI Chat & Custom Commands, Inline Comments).
  - **Plan View (`/calendar` & `/queue`)**: Queue timeline slots, Kanban pipeline board, Queue Schedule Rules editor, and Weekly/Monthly Calendar with Planned vs Scheduled confirmation, drag/assign drafts sidebar, and slot swapping.
  - **Analyze View (`/grow`)**: 5 KPI cards, date-range selector, engagement & follower growth charts, Best Time to Post heatmap, Tweeting Streaks, Posts Performance table with 1-Click Repurpose to Draft and CSV download.
- **Public & Collaboration Pages**:
  - Landing page (`/`), Pricing (`/pricing`), AI showcase (`/ai`, `/ai-agents`), Changelog (`/changelog`), Keyboard Shortcuts (`/shortcuts`), API Docs (`/docs/api`).
  - Public Shared Draft & Review Page (`/t/[token]`), Creator Social Blog (`/[username]` e.g. `/typefully`, `/framer`), Public Creator Stats (`/stats/[slug]`).
  - Free Creator Mini-Tools (`/tools`, `/tools/twitter-character-counter`, `/tools/linkedin-text-formatter`, `/tools/fake-tweet-generator`, `/tools/ai/ai-writer`).
- **Authentication & Admin Console**:
  - `/signin`, `/register` (invite-only notice), `/invite/[token]` (token validation & registration), and `/admin/invitations` (Invitation creation with role & expiry, one-time link copy, rotation, revocation, user RBAC management, and Audit Log table).

### Phase 5: Comprehensive Verification & E2E Testing
- Run `npm run db:setup`, `npm run bootstrap:admin`, and `npm run build`.
- Execute comprehensive Playwright E2E test suite (`tests/verify-all-features.mjs`) verifying every page, workflow, feature combination, responsive viewport, edge/error state, and invite-only security invariant.

---

## 2. Prioritized Task Backlog

| ID | Epic | Task Title | Priority | Dependencies | Status |
|---|---|---|---|---|---|
| `TB-01` | Exploration | Playwright exploration of `typefully.com` + screenshot capture + OpenAPI v2 extraction | P0 | None | Done |
| `TB-02` | Documentation | Create ADR, PRD, Spec, Data Model, Backlog, and Parity Matrix in `docs/` | P0 | `TB-01` | In Progress |
| `TB-03` | Database | Dual Prisma 7 schemas (SQLite + Postgres), migrations, and rich seed data | P0 | `TB-02` | Pending |
| `TB-04` | Security / Auth | NextAuth + `src/lib/account-admission/*` + `scripts/bootstrap-admin.ts` + `AuditLog` | P0 | `TB-03` | Pending |
| `TB-05` | Backend API | Typefully v2 REST API (`/api/v2/*`), Vesper AI (`/api/ai/*`), Admin Invites (`/api/admin/*`) | P0 | `TB-04` | Pending |
| `TB-06` | Composer UI | Multi-platform Thread Composer (`/write`) + Polls + Automations + Vesper AI + Comments + Previews | P0 | `TB-05` | Pending |
| `TB-07` | Plan & Analyze UI | Queue Timeline + Kanban + Team Calendar (`/calendar`, `/queue`) + Analytics (`/grow`) | P0 | `TB-05` | Pending |
| `TB-08` | Public & Tools UI | Shared Draft (`/t/[token]`), Social Blog (`/[username]`), Stats (`/stats/[slug]`), Mini-Tools (`/tools/*`) | P1 | `TB-05` | Pending |
| `TB-09` | Admin UI | Admin Invitations, RBAC & Audit Log Console (`/admin/invitations`, `/invite/[token]`, `/signin`) | P0 | `TB-04` | Pending |
| `TB-10` | QA & E2E | Full Playwright E2E test suite (`tests/verify-all-features.mjs`) across all features & viewports | P0 | `TB-06..09` | Pending |
