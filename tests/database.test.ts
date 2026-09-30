import { PGlite } from "@electric-sql/pglite";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { readFile, readdir } from "node:fs/promises";
let db: PGlite;
const post = "00000000-0000-4000-8000-000000000001",
  draft = "00000000-0000-4000-8000-000000000002",
  visitor = "00000000-0000-4000-8000-000000000003",
  admin = "00000000-0000-4000-8000-000000000004",
  ordinary = "00000000-0000-4000-8000-000000000005";
beforeAll(async () => {
  db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema public,auth to anon,authenticated,service_role;create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;`,
  );
  for (const f of (await readdir("supabase/migrations")).sort())
    await db.exec(await readFile("supabase/migrations/" + f, "utf8"));
  await db.exec(
    `insert into auth.users values('${admin}'),('${ordinary}');insert into public.admins(user_id) values('${admin}');insert into public.posts(id,title,slug,excerpt,steps,verification,status,verified,published_at) values('${post}','Published repair','published-repair','A verified fix','A sufficiently detailed solution','Confirmed by an actual test','published',true,now()-interval '1 day');insert into public.posts(id,title,slug) values('${draft}','Private draft','private-draft');`,
  );
});
afterAll(async () => {
  await db.close();
});
async function role<T>(r: string, sql: string, user = ordinary) {
  await db.exec(`set role ${r};set request.jwt.claim.sub='${user}';`);
  try {
    return await db.query<T>(sql);
  } finally {
    await db.exec("reset role");
  }
}
describe("Postgres migrations and RLS", () => {
  it("anonymous readers see published only", async () => {
    const r = await role<{ id: string }>("anon", "select id from posts");
    expect(r.rows.map((x) => x.id)).toEqual([post]);
  });
  it("ordinary accounts cannot see drafts or promote themselves", async () => {
    const r = await role<{ id: string }>(
      "authenticated",
      "select id from posts",
    );
    expect(r.rows.map((x) => x.id)).toEqual([post]);
    await expect(
      role(
        "authenticated",
        `insert into admins(user_id) values('${ordinary}')`,
      ),
    ).rejects.toThrow();
    await expect(
      role(
        "authenticated",
        `insert into posts(title,slug) values('Unauthorized post','unauthorized')`,
      ),
    ).rejects.toThrow();
  });
  it("admin can create and edit content, preserving revisions and redirects", async () => {
    await role(
      "authenticated",
      `update posts set slug='renamed-repair',title='Updated published repair' where id='${post}'`,
      admin,
    );
    const r = await db.query("select * from redirects");
    expect(r.rows).toHaveLength(1);
    expect((await db.query("select * from post_revisions")).rows).toHaveLength(
      1,
    );
  });
  it("rejects unverified publishing even with direct API access", async () => {
    await expect(
      role(
        "authenticated",
        `update posts set status='published' where id='${draft}'`,
        admin,
      ),
    ).rejects.toThrow();
  });
  it("public cannot invoke privileged engagement or read visitor identifiers", async () => {
    await expect(
      role("anon", `select set_like('${post}','${visitor}',true)`),
    ).rejects.toThrow();
    await expect(role("anon", "select * from page_views")).rejects.toThrow();
  });
  it("likes are idempotent and can be removed", async () => {
    await role("service_role", `select set_like('${post}','${visitor}',true)`);
    await role("service_role", `select set_like('${post}','${visitor}',true)`);
    expect(
      (
        await db.query<{ likes: number }>(
          `select likes from posts where id='${post}'`,
        )
      ).rows[0].likes,
    ).toBe(1);
    await role("service_role", `select set_like('${post}','${visitor}',false)`);
    expect(
      (
        await db.query<{ likes: number }>(
          `select likes from posts where id='${post}'`,
        )
      ).rows[0].likes,
    ).toBe(0);
  });
  it("refreshes count once per visitor per day and never count drafts", async () => {
    await role(
      "service_role",
      `select record_view('${post}','${visitor}','direct')`,
    );
    await role(
      "service_role",
      `select record_view('${post}','${visitor}','direct')`,
    );
    expect(
      (
        await db.query<{ views: number }>(
          `select views from posts where id='${post}'`,
        )
      ).rows[0].views,
    ).toBe(1);
    await expect(
      role(
        "service_role",
        `select record_view('${draft}','${visitor}','direct')`,
      ),
    ).rejects.toThrow();
  });
  it("rate limiter persists and stops excess requests", async () => {
    const q = "select consume_rate_limit('test',2,3600) as allowed";
    expect(
      (await role<{ allowed: boolean }>("service_role", q)).rows[0].allowed,
    ).toBe(true);
    await role("service_role", q);
    expect(
      (await role<{ allowed: boolean }>("service_role", q)).rows[0].allowed,
    ).toBe(false);
  });
  it("comments stay private until moderated and update aggregates", async () => {
    await role(
      "service_role",
      `insert into comments(post_id,name,body) values('${post}','Reader','It worked on my device')`,
    );
    expect((await role("anon", "select * from comments")).rows).toHaveLength(0);
    await role("authenticated", "update comments set status='approved'", admin);
    expect((await role("anon", "select * from comments")).rows).toHaveLength(1);
    expect(
      (
        await db.query<{ comment_count: number }>(
          `select comment_count from posts where id='${post}'`,
        )
      ).rows[0].comment_count,
    ).toBe(1);
  });
  it("admin dashboard returns statistics, ordinary users see no private data", async () => {
    const r = await role<{ dashboard_stats: { total: number } }>(
      "authenticated",
      "select dashboard_stats()",
      admin,
    );
    expect(r.rows[0].dashboard_stats.total).toBe(1);
    const other = await role<{ dashboard_stats: { unique: number } }>(
      "authenticated",
      "select dashboard_stats()",
    );
    expect(other.rows[0].dashboard_stats.unique).toBe(0);
  });
  it("indexes device, OS and tags and hides scheduled posts", async () => {
    await role(
      "authenticated",
      `update posts set tags=array['ventoy'],os='Windows eleven',device='Latitude' where id='${post}'`,
      admin,
    );
    const r = await role(
      "anon",
      "select id from posts where search_document @@ websearch_to_tsquery('english','ventoy')",
    );
    expect(r.rows).toHaveLength(1);
    await role(
      "authenticated",
      `update posts set published_at=now()+interval '1 day' where id='${post}'`,
      admin,
    );
    expect((await role("anon", "select * from posts")).rows).toHaveLength(0);
    await role(
      "authenticated",
      `update posts set published_at=now()-interval '1 day' where id='${post}'`,
      admin,
    );
  });
  it("converts a request once without copying private contact details", async () => {
    const id = "00000000-0000-4000-8000-000000000099";
    await role(
      "service_role",
      `insert into solution_requests(id,title,description,contact,consent) values('${id}','A device needs repair','Symptoms from the private request','private@example.invalid',true)`,
    );
    const query = `select convert_request('${id}','request-draft') as id`;
    await expect(role("authenticated", query)).rejects.toThrow();
    const first = await role<{ id: string }>("authenticated", query, admin);
    const second = await role<{ id: string }>("authenticated", query, admin);
    expect(first.rows[0].id).toBe(second.rows[0].id);
    const result = await db.query(
      `select * from posts where id='${first.rows[0].id}'`,
    );
    expect(JSON.stringify(result.rows)).not.toContain(
      "private@example.invalid",
    );
    await expect(
      role("anon", `select * from solution_requests`),
    ).rejects.toThrow();
  });
  it("preserves editorial dates when engagement changes", async () => {
    const before = await db.query<{ updated_at: Date }>(
      `select updated_at from posts where id='${post}'`,
    );
    await role("service_role", `select set_like('${post}','${visitor}',true)`);
    const after = await db.query<{ updated_at: Date }>(
      `select updated_at from posts where id='${post}'`,
    );
    expect(String(after.rows[0].updated_at)).toBe(
      String(before.rows[0].updated_at),
    );
  });
});

describe("explicit Data API permissions", () => {
  it("denies anonymous private tables and writes without relying on RLS alone", async () => {
    const r = await db.query<{ allowed: boolean }>(
      `select has_table_privilege('anon','public.posts','INSERT') or has_table_privilege('anon','public.solution_requests','SELECT') or has_table_privilege('authenticated','public.events','INSERT') or has_table_privilege('authenticated','public.likes','UPDATE') as allowed`,
    );
    expect(r.rows[0].allowed).toBe(false);
  });
  it("keeps future tables and functions unexposed", async () => {
    await db.exec(
      `create table public.future_private_test(id integer); create function public.future_private_function() returns integer language sql as $$select 1$$;`,
    );
    const r = await db.query<{ allowed: boolean }>(
      `select has_table_privilege('anon','public.future_private_test','SELECT') or has_function_privilege('anon','public.future_private_function()','EXECUTE') or has_function_privilege('authenticated','public.future_private_function()','EXECUTE') as allowed`,
    );
    expect(r.rows[0].allowed).toBe(false);
    await db.exec(
      "drop table public.future_private_test; drop function public.future_private_function()",
    );
  });
  it("indexes category and diagnostic alternatives", async () => {
    await role(
      "authenticated",
      `update posts set category='Firmware', alternatives='Synthetic capacitor diagnostic' where id='${post}'`,
      admin,
    );
    const r = await role(
      "anon",
      `select id from posts where search_document @@ websearch_to_tsquery('english','firmware capacitor')`,
    );
    expect(r.rows).toHaveLength(1);
  });
  it("rejects unreviewed listing images via direct database access", async () => {
    await expect(
      role(
        "authenticated",
        `insert into laptops(model,available,images) values('Synthetic listing',true,'[{"id":"${visitor}","alt":"Test image","reviewed":false}]')`,
        admin,
      ),
    ).rejects.toThrow();
  });
  it("keeps storage private with allowed types and size restrictions", async () => {
    const r = await db.query<{
      public: boolean;
      file_size_limit: number;
      allowed_mime_types: string[];
    }>(`select public,file_size_limit,allowed_mime_types from storage.buckets`);
    expect(r.rows).toHaveLength(3);
    expect(
      r.rows.every(
        (b) =>
          !b.public &&
          b.file_size_limit === 3145728 &&
          !b.allowed_mime_types.includes("image/svg+xml"),
      ),
    ).toBe(true);
  });
});

it("passes the deployable read-only database acceptance audit", async () => {
  await expect(
    db.exec(await readFile("supabase/verify.sql", "utf8")),
  ).resolves.toBeDefined();
});
