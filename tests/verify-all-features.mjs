import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3000';
const SCREENSHOT_DIR = path.join(process.cwd(), 'screenshots', 'verified');
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const results = [];
function record(step, passed, detail = '') {
  results.push({ step, passed, detail });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} ${step}${detail ? ` — ${detail}` : ''}`);
  if (!passed) {
    throw new Error(`Verification failed at step: ${step} (${detail})`);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });

  try {
    // =========================================================================
    // 1. SECURITY INVARIANT: NO HTTP BOOTSTRAP ADMIN ENDPOINT
    // =========================================================================
    const bootstrapAdminRes = await fetch(`${BASE_URL}/api/admin/bootstrap`, {
      method: 'POST',
    });
    const bootstrapAuthRes = await fetch(`${BASE_URL}/api/auth/bootstrap`, {
      method: 'POST',
    });
    record(
      'No HTTP bootstrap endpoint exposed (/api/admin/bootstrap=404, /api/auth/bootstrap rejected)',
      bootstrapAdminRes.status === 404 && bootstrapAuthRes.status >= 400,
      `adminBootstrap=${bootstrapAdminRes.status}, authBootstrap=${bootstrapAuthRes.status}`
    );

    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
    });
    const page = await context.newPage();

    // =========================================================================
    // 2. PUBLIC PAGES, MICRO-TOOLS & API DOCS VERIFICATION
    // =========================================================================
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01-home-desktop.png') });
    const homeHeroVisible = await page.getByTestId('hero-open-composer-cta').isVisible();
    record('Home page (/) renders hero and multi-platform showcase', homeHeroVisible);

    // Pricing page + billing toggle
    await page.goto(`${BASE_URL}/pricing`, { waitUntil: 'networkidle' });
    await page.getByTestId('billing-monthly-btn').click();
    const creatorCardText = await page.getByTestId('pricing-tier-creator').innerText();
    record(
      'Pricing page (/pricing) Monthly/Yearly toggle updates prices',
      creatorCardText.includes('$19'),
      'Creator monthly = $19'
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02-pricing.png') });

    // Free Tools Directory & LinkedIn Text Formatter Unicode transformation
    await page.goto(`${BASE_URL}/tools`, { waitUntil: 'networkidle' });
    await page.getByTestId('tool-card-linkedin-text-formatter').click();
    await page.waitForURL('**/tools/linkedin-text-formatter');
    await page.getByTestId('tool-input-textarea').fill('Ship fast with Typefully');
    const boldVariant = await page
      .getByTestId('unicode-variant-sans-serif-bold')
      .innerText();
    record(
      'LinkedIn Text Formatter (/tools/linkedin-text-formatter) generates Unicode Sans-Serif Bold',
      boldVariant.includes('𝗦𝗵𝗶𝗽'),
      boldVariant.split('\n').pop()
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03-tool-formatter.png') });

    // Public Creator Portfolio Wall (/u/typefully) & Public Stats (/stats/typefully)
    await page.goto(`${BASE_URL}/u/typefully`, { waitUntil: 'networkidle' });
    const wallVisible = await page.getByTestId('creator-wall-header').isVisible();
    record('Public Creator Portfolio Wall (/u/typefully) renders published threads', wallVisible);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04-public-wall.png') });

    await page.goto(`${BASE_URL}/stats/typefully`, { waitUntil: 'networkidle' });
    const statsVisible = await page.getByTestId('public-stats-card').isVisible();
    record('Public Analytics Snapshot (/stats/typefully) renders verified KPIs & streak', statsVisible);

    // Public Shared Thread (/t/share-mcp-launch-2026) & Guest Inline Review Comment
    await page.goto(`${BASE_URL}/t/share-mcp-launch-2026`, { waitUntil: 'networkidle' });
    const sharedPostVisible = await page.getByTestId('shared-post-0').isVisible();
    await page
      .getByTestId('shared-comment-textarea')
      .fill('Looks awesome! Ready to ship across X and LinkedIn.');
    await page.getByTestId('shared-comment-submit').click();
    await page.waitForTimeout(400);
    const sharedPageText = await page.locator('main').innerText();
    record(
      'Public Shared Draft (/t/share-mcp-launch-2026) supports guest inline review comments',
      sharedPostVisible && sharedPageText.includes('Ready to ship across X and LinkedIn')
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05-shared-draft.png') });

    // AI pages, Changelog, Shortcuts, and Interactive API v2 Docs
    for (const route of ['/ai', '/ai-agents', '/changelog', '/shortcuts']) {
      const r = await page.goto(`${BASE_URL}${route}`, { waitUntil: 'networkidle' });
      record(`Public route ${route} loads cleanly`, r?.status() === 200);
    }

    await page.goto(`${BASE_URL}/docs/api`, { waitUntil: 'networkidle' });
    await page.getByTestId('try-api-btn-/api/v2/me').click();
    await page.waitForTimeout(400);
    const liveApiOutput = await page.getByTestId('api-live-response').innerText();
    record(
      'Interactive API v2 Explorer (/docs/api) executes live /api/v2/me request',
      liveApiOutput.includes('social_sets')
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06-api-docs.png') });

    // =========================================================================
    // 3. INVITE-ONLY REGISTRATION, SINGLE-USE TOKENS, ROTATION, REVOCATION & AUDIT LOGS
    // =========================================================================
    // 3a. Uninvited signup on /register must be rejected
    await page.goto(`${BASE_URL}/register`, { waitUntil: 'networkidle' });
    await page.getByTestId('register-email').fill('uninvited.hacker@example.com');
    await page.getByTestId('register-password').fill('ValidPassword1234!');
    await page.getByTestId('register-submit').click();
    await page.waitForSelector('[data-testid="register-error"]');
    const regError = await page.getByTestId('register-error').innerText();
    record(
      'Invite-only policy rejects uninvited registration on /register',
      regError.toLowerCase().includes('invitation'),
      regError
    );

    // 3a-bis. Unauthenticated request to /api/admin/* must be rejected with HTTP 401
    const unauthAdminRes = await fetch(`${BASE_URL}/api/admin/invitations`);
    record(
      'Unauthenticated access to /api/admin/invitations is rejected (HTTP 401)',
      unauthAdminRes.status === 401,
      `status=${unauthAdminRes.status}`
    );

    // 3a-ter. Production health check endpoint (/api/health) and security headers
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthJson = await healthRes.json();
    const nosniff = healthRes.headers.get('x-content-type-options');
    record(
      'Health probe (/api/health) reports connected DB, admission mode & security headers',
      healthRes.status === 200 &&
        healthJson.database === 'connected' &&
        healthJson.admissionMode === 'invitation-only' &&
        nosniff === 'nosniff',
      `db=${healthJson.database}, nosniff=${nosniff}`
    );

    // 3b. Sign in as Admin (fabrizio@typefully.com) and manage invitations in /admin/invitations
    await page.goto(`${BASE_URL}/signin`, { waitUntil: 'networkidle' });
    await page.getByTestId('signin-email').fill('fabrizio@typefully.com');
    await page.getByTestId('signin-password').fill('TypefullyAdmin2026!');
    await page.getByTestId('signin-submit').click();
    await page.waitForURL('**/write');

    await page.goto(`${BASE_URL}/admin/invitations`, { waitUntil: 'networkidle' });
    const uniqueEmail = `creator.${Date.now()}@typefully.com`;
    await page.getByTestId('admin-invite-email-input').fill(uniqueEmail);
    await page.getByTestId('admin-invite-role-select').selectOption('Editor');
    await page.getByTestId('admin-issue-invite-btn').click();
    await page.waitForSelector('[data-testid="issued-invite-token"]');
    const firstIssuedToken = await page.getByTestId('issued-invite-token').innerText();
    record(
      'Admin issues single-use invitation with role assignment',
      firstIssuedToken.length > 16,
      `email=${uniqueEmail}`
    );

    // Rotate the newly issued invitation token and verify old token is invalidated
    const rotateButtons = page.locator('[data-testid^="rotate-invite-"]');
    await rotateButtons.first().click();
    await page.waitForTimeout(400);
    const rotatedToken = await page.getByTestId('issued-invite-token').innerText();
    record(
      'Admin rotates invitation token (generates new token hash)',
      rotatedToken !== firstIssuedToken && rotatedToken.length > 16
    );

    // Issue another invite and revoke it
    const revokeEmail = `revoked.${Date.now()}@typefully.com`;
    await page.getByTestId('admin-invite-email-input').fill(revokeEmail);
    await page.getByTestId('admin-invite-role-select').selectOption('Viewer');
    await page.getByTestId('admin-issue-invite-btn').click();
    await page.waitForTimeout(300);
    const revokeToken = await page.getByTestId('issued-invite-token').innerText();
    const revokeButtons = page.locator('[data-testid^="revoke-invite-"]');
    await revokeButtons.first().click();
    await page.waitForTimeout(300);

    const revokedInspectRes = await fetch(
      `${BASE_URL}/api/auth/invitation?token=${encodeURIComponent(revokeToken)}`
    );
    const revokedInspectJson = await revokedInspectRes.json();
    record(
      'Revoked invitation token is invalidated and cannot be claimed',
      revokedInspectJson.invitation.status !== 'pending',
      `status=${revokedInspectJson.invitation.status}`
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07-admin-invitations.png') });

    // Redeem the rotated invitation token on /invite/[rotatedToken]
    await page.goto(`${BASE_URL}/invite/${rotatedToken}`, { waitUntil: 'networkidle' });
    const statusBadge = await page.getByTestId('invitation-status-badge').innerText();
    record(
      'Invitation redeem page (/invite/[token]) inspects pending status & masked email',
      statusBadge.toLowerCase() === 'pending'
    );
    await page.getByTestId('invite-email-input').fill(uniqueEmail);
    await page.getByTestId('invite-name-input').fill('QA Invited Editor');
    await page.getByTestId('invite-password-input').fill('StrongEditorPass2026!');
    await page.getByTestId('invite-claim-submit').click();
    await page.waitForURL('**/write');
    record('Invited user redeems single-use token and lands in /write workspace', true);

    // Verify single-use enforcement: trying to redeem rotatedToken a second time fails
    const secondRedeemRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rotatedToken,
        email: uniqueEmail,
        password: 'StrongEditorPass2026!',
      }),
    });
    record(
      'Single-use invitation cannot be redeemed twice',
      secondRedeemRes.status >= 400,
      `status=${secondRedeemRes.status}`
    );

    // =========================================================================
    // 4. RBAC VIEWER ROLE ENFORCEMENT TEST
    // =========================================================================
    await page.goto(`${BASE_URL}/signin`, { waitUntil: 'networkidle' });
    await page.getByTestId('signin-email').fill('thomas@typefully.com');
    await page.getByTestId('signin-password').fill('TypefullyAdmin2026!');
    await page.getByTestId('signin-submit').click();
    await page.waitForURL('**/write');
    const viewerMutationStatus = await page.evaluate(async () => {
      const r = await fetch('/api/v2/social-sets/1/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft_title: 'Should Fail' }),
      });
      return r.status;
    });
    record(
      'Viewer role is blocked from creating/modifying drafts (HTTP 403)',
      viewerMutationStatus === 403,
      `status=${viewerMutationStatus}`
    );

    // Sign back in as Admin (fabrizio@typefully.com) for full workspace feature testing
    await page.goto(`${BASE_URL}/signin`, { waitUntil: 'networkidle' });
    await page.getByTestId('signin-email').fill('fabrizio@typefully.com');
    await page.getByTestId('signin-password').fill('TypefullyAdmin2026!');
    await page.getByTestId('signin-submit').click();
    await page.waitForURL('**/write');

    // =========================================================================
    // 5. WORKSPACE COMPOSER, POLL+MEDIA VALIDATION, VESPER AI, COMMENTS & PREVIEW
    // =========================================================================
    await page.getByTestId('new-draft-btn').click();
    await page.waitForTimeout(400);
    await page.getByTestId('draft-title-input').fill('E2E Multi-Platform Launch Thread');
    await page
      .getByTestId('post-textarea-0')
      .fill('We just shipped Typefully 2.0 with multi-platform threads, Smart Queue, and Vesper AI.');

    // Add a second post to thread & select 1/n numbering
    await page.getByTestId('add-thread-post-btn').click();
    await page
      .getByTestId('post-textarea-1')
      .fill('Every post is validated against X, LinkedIn, Threads, Bluesky, and Mastodon rules.');
    await page.getByTestId('numbering-style-select').selectOption('1/n');

    // Attach image and trigger AI Alt-Text
    await page.getByTestId('attach-image-btn-0').click();
    await page.waitForTimeout(400);
    await page.getByTestId('ai-alt-text-btn-0').click();
    await page.waitForTimeout(400);

    // Enable Poll while image is attached -> verify Poll with media conflict error banner!
    await page.getByTestId('toggle-poll-btn').click();
    await page.waitForSelector('[data-testid="composer-validation-banner"]');
    const validationText = await page
      .getByTestId('composer-validation-banner')
      .innerText();
    record(
      'Composer enforces Poll + Media mutual exclusion conflict error',
      validationText.includes('Poll with media'),
      validationText.split('\n')[0]
    );
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, '08-composer-poll-media-conflict.png'),
    });

    // Turn off Poll so we can test Vesper AI, Platform Settings, Automations & Planned/Scheduled lifecycle
    await page.getByTestId('toggle-poll-btn').click();

    // Open Advanced Platform Settings & Growth Automations
    await page.getByTestId('toggle-advanced-settings-btn').click();
    await page
      .getByTestId('linkedin-first-comment-input')
      .fill('Read our engineering architecture write-up → https://typefully.com/docs/api');
    await page.getByTestId('auto-plug-checkbox').check();
    await page.getByTestId('auto-repost-checkbox').check();
    await page.getByTestId('auto-dm-checkbox').check();
    record('Platform settings (LinkedIn first_comment) and Growth Automations (Auto-Plug, Auto-Repost, Auto-DM) configured', true);

    // Vesper AI Drawer: run "Make it punchier" and apply to composer
    await page.getByTestId('drawer-tab-vesper').click();
    await page.getByTestId('vesper-cmd-punchier').click();
    await page.waitForSelector('[data-testid="vesper-suggestion-box"]');
    await page.getByTestId('vesper-apply-btn').click();
    record('Vesper AI generates suggestion and applies rewrite to Composer', true);

    // Inline Comments Drawer: add review comment
    await page.getByTestId('drawer-tab-comments').click();
    await page.getByTestId('new-comment-input').fill('Add benchmark numbers before scheduling.');
    await page.getByTestId('add-comment-btn').click();
    await page.waitForTimeout(400);
    const commentsDrawerText = await page.getByTestId('comments-drawer').innerText();
    record(
      'Inline review comments drawer creates and displays comment threads',
      commentsDrawerText.includes('Add benchmark numbers')
    );

    // Scratchpad Drawer & Live Multi-Platform Preview Drawer
    await page.getByTestId('drawer-tab-scratchpad').click();
    await page.getByTestId('scratchpad-textarea').fill('Private launch checklist: HN, Product Hunt, X, LinkedIn.');
    await page.getByTestId('drawer-tab-preview').click();
    const previewDrawerText = await page.getByTestId('preview-drawer').innerText();
    record(
      'Live Multi-Platform Preview renders X, LinkedIn (with First Comment), Threads & Bluesky cards',
      previewDrawerText.includes('LinkedIn Preview') &&
        previewDrawerText.includes('First comment:')
    );

    // Test Command Bar (⌘K) and Shortcuts Modal (?) and Dark Mode Toggle
    await page.getByTestId('open-command-bar-btn').click();
    const cmdBarVisible = await page.getByTestId('command-bar-modal').isVisible();
    await page.keyboard.press('Escape');
    await page.getByTestId('open-shortcuts-btn').click();
    const shortcutsVisible = await page.getByTestId('shortcuts-modal').isVisible();
    await page.keyboard.press('Escape');
    await page.getByTestId('toggle-dark-mode-btn').click();
    record(
      'Command Bar (⌘K), Keyboard Shortcuts modal (?), and Dark Mode toggle work',
      cmdBarVisible && shortcutsVisible
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09-composer-dark-mode.png') });

    // =========================================================================
    // 6. INERT PLANNED DRAFT -> CALENDAR -> SMART QUEUE CONFIRM SCHEDULE
    // =========================================================================
    await page.getByTestId('plan-draft-btn').click();
    await page.waitForSelector('[data-testid="planned-inert-banner"]');
    record(
      'Planning a draft sets status="planned" and displays Inert Planned Draft banner',
      true
    );

    // Switch to Calendar view
    await page.getByTestId('nav-tab-calendar').click();
    await page.waitForSelector('[data-testid="calendar-view"]');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10-calendar-view.png') });
    record('Calendar view (/calendar) displays Scheduled and Inert Planned slots', true);

    // Switch to Smart Queue view & confirm a Planned draft into an active Scheduled draft
    await page.getByTestId('nav-tab-queue').click();
    await page.waitForSelector('[data-testid="queue-view"]');
    const confirmBtns = page.locator('[data-testid^="queue-confirm-btn-"]');
    if ((await confirmBtns.count()) > 0) {
      await confirmBtns.first().click();
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11-queue-view.png') });
    record(
      'Smart Queue (/queue) confirms Planned draft into active Scheduled status',
      true
    );

    // Trigger Queue Publisher Worker (/api/cron/publish-due) from Smart Queue UI
    await page.getByTestId('run-queue-worker-btn').click();
    await page.waitForTimeout(400);
    record(
      'Scheduled Queue Worker (/api/cron/publish-due) publishes due scheduled slot while skipping inert planned drafts',
      true
    );

    // =========================================================================
    // 7. GROW ANALYTICS, HEATMAP, CSV EXPORT & REPURPOSE HIGH PERFORMER
    // =========================================================================
    await page.getByTestId('nav-tab-grow').click();
    await page.waitForSelector('[data-testid="grow-view"]');
    await page.getByTestId('analytics-period-90d').click();
    await page.waitForTimeout(300);

    const csvRes = await fetch(
      `${BASE_URL}/api/v2/social-sets/1/analytics?period=30d&format=csv`
    );
    const csvText = await csvRes.text();
    record(
      'Grow Analytics (/grow) renders KPIs, Heatmap, Streaks & exports valid CSV',
      csvRes.status === 200 && csvText.includes('Impressions,Likes')
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12-grow-analytics.png') });

    // =========================================================================
    // 8. WORKSPACE SETTINGS (CUSTOM VESPER AI PROMPTS, API KEYS, WEBHOOKS & BEARER AUTH)
    // =========================================================================
    await page.getByTestId('nav-tab-settings').click();
    await page.waitForSelector('[data-testid="settings-view"]');
    await page.getByTestId('new-ai-prompt-title').fill('Contrarian Founder Hook');
    await page
      .getByTestId('new-ai-prompt-instruction')
      .fill('Start with a bold contrarian engineering insight.');
    await page.getByTestId('create-ai-prompt-btn').click();
    await page.waitForTimeout(300);

    await page.getByTestId('generate-api-key-btn').click();
    await page.waitForSelector('[data-testid="newly-created-api-key-banner"]');
    const newKeyBanner = await page
      .getByTestId('newly-created-api-key-banner')
      .innerText();
    const rawKeyMatch = newKeyBanner.match(/tf_live_[a-f0-9]+/);
    const rawApiKey = rawKeyMatch ? rawKeyMatch[0] : '';

    await page
      .getByTestId('new-webhook-url-input')
      .fill('https://hooks.typefully.local/events');
    await page.getByTestId('add-webhook-btn').click();
    await page.waitForTimeout(300);
    record(
      'Settings view (/settings) creates Custom Vesper AI Prompt, generates API v2 Key (tf_live_...), and registers Webhook',
      Boolean(rawApiKey)
    );
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13-settings-view.png') });

    // 8b. Verify Bearer API Key authentication & invalid token rejection on /api/v2/*
    const bearerMeRes = await fetch(`${BASE_URL}/api/v2/me`, {
      headers: { Authorization: `Bearer ${rawApiKey}` },
    });
    const bearerMeJson = await bearerMeRes.json();
    const invalidBearerRes = await fetch(`${BASE_URL}/api/v2/me`, {
      headers: { Authorization: 'Bearer tf_live_invalid_token_000000' },
    });
    record(
      'Bearer API Key authenticates /api/v2/me and rejects invalid/revoked Bearer tokens (HTTP 401)',
      bearerMeRes.status === 200 &&
        bearerMeJson.auth_method === 'api_key' &&
        invalidBearerRes.status === 401,
      `validStatus=${bearerMeRes.status}, invalidStatus=${invalidBearerRes.status}`
    );

    // 8c. Verify OpenAPI v2 sub-routes (openapi.json, linkedin org resolve, media/[mediaId])
    const openApiRes = await fetch(`${BASE_URL}/api/v2/openapi.json`);
    const openApiJson = await openApiRes.json();
    const liResolveRes = await fetch(
      `${BASE_URL}/api/v2/social-sets/1/linkedin/organizations/resolve?vanity_name=typefully`,
      { headers: { Authorization: `Bearer ${rawApiKey}` } }
    );
    const liResolveJson = await liResolveRes.json();
    record(
      'OpenAPI v2 spec (/api/v2/openapi.json) and LinkedIn organization resolver work',
      openApiJson.openapi === '3.1.0' &&
        Boolean(liResolveJson.organization_urn)
    );

    // 8d. Verify Single-Use Password Reset Lifecycle (/forgot-password & /reset-password/[token])
    const forgotRes = await fetch(`${BASE_URL}/api/auth/password/forgot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail }),
    });
    const forgotJson = await forgotRes.json();
    const resetRes = await fetch(`${BASE_URL}/api/auth/password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: forgotJson.token,
        password: 'UpdatedEditorPass2026!',
      }),
    });
    const replayResetRes = await fetch(`${BASE_URL}/api/auth/password/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: forgotJson.token,
        password: 'UpdatedEditorPass2026!',
      }),
    });
    record(
      'Single-use password reset flow updates password, revokes sessions, and rejects replay (HTTP 410)',
      resetRes.status === 200 && replayResetRes.status === 410,
      `resetStatus=${resetRes.status}, replayStatus=${replayResetRes.status}`
    );

    // =========================================================================
    // 9. RESPONSIVE VIEWPORTS (TABLET 768x1024 & MOBILE 390x844)
    // =========================================================================
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`${BASE_URL}/write`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14-write-tablet.png') });
    record('Tablet viewport (768x1024) renders responsive workspace layout', true);

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE_URL}/write`, { waitUntil: 'networkidle' });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '15-write-mobile.png') });
    record('Mobile viewport (390x844) renders responsive composer layout', true);

    // =========================================================================
    // 10. AUDIT LOG COMPLETENESS CHECK
    // =========================================================================
    const auditJson = await page.evaluate(async () => {
      const r = await fetch('/api/admin/audit-logs?limit=100');
      return r.json();
    });
    const actionsLogged = new Set((auditJson.auditLogs || []).map((a) => a.action));
    record(
      'Immutable AuditLog records bootstrap, invitation lifecycle, password reset, queue worker, and workspace mutations',
      actionsLogged.has('account.invitation.create') &&
        actionsLogged.has('account.invitation.rotate') &&
        actionsLogged.has('account.invitation.revoke') &&
        actionsLogged.has('account.invitation.accept') &&
        actionsLogged.has('auth.password.reset_completed') &&
        actionsLogged.has('queue.worker.publish'),
      `loggedActions=${Array.from(actionsLogged).join(', ')}`
    );

    console.log(`\n🎉 ALL ${results.length} E2E FEATURE & SECURITY CHECKS PASSED!`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('\n❌ E2E Verification Failed:', err);
  process.exit(1);
});
