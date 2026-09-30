> Deployed 27 September 2026: https://simple-technologies.vercel.app. See [REPAIR-REPORT.md](REPAIR-REPORT.md) for verified results and remaining test limits.

# Vercel deployment

The repository is linked to `talalwaheed3s-projects/simple-technologies`, project `prj_7Flpoe7ag5xGd6flZmaLwNf0PuZs`, using Node 24. Production variables are configured for the existing Supabase project `plwapcnzdjkzsrnawdjl`. See [REPAIR-REPORT.md](REPAIR-REPORT.md) for the verified deployment outcome. Do not create or reset another database.

1. Confirm the existing project and its applied migrations using SETUP.md; do not reimport content.
2. Push this source repository to your Git provider, then import it in Vercel, or use the Vercel CLI after authenticating.
3. Select the Next.js framework and Node 24 runtime. Install: `npm ci`. Build: `npm run build`. The included vercel.json declares the framework and commands.
4. Add the environment variables from `.env.example`. `SUPABASE_SECRET_KEY` and `VISITOR_SECRET` must never use the `NEXT_PUBLIC_` prefix. Use different projects and secrets for preview/development versus production.
5. Set `NEXT_PUBLIC_SITE_URL` to the exact HTTPS deployment domain; add the domain in Supabase Auth settings. This origin also protects writes against cross-site requests. Preview environments need their own exact origin.
6. Deploy. Run the connected acceptance steps from VERIFICATION.md before opening the site to readers.
7. Add your custom domain, redeploy with the canonical URL, verify Search Console and submit `/sitemap.xml`. Check `/rss.xml`, `/robots.txt`, canonical links and an article's structured data.

Public article HTML is server rendered. Cached public pages refresh on a 60-second interval and admin saves invalidate affected routes. Scheduled posts are filtered by database timestamp; appearance can lag by one cache interval. Authenticated pages are dynamic and private/no-store. Cookies are never shared through a public cache.

Image uploads are server-processed, capped below Vercel's function payload limit, and stored privately. Database and object backups are separate. Public media is served only when attached to a published article or available listing and reviewed for privacy.

## Optional monetization

- Add support destinations in Admin → Settings; empty destinations are not shown.
- Add affiliate records in Admin → Affiliate links. Require a disclosure and enable only relevant links. Destination URLs accept HTTP(S) only. Links are tracked through `/go` and use sponsored/nofollow semantics.
- Add available machines in Admin → Laptop listings. No checkout/payment workflow is implied.
- Enable GA with `NEXT_PUBLIC_GA_ID`; set an actual approved AdSense publisher and slot only after approval. Scripts and ad slots remain off without IDs and explicit visitor consent. Consent infrastructure is not a certification of jurisdiction-specific compliance; review the operator's actual practices before launch.

## Maintenance and recovery

Run the maintenance script daily from your scheduler/CI using server secrets. It prunes >90-day analytics and requests and deletes their request attachments first. Views/likes aggregate counters remain. Published comments and active likes remain until intentionally removed. Rate-limit hashes expire in one hour and are purged daily.

Check the Supabase plan's actual backup coverage and retention. Export database backups to protected storage on a schedule and test restore into a separate project. Export all three Storage buckets as well; database backups do not include object bytes. Keep migrations, source and environment configuration separately. Never put server secrets in database exports shared publicly.

For dependency updates: use a branch, inspect changelogs/security advisories, update pinned versions and lockfile, run the full checks, then deploy to preview. Review Supabase advisors after schema changes. Do not edit applied migrations: create a new migration.

## Troubleshooting

- Empty public site: expected until verified articles are published; a future publish timestamp remains private.
- Admin denied: verify the Auth user and matching admins row; user metadata is irrelevant.
- Forms unavailable: check all server variables and migrations. If public forms fail after domain changes, confirm NEXT_PUBLIC_SITE_URL matches the browser origin.
- Upload fails: JPEG/PNG/WebP only; check size, Storage policies and keys. PDFs/SVGs are not accepted.
- Supabase timeout: retry; inspect service health and logs. The UI does not claim a save succeeded after an error.
- Changed SEO origin: update environment and redeploy; do not keep localhost canonicals in production.

## 23 September 2026 continuation

Vercel's plugin was connected, but CLI write authorization was not yet complete. GitHub connection and dedicated Supabase project selection were also pending. The full history export is not a deployment prerequisite. Use the account blockers and connected acceptance in VERIFICATION.md; do not publish a claim that hosted features passed before running those checks.

Before public launch, run `supabase/verify.sql` on the intended database after all four migrations and run hosted Supabase advisors. Use `PLAYWRIGHT_BASE_URL` plus `PLAYWRIGHT_EXTERNAL_SERVER=1` only for a deliberately selected test deployment; the current browser assertions expect an unconnected local instance. Perform the connected acceptance separately against configured production/staging.
