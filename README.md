# Simple Technologies

A Next.js App Router troubleshooting knowledge base with a Supabase backend and a mobile technician workspace. Built for Vercel; no Sites-specific runtime is required.

## Start here

1. Read **SETUP.md** to connect a dedicated Supabase project and create your administrator.
2. Read **DEPLOYMENT.md** to deploy to Vercel.
3. Use **ADMIN-GUIDE.md** for daily publishing and **CONTENT-GUIDE.md** for source review.
4. See **VERIFICATION.md** for actual test coverage and remaining hosted checks.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Without credentials, the public site renders honest empty states, the admin page explains setup, and write endpoints return an unavailable response. It does not simulate successful writes or populate fake engagement.

## Included

Public SSR article pages; deduplicated home ranking; full-text search, filters and pagination; likes and views; moderated comments and technician replies; private solution requests; private admin authentication/authorization; instant-add editor with autosave, preview, scheduling, ordered screenshots and privacy checks; request-to-draft conversion; first-party analytics; affiliate links, support CTAs and laptop inventory; opt-in analytics/ad infrastructure; sitemap, RSS, robots and structured data; migrations, seed/import scripts and tests.

Eight earlier historical candidates are preserved as private **Needs Verification** legacy drafts. **No initial article is published.** The corrected historical scope is April 5, 2026 onward; these earlier drafts are outside that scope. Only the exhaustive historical audit waits for the export. See POST-LAUNCH-HISTORY-AUDIT.md and content/AUDIT.md.

## Commands

- `npm run dev` — local development
- `npm run check` — TypeScript, lint, unit/database tests and production build
- `npm run test:e2e` — desktop/mobile browser tests; install Chromium with `npx playwright install chromium`
- `npm run seed` — idempotent import of private draft inventory; load environment first
- `npm run import:history -- conversations.json /private/output` — private export triage from April 5, 2026 onward
- `npm run maintenance` — purge expired rate-limit/analytics data and 90-day-old requests/attachments
- `npm run format` — consistent formatting

Pinned dependencies and package-lock.json are included. Use Node 24 LTS (minimum supported by dependencies: Node 22). No paid AI API is required. This source package has no credentials, fabricated screenshots, fake customers or generated repair successes.
