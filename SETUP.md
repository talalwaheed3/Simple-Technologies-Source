> Latest hosted status: see HOSTED-STATUS.md (23 September 2026). It supersedes older account blockers and migration counts below.

# Setup

## 1. Dedicated Supabase project

Create or explicitly choose a project for **Simple Technologies**. Do not apply these migrations to Shop Ledger or another unrelated application. Project creation may consume quota or incur charges; select your organization and plan deliberately. The existing Blogs / Simple Technologies project is now initialized; see HOSTED-STATUS.md.

In the project dashboard, copy the project URL, publishable key and server secret key. Put them in `.env.local` using `.env.example`. The publishable key is safe for the browser with RLS; the secret key must stay server-only. Set `VISITOR_SECRET` to the output of `openssl rand -hex 32`. Set `NEXT_PUBLIC_SITE_URL` to your exact site origin.

## 2. Apply database migrations

The five migrations in `supabase/migrations` are ordered and versioned. With the installed CLI:

```bash
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

Alternatively run the complete SQL from each migration in order in a **new dedicated project's** SQL editor. Never run fragments or disable RLS to work around errors. CLI migration history is preferred. Check `--help` for installed CLI options.

Keep Data API enabled and automatic new-table exposure disabled. The fourth migration resets only app-owned object grants, disables future automatic grants (including global PUBLIC function execution), and restores a minimal explicit permission set. Apply all five migrations in one migration run before admitting visitors.

These create posts, revisions, admin allowlist, source inventory, comments, likes, views, analytics, requests, private media, affiliate links, laptops, settings and redirects. They create three private Storage buckets and scoped policies. Every public table has RLS. Anonymous clients can only read published data and cannot invoke engagement-write RPCs directly.

## 3. Create the admin

Create an email/password user from Supabase Authentication → Users. Disable public signups. Confirm the email as appropriate; use a strong password and do not share it. Copy its user UUID and run:

```sql
insert into public.admins(user_id) values ('REPLACE_WITH_AUTH_USER_UUID');
```

The application does not expose signup or admin-promotion endpoints. Auth user metadata cannot grant access. To revoke access, delete this allowlist row and revoke the Auth user's sessions. Configure Supabase Auth Site URL to the site origin. Password recovery is managed through Supabase's authenticated dashboard workflow, not an unauthenticated custom bypass.

## 4. Import reviewed source inventory

Use Node's env-file loader rather than shell-pasting secrets:

```bash
node --env-file=.env.local --import tsx scripts/seed.ts
```

The seed preserves existing IDs and edits; rerunning does not overwrite them. It imports eight unverified drafts and eight private case records. It publishes nothing.

## 5. Launch and configure

```bash
npm run dev
```

Open `/admin`, sign in, and use Settings to add your support/Fiverr URL, WhatsApp number in international format, contact email and booking URL. The app works without paid integrations. Review policies and contact details before inviting public submissions.

Optional Turnstile requires both challenge keys. Optional GA/AdSense need environment IDs and visitor consent; leave values empty to keep them disabled. Search Console verification is an environment value.

## Verification before public launch

Run `npm run check`. On the connected project: sign in as admin, add a private test draft, upload a redacted image, preview, publish a clearly labeled test article, test comments/requests/likes/views in a separate browser, verify admin moderation, then archive the test article. Use Supabase advisors to review security/performance and generate database types with `npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/lib/database.generated.ts` after checking CLI help. The checked-in application types model the schema; generated hosted types could not be obtained without a selected target project.
