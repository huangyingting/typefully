# System Architecture & Data Model Specification

## 1. High-Level System Architecture

```text
+-----------------------------------------------------------------------------------+
|                        Client Tier (Next.js 16 + React 19)                        |
|                                                                                   |
|  +-----------------------+  +-----------------------+  +-----------------------+  |
|  |   Workspace Shell     |  |  Public Pages & Tools |  |  Auth & Admin Portal  |  |
|  | - /write (Composer)   |  | - / (Landing & Demo)  |  | - /signin, /register  |  |
|  | - /calendar (Plan)    |  | - /[username] (Blog)  |  | - /invite/[token]     |  |
|  | - /queue (Pipeline)   |  | - /stats/[slug]       |  | - /admin/invitations  |  |
|  | - /grow (Analytics)   |  | - /t/[token] (Review) |  |   (RBAC + Audit Logs) |  |
|  | - /settings (Teams,   |  | - /tools/* (Counter,  |  |                       |  |
|  |   Automations, API)   |  |   Formatter, TweetGen)|  |                       |  |
|  +-----------+-----------+  +-----------+-----------+  +-----------+-----------+  |
+--------------|--------------------------|--------------------------|--------------+
               |                          |                          |
               v                          v                          v
+-----------------------------------------------------------------------------------+
|                     Application & Domain Layer (Next.js Server)                   |
|                                                                                   |
|  +---------------------------+  +-----------------------+  +-------------------+  |
|  | Account Admission & RBAC  |  | Publishing & Queue    |  | Vesper AI &       |  |
|  | (src/lib/account-admission|  | Engine                |  | Engagement Engine |  |
|  | - tokens, scrypt passwords|  | - Cross-platform sync |  | - Built-in &      |  |
|  | - invitations & rotation  |  | - Poll & char checks  |  |   custom prompts  |  |
|  | - CLI bootstrapAdmin()    |  | - Smart slot solver   |  | - Auto-Plug/DM/RT |  |
|  | - AuditLog writer         |  | - Webhook dispatcher  |  | - Thread Finisher |  |
|  +-------------+-------------+  +-----------+-----------+  +---------+---------+  |
+----------------|----------------------------|------------------------|------------+
                 |                            |                        |
                 v                            v                        v
+-----------------------------------------------------------------------------------+
|               Persistence Layer (Prisma 7 Dual-Adapter Architecture)              |
|     Local Dev / CI: @prisma/adapter-better-sqlite3 (prisma/schema.prisma)         |
|     Production:     @prisma/adapter-pg             (prisma/schema.postgres.prisma)|
+-----------------------------------------------------------------------------------+
```

---

## 2. Canonical Prisma Data Model (Dual SQLite + PostgreSQL)

### 2.1 Authentication, Invite-Only Admission & Audit Logging Models
- **`User`**:
  - `id` (`String @id @default(cuid())`)
  - `email` (`String @unique`)
  - `emailVerified` (`DateTime?`)
  - `name` (`String`)
  - `image` (`String?`)
  - `role` (`String @default("Editor")`) — `"Admin" | "Editor" | "Viewer"`
  - `status` (`String @default("active")`) — `"active" | "disabled"`
  - `passwordHash` (`String?`)
  - `createdAt`, `updatedAt`
- **`Account`**, **`Session`**, **`VerificationToken`**: NextAuth standard adapter models.
- **`PasswordCredential`**:
  - `id`, `userId @unique`, `passwordHash` (scrypt `$N$r$p$salt$hash`), `passwordChangedAt`, `resetTokenHash @unique`, `resetExpiresAt`.
- **`PendingRegistration`**:
  - `id`, `email`, `normalizedEmail @unique`, `name`, `passwordHash`, `tokenHash @unique`, `expiresAt`.
- **`AccountInvitation`**:
  - `id` (`String @id @default(cuid())`)
  - `email` (`String`)
  - `normalizedEmail` (`String`)
  - `activeForEmail` (`String? @unique`) — Non-null only while `status == "PENDING"`
  - `tokenHash` (`String? @unique`) — SHA-256 `base64url` digest of raw token
  - `role` (`String @default("Editor")`) — `"Admin" | "Editor" | "Viewer"`
  - `status` (`String @default("PENDING")`) — `"PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED"`
  - `invitedById`, `acceptedById`, `expiresAt`, `acceptedAt`, `revokedAt`, `createdAt`, `updatedAt`
- **`AccountEmailOutbox`**:
  - `id`, `invitationId`, `payload`, `status`, `sentAt`, `expiresAt`, `createdAt`.
- **`AuditLog`**:
  - `id` (`String @id @default(cuid())`)
  - `actorId` (`String?`), `actorEmail` (`String?`), `actorRole` (`String?`)
  - `action` (`String`) — e.g. `"system.admin.bootstrap"`, `"account.invitation.create"`, `"account.invitation.rotate"`, `"account.invitation.revoke"`, `"account.invitation.accept"`, `"auth.signin.success"`, `"user.role.update"`, `"draft.published"`
  - `targetType` (`String?`), `targetId` (`String?`), `metadataJson` (`String @default("{}")`)
  - `ipAddress` (`String?`), `createdAt` (`DateTime @default(now())`)

### 2.2 Social Sets, Teams, Drafts, Queue, Comments, AI & Analytics Models
- **`Team`**:
  - `id`, `name`, `slug @unique`, `color`, `planTier` (`"FREE" | "CREATOR" | "BUSINESS"`), `createdAt`, `updatedAt`.
- **`TeamMember`**:
  - `id`, `teamId`, `userId`, `role` (`"Admin" | "Editor" | "Viewer"`).
- **`SocialSet`**:
  - `id` (`Int @id @default(autoincrement())` or `String` mapped cleanly with integer `publicId` for `/v2/social-sets/{id}` compatibility)
  - `username` (`String @unique`), `name` (`String`), `bio` (`String`), `profileImageUrl` (`String?`)
  - `teamId` (`String?`), `ownerId` (`String?`)
  - `timezone` (`String @default("America/New_York")`)
  - `platformsJson` (`String`) — Connected account details for `x`, `linkedin`, `threads`, `bluesky`, `mastodon`, `substack`, `x_article`
  - `queueRulesJson` (`String`) — Array of `{ h: number, m: number, days: string[] }`
  - `voiceProfileJson` (`String`) — Vesper AI tone, persona, and platform rules
  - `streakDays` (`Int @default(14)`), `bestStreakDays` (`Int @default(32)`), `streakGoalPerWeek` (`Int @default(5)`)
  - `autoPlugDefaultsJson` (`String`), `threadFinisherDefaultsJson` (`String`)
- **`Draft`**:
  - `id` (`Int @id @default(autoincrement())`)
  - `socialSetId` (`Int`)
  - `createdById` (`String?`)
  - `draftTitle` (`String?`)
  - `status` (`String @default("draft")`) — `"draft" | "planned" | "scheduled" | "publishing" | "published" | "error"`
  - `publishState` (`String?`) — `null | "in_progress" | "finished"`
  - `isPinned` (`Boolean @default(false)`)
  - `shareToken` (`String @unique @default(cuid())`)
  - `isPubliclyShared` (`Boolean @default(true)`)
  - `previewText` (`String`)
  - `scratchpadText` (`String @default("")`)
  - `tagsJson` (`String @default("[]")`) — Array of tag slugs
  - `postsJson` (`String`) — Canonical thread posts array `[{ id, text, mediaIds, quotePostUrl, hideLinkPreview, poll, ... }]`
  - `platformsJson` (`String`) — OpenAPI v2 `PlatformsResponse` structure (`x`, `linkedin`, `threads`, `bluesky`, `mastodon`, `substack`, `x_article`)
  - `pollJson` (`String?`) — `{ question, options: string[], durationMinutes: number }`
  - `xSettingsJson` (`String @default("{}")`) — `{ reply_to_url, community_id, share_with_followers, reply_settings, subscribers_only, paid_partnership, made_with_ai }`
  - `linkedinSettingsJson` (`String @default("{}")`) — `{ first_comment, linkedin_reshare_target, pdf_carousel_title }`
  - `threadsSettingsJson` (`String @default("{}")`) — `{ topic_tag, quote_post_url }`
  - `autoPlugJson` (`String @default("{}")`) — `{ enabled, triggerMetric: "likes" | "reposts", threshold: number, plugText: string }`
  - `autoRepostJson` (`String @default("{}")`) — `{ enabled, delayHours: number }`
  - `autoDmJson` (`String @default("{}")`) — `{ enabled, triggerKeyword: string, requireFollow: boolean, requireRetweet: boolean, dmTemplate: string, sentCount: number }`
  - `threadFinisherJson` (`String @default("{}")`) — `{ enabled, templateText: string, quoteFirstPost: boolean }`
  - `numberingStyle` (`String @default("none")`) — `"none" | "1/n" | "1." | "[1/n]" | "thread_emoji"`
  - `backupsJson` (`String @default("[]")`) — Automatic version history snapshots
  - `metricsJson` (`String @default("{}")`) — `{ impressions, likes, replies, reposts, bookmarks, profileClicks, engagementRate }`
  - `scheduledDate` (`DateTime?`), `publishedAt` (`DateTime?`)
  - `xPublishedUrl`, `linkedinPublishedUrl`, `threadsPublishedUrl`, `blueskyPublishedUrl`, `mastodonPublishedUrl`, `substackPublishedUrl`, `xArticlePublishedUrl`
  - `createdAt`, `updatedAt`
- **`Tag`**:
  - `id`, `socialSetId`, `slug`, `name`, `color` (`String @default("#6366F1")`), `createdAt`. (`@@unique([socialSetId, slug])`)
- **`CommentThread`** & **`Comment`**:
  - `CommentThread`: `id` (`String @id @default(cuid())`), `draftId` (`Int`), `platform` (`String @default("x")`), `postIndex` (`Int @default(0)`), `selectedText` (`String?`), `status` (`String @default("unresolved")`), `createdAt`.
  - `Comment`: `id` (`String @id @default(cuid())`), `threadId` (`String`), `authorId` (`String?`), `authorName` (`String`), `authorEmail` (`String`), `text` (`String`), `createdAt`, `updatedAt`.
- **`MediaAsset`**:
  - `id` (`String @id @default(cuid())`), `socialSetId` (`Int`), `fileName` (`String`), `mimeType` (`String`), `url` (`String`), `altText` (`String @default("")`), `status` (`String @default("ready")`), `createdAt`.
- **`AiPromptCommand`**:
  - `id` (`String @id @default(cuid())`), `socialSetId` (`Int`), `label` (`String`), `slug` (`String`), `icon` (`String`), `instruction` (`String`), `isEnabled` (`Boolean @default(true)`), `isBuiltIn` (`Boolean @default(false)`), `sortOrder` (`Int @default(0)`).
- **`WebhookEndpoint`** & **`ApiKey`**:
  - `WebhookEndpoint`: `id`, `socialSetId`, `name`, `url`, `eventsJson`, `secret`, `isActive`, `lastTriggeredAt`, `createdAt`.
  - `ApiKey`: `id`, `userId`, `name`, `keyPrefix`, `keyHash @unique`, `lastUsedAt`, `createdAt`.
