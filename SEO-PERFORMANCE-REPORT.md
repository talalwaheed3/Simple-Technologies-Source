# SEO and performance optimization

Work completed against the existing Next.js 16.3.5 application and hosted Supabase project. Dependencies, article content, database policies and private Storage buckets were preserved.

## Deployment and verification — 29 September 2026

Deployed to [simple-technologies.vercel.app](https://simple-technologies.vercel.app) in the existing `talalwaheed3s-projects/simple-technologies` project. Production deployment `dpl_DzP6vTXQh1NK95aMpkdgRovu6ePp` is READY. The preceding production deployment remains available; no project, domain, database or environment file was replaced.

- TypeScript, ESLint and **98 unit/database tests** pass. Local and Vercel production builds pass with the existing lockfile.
- **30 browser checks pass locally and 30 pass on production**, across desktop, Pixel 7 and 360px mobile. They cover search/navigation, protected routes, form error preservation, overflow, canonical pagination, indexing rules, sitemap/robots/RSS and article structured data.
- Connected acceptance against the local production build and actual hosted Supabase passed: Auth, admin header navigation, offset-date drafts, editing and stale-save conflicts, JPEG/PNG/WebP upload/preview, invalid uploads, schedule/publish/unpublish, anonymous media access, moderation, requests and logout. All 37 existing articles matched their original snapshots afterward; temporary records and image files were removed.
- The same complete authenticated acceptance also passed against the deployed production URL. All 37 original article snapshots were unchanged, and the script removed its temporary accounts, posts, comments, requests and image files. Browser runtime checks were clean. Shared site settings were rendered but not rewritten for testing; cache invalidation is covered by focused unit tests.
- No dependency upgrade, schema migration, real-article rewrite or monetization-account activation was performed. Optional provider configuration is tested using mocked scripts; live advertising/analytics/Turnstile services remain unconfigured.

## Performance changes

- Home, browse and related-article queries fetch card fields rather than complete article bodies. For the current latest 12 public articles, serialized database response size fell from 54,971 to 5,094 bytes (90.7%). This is a database payload measurement, not a claim that the entire page is 91% smaller.
- Homepage ranking requests and independent related-article queries run concurrently. Laptop and affiliate queries select only displayed fields.
- Public site settings use a tagged five-minute data cache and expire immediately after a successful admin save. Authentication, privileged clients and article/image visibility checks do not opt into this cache.
- Vercel functions are configured for Tokyo (`hnd1`), matching the existing Supabase `ap-northeast-1` region. This reduces the distance traveled by database requests; public static assets remain on the CDN.
- Already-generated WebP images render with native image markup and accurate responsive width candidates. Their dimensions reserve space, they load lazily, and private preview parameters remain intact.
- Optional analytics and advertising wait for consent and browser idle time. Configured ad space exists in server HTML to avoid an avoidable layout shift. Article comment challenges load on form interaction; single-use tokens refresh for retries. Unconfigured services cause no external script downloads or empty ad space.
- Consent remains usable when browser storage is blocked, and revocation reloads the page to stop previously loaded optional scripts.

## Measured before/after results

Production measurements on 29 September 2026, using the same public origin and article, three fresh browser contexts per route, Pixel 7 viewport, 4× CPU slowdown, 1.6 Mbps download and 150 ms network latency. Values below are medians. [Full measurements](verification-results/performance-2026-09-29.json) include response headers, browser errors, request sizes and individual runs.

| Metric | Before | After |
| --- | ---: | ---: |
| Homepage LCP | 1,252 ms | 832 ms |
| Article LCP | 2,488 ms | 1,008 ms |
| Homepage CLS | 0 | 0 |
| Article CLS | 0 | 0 |
| Homepage JavaScript transferred | 147,655 B | 148,002 B |
| Article JavaScript transferred | 156,244 B | 156,456 B |
| Homepage total transfer | 166,575 B | 168,747 B |
| Article total transfer | 176,090 B | 181,474 B |

The sampled article rendered its largest content about **59.5% sooner**, and the homepage about **33.5% sooner**. Added metadata and defensive client behavior slightly increased page bytes; the measured gain is chiefly faster content delivery, not a claim of a smaller JavaScript bundle. Response headers confirm function placement changed from `iad1` to `hnd1`. No browser runtime errors or horizontal overflow were recorded, and measurement requests did not create engagement.

CDN warmth and network conditions are not controlled, so these small lab samples do not prove a fixed improvement for every visitor or establish real-user Core Web Vitals. The observation window ends two seconds after load; there is no advertising consent, scrolling or interaction in these measurements, and no INP or Lighthouse score is claimed. Advertising needs fresh measurements when actually configured. Search ranking is not guaranteed by these measurements or technical SEO changes.

## Additional defects caught during verification

- A counted PostgREST query beyond the last page returns `416/PGRST103`, not an empty array. The browse query now recognizes this result so the page can render its not-found/noindex response while still reporting genuine database failures.
- In the installed router, repeated desktop mouse clicks on a pagination Link updated the URL and content but retained page-one metadata, despite correct page-two metadata in the server response. Previous/Next use ordinary anchors to keep document metadata and visible results consistent without changing global caching or streaming.
- Inline JSON-LD now escapes `<` as a literal JSON Unicode escape, preventing text such as `</script>` in a title or brand from closing the script element. A regression test checks both safe markup and JSON round-trip accuracy.

## Technical SEO changes

- The homepage has a canonical URL. Browse pagination now points to each page's own canonical URL instead of incorrectly declaring every page a duplicate of page one. Category collections keep their own canonical URLs and descriptive headings.
- Canonical URLs omit tracking parameters, empty filters, page one and the default sort order. Search, device, operating-system, tag, alternative-sort and unknown-category views use `noindex, follow`. Out-of-range result pages return the unavailable-page view with `noindex` rather than creating an unlimited set of empty indexable pages.
- Public information pages have distinct, accurate descriptions. Articles retain editor-supplied SEO titles and descriptions, with descriptive social metadata and real publication/modification dates.
- Article structured data describes the visible institutional author, links to the About page, identifies the publisher and website, includes reviewed article images, and matches the visible breadcrumb navigation. No ratings, invented credentials, fabricated repair outcomes or unsupported FAQ/HowTo rich-result claims were added.
- The sitemap includes published, due articles, populated category collections and reviewed public article images. Modification dates remain the recorded editorial dates; they are not reset on every request.
- `robots.txt` now permits the public media endpoint so search engines can retrieve reviewed article images. API/private-route restrictions and authenticated preview exclusions remain. The media endpoint continues checking current publication and image review status on every request. `max-image-preview:large` permits larger previews where a search engine considers them appropriate.
- RSS discovery and linked Organization/WebSite structured data improve machine-readable site identification.

## Owner setup after deployment

1. Use the permanent public domain in `NEXT_PUBLIC_SITE_URL`. If you later move to a custom domain, update this setting and redirect the old domain to it before submitting the new sitemap.
2. Verify ownership in Google Search Console using DNS verification or the existing `NEXT_PUBLIC_SEARCH_CONSOLE_VERIFICATION` HTML-token setting. Submit `/sitemap.xml` on the permanent domain. Inspect the homepage and a few published articles, including one with screenshots, and request indexing after confirming that Google can fetch them.
3. Monitor Search Console indexing, search queries and Core Web Vitals. Review PageSpeed Insights after enough real visits accumulate; a local laboratory result does not establish real-user Core Web Vitals.
4. Before enabling an advertising account, configure only the account identifiers issued by the provider and follow its site verification, consent and seller-file instructions. Add actual authorized `ads.txt` entries when provided; guessed publisher IDs or seller declarations were not added.
5. Keep publishing useful, verified repair content with accurate titles, symptoms, device/software context, original reviewed screenshots and visible corrections. Technical fixes improve discovery and usability; ranking and advertising approval are determined by search engines/providers and cannot be guaranteed.

## Sources used for SEO decisions

- [Google pagination and incremental loading](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading): self-referencing pagination canonicals, crawlable links and indexing control for filter variants.
- [Google Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article): author identification, publication/modification dates and representative images.
- [Google image SEO](https://developers.google.com/search/docs/appearance/google-images): crawlable public images and descriptive context.
- [Google structured data policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies): truthful markup that corresponds to visible page content.
- [Google robots.txt interpretation](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec): specific allow/disallow path rules.
- Installed Next.js 16.3.5 documentation for metadata, robots, sitemap and safe JSON-LD serialization in `node_modules/next/dist/docs/`.

## SEO regression coverage

`tests/seo.test.ts` covers canonical identity, filter indexing rules, reviewed-only structured images, public discovery rules, and publication/date filters on sitemap queries. `tests/browser/seo.spec.ts` checks rendered canonicals, crawler directives, sitemap responses and article markup against visible content. Existing media authorization tests continue verifying that unpublished images and anonymous private previews are denied.

## Reproduce the checks

Use the installed Node 24 (`nvm use 24`) and existing lockfile. Run `npm run check` for TypeScript, lint, unit/database tests and the production build. On a restricted execution host, Next's build workers and browser require permission to bind local sockets.

For production-build browser tests, run `npm run start -- --port 3000`, then `PLAYWRIGHT_BASE_URL=http://localhost:3000 PLAYWRIGHT_EXTERNAL_SERVER=1 PLAYWRIGHT_CHROMIUM_PATH=/usr/bin/google-chrome npm run test:e2e`.

`VERIFY_HOSTED=1 node_modules/.bin/tsx scripts/verify-hosted.ts` is an opt-in connected acceptance test against the local app. It creates clearly labeled temporary accounts, articles and images in the existing hosted project, removes its fixtures, and verifies all existing article records are unchanged. It covers login/logout, admin header navigation, draft editing, uploads, scheduling, publication/privacy, comments and requests. Avoid running it while actively editing articles because its preservation check compares full snapshots.

`node scripts/measure-performance.mjs` runs three read-only mobile measurements each for the homepage and an article. For before/after comparisons, fix the route with `PERFORMANCE_ARTICLE=/solutions/dell-firmware-password-document-the-authorized-support-route`. The script intercepts engagement and all other writes so measurements do not inflate real article statistics.

Vercel region decisions follow [Vercel's function-region guidance](https://vercel.com/docs/functions/configuring-functions/region) and [region reference](https://vercel.com/docs/regions).
