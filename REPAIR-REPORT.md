# Repair and verification — 27 September 2026

For the subsequent performance/SEO deployment and latest checks, see [SEO-PERFORMANCE-REPORT.md](SEO-PERFORMANCE-REPORT.md).

## Root causes and repairs

- **Draft save HTTP 400:** hosted `timestamptz` values use offsets such as `2026-09-24T07:00:00+00:00`. The old `z.iso.datetime()` schema rejected that value unless the user edited the date first. The schema now accepts offset timestamps, normalizes publication dates to UTC, accepts empty/null dates, and rejects invalid or timezone-free API dates. The editor displays local time; its separate concurrency token retains database microsecond precision.
- **Private image drafts:** alt text previously had a minimum length for every save. Blank alt text is now allowed in a private draft. Publishing still requires meaningful alt text and an explicit image privacy review. Neither review checkbox is automatically enabled.
- **Public images:** `.contains(column, [{ id, reviewed: true }])` generated PostgreSQL array syntax for a JSONB column, causing a failed query to appear as a missing image. Both article and laptop media lookups now send JSON explicitly, inspect query errors and retain authorization. Public delivery rechecks publication on every request; buckets and originals stay private.
- **Unhelpful diagnostics:** schema errors now identify fields, slug conflicts return an actionable 409, expired sessions are distinguished from invalid login credentials, upload errors identify format/size/decode problems, and safe server logs contain action/error codes rather than article bodies or credentials.
- **Lost or stale work:** browser working copies have revision metadata; restoring requires review and an explicit save. Conditional updates reject stale versions. Stable IDs avoid duplicate new articles after an ambiguous response. Edits made during a save are retained, save/preview wait for uploads, partial upload successes remain attached, failed selections can be retried, and logout no longer erases drafts or claims success after failure.
- **Admin header:** the brand leads to `/admin` on admin routes. Desktop/mobile header links remain inside the workspace, with an explicit **View public site** link.
- **Other fixes:** development-only CSP permits the Next development runtime without adding `unsafe-eval` to production; duplicate search parameters no longer crash filtering; login handles missing/expired users; configuration errors identify missing variable names without exposing values. `.nvmrc` selects the installed Node 24, and deployment exclusions keep local secrets/private imports/browser traces out of uploads.

The screenshot's unchecked review boxes were not, by themselves, the draft-save failure. The original request body was unavailable, but the timestamp rejection was reproduced using the actual hosted format. No `chrome.runtime`/`runtime.lastError` integration exists in the application, and no message-channel errors appeared in the isolated browser. Those screenshot messages are consistent with browser-extension activity; the particular extension cannot be identified from the screenshot.

## Data and privacy

- Existing project: `plwapcnzdjkzsrnawdjl`; no new Supabase project, database reset or schema migration was needed.
- Current hosted state: **37 articles — 28 published, 8 review, 1 needs verification**. This differs from the older 29-published description and preserves subsequent user changes.
- All three buckets are private with a 3,145,728-byte limit. Article/original buckets accept JPEG, PNG and WebP. Request media accepts only WebP because the route converts supported source uploads before storage.
- The five existing migrations were inspected in the initial connected investigation. Database acceptance tests replay them with RLS and the read-only `supabase/verify.sql` assertions.
- Temporary test accounts, allowlist entries, posts, revisions, comments, requests and image files were cleaned up. Full article snapshots before/after the successful hosted run matched for all 37 original articles. Existing uploads, local environment values, content files and browser drafts were retained.
- Removing an attached image detaches it; existing private originals are deliberately retained. A failed upload attempts to remove the files created by that upload and logs incomplete cleanup safely.

## Verification results

- `npm run check` on Node 24: **passed** — TypeScript, ESLint, **66 tests**, production build.
- Browser suite: **18 passed locally and 18 passed on production**, across desktop, Pixel 7 and 360px mobile. Real-article engagement requests are intercepted in these read-only browsing checks.
- Hosted acceptance: **passed** against the local Next server and actual hosted Auth/Postgres/Storage. Tested login/logout, ordinary and anonymous denial, origin checks, admin header, save/reopen/edit/preview, Karachi local-time display, stale conflicts, field errors, all three upload formats, invalid/oversized files, metadata/order/removal, private originals/previews, schedule/publish/unpublish, anonymous article/media delivery, synthetic views/likes, comment moderation/replies, requests with private images, conversion, statistics/settings page rendering and mobile overflow.
- Production authenticated smoke test: **passed** — login, private draft save with an offset date, image upload through the actual browser file input, saving a blank-alt/unreviewed image privately, refresh persistence, authorized preview, anonymous denial, admin header and logout. Temporary production account/post/image files were removed.
- Dev browser: meaningful page content, no runtime errors or CSP failures. An isolated browser was used, not the user's existing browser/profile.
- Shared production settings were inspected/rendered but not changed simply to test their save form. Literal token expiration is covered by an auth unit test; live signed-out and unauthorized sessions were tested.

## Deployment

Target: `talalwaheed3s-projects/simple-technologies` (`prj_7Flpoe7ag5xGd6flZmaLwNf0PuZs`), Node 24, `npm ci`, `npm run build`. Production configuration uses the existing hosted Supabase and a separate server-only visitor secret. `.env.local` remains the original local configuration. Production deployment `dpl_EKiCamqn1ggbXGpBSG9p17xgPeqw` is READY at **https://simple-technologies.vercel.app**. The public URL, canonical sitemap, production CSP and all 18 public browser checks have been verified. Admin entry: **https://simple-technologies.vercel.app/admin**.

## Local commands

```bash
cd /data/Programming/Projects/Simple-Technologies-Source
nvm use 24
npm run dev
```

In another terminal:

```bash
nvm use 24
npm run check
PLAYWRIGHT_BASE_URL=http://localhost:3000 PLAYWRIGHT_EXTERNAL_SERVER=1 \
  PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/google-chrome npm run test:e2e
VERIFY_HOSTED=1 npx tsx scripts/verify-hosted.ts
```

The final command explicitly creates and removes labelled temporary fixtures in the existing hosted project. It needs the securely configured `.env.local`, the dev server and Chrome; it never uses or resets the real administrator's password. Do not run it concurrently with editorial work if comparing before/after snapshots. A failed hosted check still attempts fixture cleanup and reports cleanup failures.
