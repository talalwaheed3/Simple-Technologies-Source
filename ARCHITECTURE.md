# Architecture

## Boundaries

- `src/app`: App Router pages and route handlers. Public text is rendered by server components.
- `src/components`: shared cards, article sections, interactive engagement and admin forms.
- `src/lib/data.ts`: public read queries, settings, related posts and SEO helpers.
- `src/lib/ranking.ts`: deterministic latest/viewed/liked selection with unique IDs; global interaction threshold is 30.
- `src/lib/supabase.ts`: request-local anonymous, authenticated and server-secret clients. No module-scope user sessions.
- `src/lib/security.ts`: origin checks, signed HttpOnly visitor cookies, persistent rate limits, optional challenges and public errors.
- `src/lib/validation.ts`: Zod payload schemas and publication rules.
- `supabase/migrations`: PostgreSQL tables, indexes, RLS, Storage buckets, aggregates and transaction functions.
- `content`: anonymized inventory and unverified drafts, not production testimonials or test fixtures.
- `scripts`: seed, private history triage and maintenance.

## Data model decisions

Posts store bounded arrays for tags, related IDs, FAQs and screenshots; these are article-owned data rather than a separate taxonomy administration system. Indexed text search covers titles, symptoms, errors, device, OS, tags and content. Category/tag filters are explicit. Canonical articles have UUID internal identities and durable slugs; revisions and redirect rows preserve editing history. Operational analytics are private. Public settings contain only public contact/configuration fields, never secrets.

Anonymous write requests reach validated, rate-limited server endpoints. A service-only invoker RPC handles likes/views atomically; visitors cannot call it through the public Data API. A signed random cookie prevents arbitrary visitor-ID selection. No fingerprint or raw IP is stored by the application. Daily keyed address hashes back shared rate limits. Deployment is designed for Vercel, whose trusted forwarding header is used; behind another proxy, configure and audit the trusted address source rather than trusting user headers.

Authenticated admin routes call getUser and verify the database allowlist. RLS independently enforces the same allowlist. No self-registration or user-editable metadata can create an admin. SQL invoker functions preserve RLS. Only the server role executes anonymous engagement writes and rate limits. Storage originals and request images are always private. Optimized media is streamed only after checking a current published attachment; short caching can keep a previously served image available for up to 60 seconds.

## Content and media

Articles use structured plain text, ordered solution steps, code blocks and optional FAQs. React escapes content; JSON-LD also escapes `<`. Images are decoded under a pixel cap, metadata stripped, converted to WebP, and resized to 480/960/1600 variants. Original bytes are retained privately. SVG and executable uploads are disallowed. Alt text, captions, ordering and privacy review are part of the editor.

## Caching and performance

Public pages use server rendering and 60-second revalidation where applicable. Admin saves invalidate public routes. Authenticated routes are dynamic/private. Database indexes cover published date, views, likes, category, tags, FTS, moderation and event dates. Most article content requires no client JS. Client components cover votes/forms, screenshot srcsets, consent and editing. No animation library or remote font fetch is required.

Core Web Vitals are goals, not measured production claims. Test real devices, images and traffic after deployment. Local empty-state browser checks cannot establish production CWV.

## Integrations and limits

No paid AI, search service or analytics suite is required. GA/AdSense are optional and consent-gated. Search Console supports verification and external access; metrics ingestion is not configured. No email-notification service or automatic response to requests is claimed. Draft revision history is stored, but there is no one-click revision-restore UI. Local draft protection is browser-local and should only be used on trusted devices.
