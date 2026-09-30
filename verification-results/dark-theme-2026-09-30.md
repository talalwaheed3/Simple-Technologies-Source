# Dark theme verification — 30 September 2026

Implemented a shared Light / Dark / Use device setting picker in the public and admin header. Initial theme is applied synchronously before page content, with a versioned browser preference, OS-change support and cross-tab synchronization. Storage failures do not prevent theme switching. No new dependencies, server requests, cookies, database schema changes, or theme provider around page content.

The shared palette covers navigation, search, cards, tables, inputs, editor controls, sticky actions, notices, errors, consent dialog, and article content. Photos retain their original colors. The header keeps its public/admin navigation and fits 360px mobile screens.

Validation:
- TypeScript, ESLint, production build: passed.
- 98 unit tests: passed.
- 39 browser tests across desktop, Pixel 7 and 360px mobile: passed locally.
- Theme browser cases cover system changes, saved overrides, cross-tab synchronization, restoring device mode, blocked storage, pre-hydration application and preserving unsaved request input.
- Signed-in admin inspection at 1280px and 360px: overview, inventory, new editor, settings, requests, comments, laptop listings, affiliates and historical cases passed. Public request/support/article pages checked too.
- Editor text remains in place when switching light/dark; brand link still returns to the admin overview. No browser runtime errors during the signed-in checks.
- Admin verification used temporary accounts, removed afterwards. Article saves were intercepted during theme checks; no article or settings changes were made.
- Local `.env.local` retained (335 bytes); existing browser drafts were untouched because verification used isolated browser contexts.

Production deployment: **READY**, `dpl_CmkJca8Au29fYxKUoeDVFnuBy9CH`.
- Live URL: https://simple-technologies.vercel.app
- Immutable deployment: https://simple-technologies-3qhvu33gy-talalwaheed3s-projects.vercel.app
- All 39 browser tests passed against production (48.1 seconds).
- Signed-in production dashboard, inventory, settings and editor checks passed at 1280px and 360px, including unsaved input preservation, correct admin header navigation and no browser runtime errors. Temporary administrator and allowlist entry removed after verification.
- Deployment error-log query for the preceding hour returned no matching logs. This is a point-in-time check, not continuous monitoring.

