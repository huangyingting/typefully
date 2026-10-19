# Architecture Decision Records (ADRs)

## ADR-001: Next.js 16 App Router with Full-Stack Route Handlers
- **Status:** Accepted
- **Context:** Typefully combines a high-interactivity multi-pane writing workspace (`/write`, `/calendar`, `/grow`), public creator blogs (`/[username]`, `/stats/[slug]`), public shareable draft previews (`/t/[token]`), free interactive mini-tools (`/tools/*`), and a public REST API (`/api/v2/*`).
- **Decision:** Build the application on the latest stable **Next.js 16 App Router** with React 19, TypeScript, and Tailwind CSS, serving both interactive client workspaces and REST API v2 endpoints from a unified codebase.
- **Consequences:** Zero CORS friction between the workspace UI and API routes, server-rendered SEO-friendly public profiles/previews, and single-artifact deployment.

---

## ADR-002: Dual-Database Prisma 7 Architecture (SQLite Local Dev + PostgreSQL Production)
- **Status:** Accepted
- **Context:** Local development and automated E2E tests require instant, zero-daemon startup via SQLite (`file:./dev.db`), while production deployments require horizontal scalability and transactional concurrency on PostgreSQL.
- **Decision:** Maintain synchronized Prisma schemas (`prisma/schema.prisma` for SQLite and `prisma/schema.postgres.prisma` for PostgreSQL) with `@prisma/adapter-better-sqlite3` and `@prisma/adapter-pg` runtime detection in `src/lib/prisma.ts`, plus `prisma.config.ts` and SQL migrations. String union fields (`status`, `role`) and JSON columns (`platformsJson`, `pollJson`, `metricsJson`) ensure 100% behavioral parity across SQLite and PostgreSQL.
- **Consequences:** Developers and CI run `npm run db:setup` locally against SQLite while production runs `npm run db:migrate:postgres` against PostgreSQL without code changes.

---

## ADR-003: NextAuth + Fail-Closed Invite-Only Account Admission & CLI-Only Admin Bootstrap
- **Status:** Accepted
- **Context:** The application must enforce invite-only registration with single-use/expiring invitation codes, roles (`Admin`, `Editor`, `Viewer`), revocation, token rotation, and audit logging, using `../Arcade` as the canonical reference. Furthermore, exposing an HTTP bootstrap admin endpoint creates a privilege-escalation risk.
- **Decision:**
  1. Default `ACCOUNT_ADMISSION_MODE` to `"invitation-only"` (fail-closed).
  2. Never store raw invitation tokens; generate 32-byte `base64url` tokens and persist only `tokenHash = sha256(token)` and `activeForEmail @unique` on `AccountInvitation`.
  3. Zero HTTP bootstrap surface: provision or promote the root `Admin` account exclusively via the deployment CLI script (`npm run bootstrap:admin -- --email <email> --password-stdin`).
  4. Enforce role-based access control (`Admin`, `Editor`, `Viewer`) on workspace actions and require `Admin` role for `/api/admin/invitations` and `/admin/invitations`.
  5. Record every security and lifecycle event in the `AuditLog` table.
- **Consequences:** Eliminates public bootstrap attack surface, prevents double-claiming of invitations via atomic conditional updates, and provides a complete audit trail.

---

## ADR-004: Multi-Platform Draft & Thread Document Model
- **Status:** Accepted
- **Context:** Typefully allows a single draft to target up to 7 platform channels simultaneously (**X/Twitter**, **LinkedIn**, **Threads**, **Bluesky**, **Mastodon**, **Substack Notes**, and **X Article**), either syncing thread posts across platforms or customizing posts per platform.
- **Decision:** Model each `Draft` with both a canonical `postsJson` thread array (for cross-platform synced editing) and a structured `platformsJson` map matching Typefully OpenAPI v2 (`x`, `linkedin`, `threads`, `bluesky`, `mastodon`, `substack`, `x_article`), alongside per-platform settings (`XSettings`, `LinkedInSettings`, etc.), `pollJson`, `autoPlugJson`, `autoRepostJson`, `autoDmJson`, and `threadFinisherJson`.
- **Consequences:** Supports instant cross-posting, platform-specific overrides, character-limit validation per platform, and 1:1 compatibility with `/api/v2/social-sets/[id]/drafts`.

---

## ADR-005: Smart Queue Engine & Inert "Planned" vs "Scheduled" State Machine
- **Status:** Accepted
- **Context:** Typefully distinguishes between `draft` (undated), `planned` (dated on the calendar/queue so teams can sketch a week of launches, but **inert**—will not auto-publish until confirmed), `scheduled` (confirmed and queued to publish at `scheduledDate`), and `published`.
- **Decision:** Implement the 6-state draft lifecycle (`draft` | `planned` | `scheduled` | `publishing` | `published` | `error`) and a configurable `QueueScheduleRule` engine (`h`, `m`, `days`, `timezone`) that computes upcoming slots, supports "Schedule in Next Free Slot", slot swapping, Kanban pipeline transitions, and 1-click "Confirm Schedule" (`planned` → `scheduled`).
- **Consequences:** Matches Typefully's team calendar and queue workflow while preventing accidental publication of unconfirmed planned drafts.

---

## ADR-006: Vesper AI Writing Assistant & Custom Command Store
- **Status:** Accepted
- **Context:** Typefully's Vesper AI Assistant lives inside the composer (`Ctrl+J` / `Ctrl+I`) and supports both built-in editorial transformations (Make it punchier, Convert to thread, Adapt for LinkedIn, Viral hooks, Fix grammar, Address open comments) and user-defined custom AI commands + voice style rules.
- **Decision:** Implement a deterministic + heuristic AI transformation engine (`/api/ai/assist` and `/api/ai/prompts`) backed by persistent `AiPromptCommand` and `VoiceProfile` records per Social Set, so every AI rewrite, thread split, hook generator, comment resolver, and custom slash command produces immediate, high-quality, context-aware output without requiring external paid LLM keys in local/test environments.
- **Consequences:** 100% deterministic reliability in E2E tests and offline/local environments while faithfully modeling Typefully's Vesper AI UX.
