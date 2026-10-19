# Technical & Functional Specification

## 1. Platform Character Limits, Media & Poll Constraints

| Platform Key | Display Name | Max Post Characters | Max Thread Posts | Poll Support | Poll Constraints | Special Platform Settings |
|---|---|---|---|---|---|---|
| `x` | 𝕏 (Twitter) | `280` (Standard) / `25,000` (Long Post) | `25` | Yes | 2–4 options, max 25 chars/option, duration 5m–7d | `reply_to_url`, `quote_post_url`, `community_id`, `share_with_followers`, `reply_settings` (`everyone`, `following`, `mentionedUsers`, `verified`, `subscribers`), `subscribers_only`, `paid_partnership`, `made_with_ai` |
| `linkedin` | LinkedIn | `3,000` | `1` (Single post + First Comment) | Yes | Question ≤140 chars, 2–4 options ≤30 chars, duration `1d`, `3d`, `1w`, `2w` | `first_comment` (≤1,250 chars), `linkedin_reshare_target` (URN/URL), PDF Carousel attachment, Company Mentions `@[Name](urn:li:organization:id)` |
| `threads` | Threads | `500` | `20` | Yes | 2–4 options ≤25 chars, duration `24h` | `quote_post_url`, `topic_tag` (`Topics on Threads`), `hide_link_preview` |
| `bluesky` | Bluesky | `300` | `20` | No | Flagged if enabled (`Polls not supported on Bluesky`) | `quote_post_url` (`bsky.app/profile/...`), `hide_link_preview` |
| `mastodon` | Mastodon | `500` | `20` | Yes | 2–4 options ≤50 chars, multiple-choice option | `quote_post_url`, `instance_domain`, `visibility` (`public`, `unlisted`, `followers`) |
| `substack` | Substack Notes | `5,000` | `10` | No | Flagged if enabled | `quote_post_url` (`/note/c-...` or `/p/...`), `hide_link_preview` |
| `x_article` | 𝕏 Article | `50,000` | `1` (Long-form document) | No | N/A | `article_title`, `cover_image_url`, rich headings/blocks |

**Cross-Platform Validation Rules:**
1. **Poll + Media Mutual Exclusion:** A post containing an active Poll cannot also contain uploaded images, video, or PDF carousels (`Poll with media` validation error).
2. **Option Count & Length Validation:** Polls require between 2 and 4 non-empty options, and each option is validated against the strictest enabled platform's option length limit.
3. **Empty Post Guard:** Saving is allowed at any time, but transitioning a draft to `scheduled`, `planned`, or `published` requires non-empty text or media on at least one enabled platform.

---

## 2. Draft Lifecycle & Scheduling State Machine

```text
           +--- [Plan at slot/date] ---> PLANNED (inert on calendar/queue)
           |                                |
           |                        [Confirm schedule]
           |                                v
DRAFT -----+--- [Schedule at slot] ----> SCHEDULED (auto-publishes at scheduledDate)
  ^        |                                |
  |        +--- [Publish now] ---------> PUBLISHING ---> PUBLISHED
  |                                         |
  +------------ [Unschedule / Clone] -------+----------> ERROR (retryable)
```

- **Schedule in Next Free Slot (`publish_at: "next-free-slot"` / `plan_at: "next-free-slot"`):**
  - Evaluates the Social Set's `QueueScheduleRule` list (`h`, `m`, `days`) across the next 14 days starting from `now`.
  - Finds the earliest slot timestamp that does not already have a `scheduled` or `planned` draft assigned to it.
- **Swap Slots (`POST /api/v2/social-sets/[id]/queue/swap`):**
  - Atomically exchanges `scheduledDate` between two scheduled/planned drafts.

---

## 3. Keyboard Shortcuts & Command Bar Specification (`⌘K` / `Ctrl+K`)

| Shortcut | Action | Scope |
|---|---|---|
| `Ctrl+K` / `⌘K` | Open Command Bar (fuzzy search across all commands, drafts, navigation, AI actions, and theme toggles) | Global |
| `?` | Open Keyboard Shortcuts Modal | Global |
| `Ctrl+/` | Toggle Left Sidebar (Social Sets & Drafts list) | Workspace |
| `Ctrl+\` | Toggle Right Sidebar (Properties, Automations, Vesper AI, Comments) | Workspace |
| `Ctrl+Shift+1` | Navigate to **Write** (Composer) | Workspace |
| `Ctrl+Shift+2` | Navigate to **Plan** (Queue & Calendar) | Workspace |
| `Ctrl+Shift+3` | Navigate to **Analyze** (Grow Analytics) | Workspace |
| `Ctrl+.` / `Ctrl+N` | Create New Draft | Workspace |
| `Ctrl+Enter` | Add Post Below in Thread | Composer |
| `Alt+Up` / `Alt+Down` | Move Thread Post Up / Down | Composer |
| `Ctrl+Shift+P` | Pin / Unpin Current Draft | Workspace |
| `Ctrl+Alt+S` | Open Share & Collaborate Modal | Workspace |
| `Ctrl+Shift+Enter` | Publish Draft Immediately | Composer |
| `Ctrl+Alt+Enter` | Schedule Draft in Next Free Queue Slot | Composer |
| `Ctrl+Shift+F` | Toggle Distraction-Free Focus Mode | Composer |
| `Ctrl+Shift+H` | Cycle Display Theme (Light / Dark) | Global |
| `Ctrl+Shift+M` | Add Inline Comment Thread on Current Post | Composer |
| `Ctrl+J` | Toggle Vesper AI Writing Assistant | Composer |
| `Ctrl+I` | Refine Current Post with Vesper AI | Composer |

---

## 4. Invite-Only Account Admission & RBAC Specification

### 4.1 Security Invariants (Aligned with `../Arcade` & `NEXTAUTH_INVITE_ONLY_SPEC.md`)
1. **Admission Policy (`ACCOUNT_ADMISSION_MODE`):** Defaults to `"invitation-only"`. Uninvited registration requests to `POST /api/auth/register` return `403 { code: "invitation_required" }`.
2. **Opaque Token Hashing:** `createOpaqueToken()` generates 32 cryptographically random bytes (`base64url`). Only `tokenHash = sha256(token)` is stored in `AccountInvitation.tokenHash`. Terminal states (`ACCEPTED`, `REVOKED`, `EXPIRED`) clear `tokenHash = null` and `activeForEmail = null`.
3. **Single Active Invite Constraint:** `activeForEmail @unique` ensures at most one `PENDING` invitation per normalized email address while retaining historical records.
4. **CLI-Only Admin Bootstrap:** `npm run bootstrap:admin -- --email <email> --password-stdin` creates or promotes an `Admin` user inside a transaction and logs `system.admin.bootstrap` in `AuditLog`. No HTTP bootstrap endpoint exists.
5. **Role Hierarchy (`Admin` | `Editor` | `Viewer`):**
   - `Admin`: Full access to `/admin/invitations`, user role updates, invitation creation/rotation/revocation, audit logs, workspace settings, API keys, webhooks, and publishing.
   - `Editor`: Can create, edit, schedule, plan, and publish drafts, manage tags/automations, and comment. Cannot issue account-level invitations unless promoted to `Admin`.
   - `Viewer`: Read-and-comment access to drafts, calendar, and analytics; publishing and destructive mutations are blocked (`403 insufficient_role`).

---

## 5. REST API Specification

### 5.1 Authentication & Admin Invitation Endpoints
- `GET /api/admin/invitations` — List all invitations & recent audit logs (`Admin` required)
- `POST /api/admin/invitations` — Create single-use invitation with `email`, `role` (`Admin` | `Editor` | `Viewer`), and optional `expiresAt` (`Admin` required)
- `POST /api/admin/invitations/[id]/rotate` — Rotate token hash & extend expiry (`Admin` required)
- `DELETE /api/admin/invitations/[id]` — Revoke pending invitation (`Admin` required)
- `GET /api/admin/audit-logs` — Query security & workspace audit trail (`Admin` required)
- `PATCH /api/admin/users/[id]` — Update user role or status (`Admin` required)
- `POST /api/auth/invitation` & `GET /api/auth/invitation?token=...` — Inspect invitation token validity (`pending`, `accepted`, `revoked`, `expired`, `invalid`)
- `POST /api/auth/register` — Claim invitation token and create `User` + `PasswordCredential` + `Session`

### 5.2 Typefully Public API v2 & Workspace Endpoints
- `GET /api/v2/me` — Get current authenticated user & workspace metadata
- `GET /api/v2/social-sets` & `POST /api/v2/social-sets` — List and create Social Sets
- `GET /api/v2/social-sets/[socialSetId]` & `PATCH /api/v2/social-sets/[socialSetId]` — Get/update Social Set details, connected platforms, voice profile, and streak settings
- `GET /api/v2/social-sets/[socialSetId]/drafts` & `POST /api/v2/social-sets/[socialSetId]/drafts` — List (with `status`, `tag`, `platform`, `search`, `order_by` filters) and create drafts (`publish_at: "now" | "next-free-slot" | ISO`, `plan_at: "next-free-slot" | ISO`)
- `GET /api/v2/social-sets/[socialSetId]/drafts/[draftId]`, `PATCH`, `DELETE` — Retrieve, update, publish, confirm schedule, restore backup, or delete draft
- `GET /api/v2/social-sets/[socialSetId]/drafts/[draftId]/comment-threads` & `POST` — List and create inline comment threads
- `POST /api/v2/social-sets/[socialSetId]/drafts/[draftId]/comment-threads/[threadId]/comments` — Add reply comment
- `POST /api/v2/social-sets/[socialSetId]/drafts/[draftId]/comment-threads/[threadId]/resolve` — Resolve/unresolve comment thread
- `GET /api/v2/social-sets/[socialSetId]/queue` & `GET/PUT /api/v2/social-sets/[socialSetId]/queue/schedule` — Retrieve queue slots and update posting schedule rules
- `GET /api/v2/social-sets/[socialSetId]/tags` & `POST /api/v2/social-sets/[socialSetId]/tags` — List and create tags
- `POST /api/v2/social-sets/[socialSetId]/media/upload` & `GET/PATCH /api/v2/social-sets/[socialSetId]/media/[mediaId]` — Upload and manage media + alt text
- `GET /api/v2/social-sets/[socialSetId]/analytics` — Retrieve KPI metrics, time-series growth, heatmap, and post analytics
- `POST /api/ai/assist` & `GET/POST/PATCH/DELETE /api/ai/prompts` — Vesper AI writing assistant transformations and custom command CRUD
- `GET/POST/DELETE /api/webhooks` & `GET/POST/DELETE /api/api-keys` — Manage outgoing webhooks (`draft.created`, `draft.scheduled`, `draft.planned`, `draft.published`, `draft.deleted`) and API keys
