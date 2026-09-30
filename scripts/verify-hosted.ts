/** Opt-in acceptance test. Creates and cleans up only its own labelled fixtures. */
import env from "@next/env";
import { createClient } from "@supabase/supabase-js";
import { chromium, expect } from "@playwright/test";
import { randomUUID, createHash, createHmac } from "node:crypto";
import sharp from "sharp";
import { blankPost } from "../src/lib/types";

env.loadEnvConfig(process.cwd());
if (process.env.VERIFY_HOSTED !== "1")
  throw new Error(
    "Set VERIFY_HOSTED=1 to permit temporary hosted test records.",
  );
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
if (url !== "https://plwapcnzdjkzsrnawdjl.supabase.co")
  throw new Error("Unexpected Supabase project; no changes made.");
const origin = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const db = createClient(url, process.env.SUPABASE_SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(
  url,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { persistSession: false } },
);
const run = randomUUID();
const prefix = `codex-verification-${run}`;
const testIp = `2001:db8:${run.slice(0, 4)}:${run.slice(4, 8)}::1`;
const testDay = new Date().toISOString().slice(0, 10);
const postIds = new Set<string>();
const mediaIds = new Set<string>();
const requestIds = new Set<string>();
const users: string[] = [];
const failures: string[] = [];
function check(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
async function rows(table: string) {
  const { data, error } = await db.from(table).select("*");
  if (error) throw new Error(`Cannot inspect ${table}: ${error.code}`);
  return data;
}
const baseline = await rows("posts");
const fingerprint = (data: unknown) =>
  createHash("sha256").update(JSON.stringify(data)).digest("hex");
const original = new Map(baseline.map((p) => [String(p.id), fingerprint(p)]));
console.log(
  "Existing article counts",
  baseline.reduce(
    (a: Record<string, number>, p) => ({
      ...a,
      [String(p.status)]: (a[String(p.status)] || 0) + 1,
    }),
    {},
  ),
);
const buckets = await db.storage.listBuckets();
check(!buckets.error, "Cannot inspect buckets");
console.log(
  "Bucket configuration",
  buckets.data.map((b) => ({
    name: b.name,
    public: b.public,
    limit: b.file_size_limit,
    types: b.allowed_mime_types,
  })),
);
for (const name of ["article-media", "original-media", "request-media"]) {
  const bucket = buckets.data.find((b) => b.name === name);
  check(
    bucket && !bucket.public && bucket.file_size_limit === 3145728,
    `Unexpected bucket configuration: ${name}`,
  );
}
const browser = await chromium.launch({
  executablePath:
    process.env.PLAYWRIGHT_CHROMIUM_PATH || "/usr/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const admin = await browser.newContext({
  baseURL: origin,
  extraHTTPHeaders: { "x-forwarded-for": testIp },
  timezoneId: "Asia/Karachi",
});
const publicContext = await browser.newContext({
  baseURL: origin,
  extraHTTPHeaders: { "x-forwarded-for": testIp },
});
const page = await admin.newPage();
const pageErrors: string[] = [];
page.on("pageerror", (error) => pageErrors.push(error.message));
// Only fixture articles may generate engagement during browser verification.
await admin.route("**/api/engagement", (route) =>
  route.fulfill({ json: { ok: true, likes: 0, liked: false } }),
);
async function post(path: string, data: unknown, status = 200) {
  const response = await admin.request.post(path, {
    headers: { origin },
    data,
  });
  const body = await response.json();
  check(
    response.status() === status,
    `${path}: expected ${status}, got ${response.status()} (${JSON.stringify(body)})`,
  );
  return body;
}
async function account(allowAdmin: boolean) {
  const email = `${prefix}-${allowAdmin ? "admin" : "reader"}@example.invalid`;
  const password = randomUUID() + randomUUID();
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  check(!error && data.user, "Temporary test account creation failed");
  users.push(data.user.id);
  if (allowAdmin) {
    const { error: insertError } = await db
      .from("admins")
      .insert({ user_id: data.user.id });
    check(!insertError, "Temporary admin allowlist failed");
  }
  return { email, password };
}
async function saved(id: string) {
  const { data, error } = await db
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();
  check(!error && data, "Saved fixture not found");
  return data;
}
try {
  check(
    (
      await publicContext.request.post("/api/admin/posts", {
        headers: { origin },
        data: {},
      })
    ).status() === 401,
    "Anonymous save must be rejected",
  );
  check(
    (
      await publicContext.request.post("/api/admin/media", {
        headers: { origin },
      })
    ).status() === 401,
    "Anonymous upload must be rejected",
  );
  check(
    (
      await publicContext.request.post("/api/admin/posts", {
        headers: { origin: "https://attacker.invalid" },
        data: {},
      })
    ).status() === 403,
    "Cross-origin save must be rejected",
  );
  const ordinary = await account(false);
  await post("/api/auth", ordinary, 403);
  const credentials = await account(true);
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(credentials.email);
  await page.getByLabel("Password", { exact: true }).fill(credentials.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/?$/, { timeout: 30000 });
  await expect(
    page.getByRole("heading", { name: "Your workbench", exact: true }),
  ).toBeVisible();
  await page.goto("/admin/posts/new");
  await page.locator("header .brand").click();
  await expect(page).toHaveURL(/\/admin\/?$/);
  await page.goto("/admin/posts/new");
  console.log(
    "PASS: login, ordinary/anonymous rejection, origin checks, admin header navigation",
  );

  const id = randomUUID();
  postIds.add(id);
  const fixture = {
    ...blankPost,
    id,
    title: `TEST ONLY ${prefix}`,
    slug: prefix,
    status: "needs_verification",
    published_at: "2026-09-24T07:00:00+00:00",
  };
  let result = await post("/api/admin/posts", fixture);
  check(result.updated_at, "Save must return concurrency timestamp");
  const png = await sharp({
    create: { width: 24, height: 16, channels: 3, background: "#127070" },
  })
    .png()
    .toBuffer();
  const jpeg = await sharp(png).jpeg().toBuffer();
  const webp = await sharp(png).webp().toBuffer();
  for (const [mime, bytes] of [
    ["image/png", png],
    ["image/jpeg", jpeg],
    ["image/webp", webp],
  ] as const) {
    const response = await admin.request.post("/api/admin/media", {
      headers: { origin },
      multipart: {
        file: {
          name: `test.${mime.split("/")[1]}`,
          mimeType: mime,
          buffer: bytes,
        },
      },
    });
    const body = await response.json();
    check(response.ok(), `Image upload failed: ${JSON.stringify(body)}`);
    mediaIds.add(body.id);
  }
  const media = await db
    .from("media")
    .select("*")
    .in("id", [...mediaIds]);
  check(
    !media.error && media.data?.length === 3,
    "Three media records must persist",
  );
  const shots = media.data.map((m) => ({
    id: m.id,
    path: m.path,
    width: m.width,
    height: m.height,
    alt: "",
    caption: "",
    reviewed: false,
  }));
  result = await post("/api/admin/posts", {
    ...fixture,
    screenshots: shots,
    expected_updated_at: result.updated_at,
  });
  for (const shot of shots) {
    check(
      (await admin.request.get(`/api/media/${shot.id}?preview=1`)).ok(),
      "Admin image preview must work",
    );
    check(
      (await publicContext.request.get(`/api/media/${shot.id}`)).status() ===
        404,
      "Unpublished image must remain private",
    );
    check(
      (
        await publicContext.request.get(`/api/media/${shot.id}?preview=1`)
      ).status() === 404,
      "Anonymous preview must fail",
    );
  }
  const originalImage = await anon.storage
    .from("original-media")
    .download(media.data[0].original_path);
  check(
    !!originalImage.error,
    "Original files must remain inaccessible anonymously",
  );
  for (const [mime, bytes, expected] of [
    ["image/svg+xml", Buffer.from("<svg/>"), 400],
    ["image/png", Buffer.from("not an image"), 400],
    ["image/png", Buffer.alloc(3145729), 413],
  ] as const) {
    const response = await admin.request.post("/api/admin/media", {
      headers: { origin },
      multipart: {
        file: { name: "invalid-file", mimeType: mime, buffer: bytes },
      },
    });
    check(
      response.status() === expected && (await response.json()).error,
      "Invalid upload needs actionable rejection",
    );
  }
  console.log(
    "PASS: offset timestamp, private unverified draft, JPEG/PNG/WebP uploads, preview, privacy and invalid-file rejection",
  );

  await page.goto(`/admin/posts/${id}`);
  await expect(page.getByLabel("Problem title")).toHaveValue(fixture.title);
  await expect(page.getByLabel("Alt text", { exact: true })).toHaveCount(3);
  check(
    (await page
      .getByLabel("Publish date (optional, local time)")
      .inputValue()) === "2026-09-24T12:00",
    "Karachi local time must display accurately",
  );
  await page
    .getByLabel("Alt text", { exact: true })
    .nth(0)
    .fill("Synthetic green test image");
  await page
    .getByLabel("Caption", { exact: true })
    .nth(0)
    .fill("Temporary verification fixture");
  await page
    .getByRole("button", { name: "Move down", exact: true })
    .nth(0)
    .click();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("status", { name: "Save status" })).toHaveText(
    /Saved|Draft autosaved/,
    { timeout: 20000 },
  );
  await page.reload();
  await expect(page.getByLabel("Alt text", { exact: true }).nth(1)).toHaveValue(
    "Synthetic green test image",
  );
  await expect(page.getByLabel("Caption", { exact: true }).nth(1)).toHaveValue(
    "Temporary verification fixture",
  );
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(
    page.getByText("Private preview · needs_verification"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to editor" }).click();
  await page
    .getByRole("button", { name: "Remove", exact: true })
    .nth(2)
    .click();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(page.getByRole("status", { name: "Save status" })).toHaveText(
    /Saved|Draft autosaved/,
  );
  let latest = await saved(id);
  check(latest.screenshots.length === 2, "Image removal must persist");
  const bad = await post(
    "/api/admin/posts",
    { ...latest, published_at: "not-a-date" },
    400,
  );
  check(bad.fields?.published_at, "Date validation should identify the field");
  const conflictBase = latest.updated_at;
  await post("/api/admin/posts", {
    ...latest,
    excerpt: "Updated fixture",
    expected_updated_at: conflictBase,
  });
  await post(
    "/api/admin/posts",
    { ...latest, expected_updated_at: conflictBase },
    409,
  );
  latest = await saved(id);
  const rejected = await post(
    "/api/admin/posts",
    { ...latest, status: "published" },
    400,
  );
  check(
    rejected.fields?.verified && rejected.fields?.["screenshots.0.reviewed"],
    "Publication review errors must be field-specific",
  );
  console.log(
    "PASS: editor reopen, timezone display, ordering/caption/removal persistence, preview, field errors and stale-save conflict",
  );

  const publishable = {
    ...latest,
    excerpt: "Temporary automated acceptance fixture; not technical guidance.",
    steps:
      "This synthetic fixture verifies the application's publishing workflow.",
    verification:
      "Automated application test only. No repair outcome is asserted.",
    verified: true,
    screenshots: latest.screenshots.map((s: object) => ({
      ...s,
      reviewed: true,
      alt: "Synthetic test image",
    })),
  };
  await post("/api/admin/posts", {
    ...publishable,
    status: "published",
    published_at: "2099-01-01T00:00:00Z",
  });
  check(
    (await publicContext.request.get(`/solutions/${prefix}`)).status() === 404,
    "Scheduled article must be private",
  );
  await post("/api/admin/posts", {
    ...publishable,
    status: "published",
    published_at: new Date(Date.now() - 60000).toISOString(),
  });
  check(
    (await publicContext.request.get(`/solutions/${prefix}`)).ok(),
    "Published article must be readable",
  );
  check(
    (await publicContext.request.get(`/api/media/${shots[0].id}`)).ok(),
    "Published reviewed image must be publicly readable",
  );
  for (const kind of ["view", "view", "like"] as const) {
    const response = await publicContext.request.post("/api/engagement", {
      headers: { origin },
      data: { kind, post_id: id, ...(kind === "like" ? { active: true } : {}) },
    });
    check(response.ok(), "Fixture engagement failed");
  }
  latest = await saved(id);
  check(
    latest.views === 1 && latest.likes === 1,
    "Views must deduplicate and likes persist",
  );
  const commentResponse = await publicContext.request.post("/api/comments", {
    headers: { origin },
    data: {
      post_id: id,
      name: "TEST ONLY",
      body: "Synthetic moderation fixture",
      website: "",
    },
  });
  check(commentResponse.status() === 201, "Comment submission failed");
  const comment = await db
    .from("comments")
    .select("id,status")
    .eq("post_id", id)
    .single();
  check(comment.data?.status === "pending", "Comment must start pending");
  await post("/api/admin/comments", {
    id: comment.data.id,
    status: "approved",
  });
  await post("/api/admin/comments", {
    id: comment.data.id,
    reply: "Synthetic technician reply",
  });
  check(
    (await anon.from("comments").select("id").eq("post_id", id)).data
      ?.length === 2,
    "Approved comment and reply should be public",
  );
  await post("/api/admin/comments", { id: comment.data.id, status: "hidden" });
  await post("/api/admin/posts", { ...(await saved(id)), status: "draft" });
  check(
    (await publicContext.request.get(`/api/media/${shots[0].id}`)).status() ===
      404,
    "Unpublishing must revoke public image access",
  );
  console.log(
    "PASS: schedule, publish, anonymous article/image, fixture views/likes, moderation/reply, unpublish",
  );

  const response = await publicContext.request.post("/api/requests", {
    headers: { origin },
    multipart: {
      title: `TEST ONLY ${prefix}`,
      description:
        "Synthetic request for application verification; please ignore.",
      device: "Test fixture",
      os: "Test",
      error_message: "",
      tried: "",
      contact: "",
      consent: "on",
      screenshot: { name: "fixture.png", mimeType: "image/png", buffer: png },
    },
  });
  check(
    response.status() === 201,
    `Request submission failed (${response.status()})`,
  );
  const request = await response.json();
  requestIds.add(request.id);
  check(
    (await admin.request.get(`/api/admin/request-image?id=${request.id}`)).ok(),
    "Request image must work for admin",
  );
  check(
    (
      await publicContext.request.get(
        `/api/admin/request-image?id=${request.id}`,
      )
    ).status() === 401,
    "Request image must stay private",
  );
  await post("/api/admin/requests", { id: request.id, status: "reviewing" });
  const converted = await post("/api/admin/requests", {
    id: request.id,
    convert: true,
  });
  postIds.add(converted.post_id);
  check(
    (await post("/api/admin/requests", { id: request.id, convert: true }))
      .post_id === converted.post_id,
    "Conversion must be idempotent",
  );
  for (const path of [
    "/admin",
    "/admin/comments",
    "/admin/requests",
    "/admin/settings",
  ]) {
    const response = await page.goto(path);
    check(response?.ok(), `Admin page failed: ${path}`);
  }
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto(`/admin/posts/${id}`);
  check(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "Admin editor must fit mobile width",
  );
  await page.screenshot({
    path: "/tmp/simple-tech-admin-mobile.png",
    fullPage: true,
  });
  await page.goto("/admin/settings");
  await page.evaluate(() =>
    localStorage.setItem("st_draft_test_only", "unsaved fixture"),
  );
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  check(
    (await page.evaluate(() => localStorage.getItem("st_draft_test_only"))) ===
      "unsaved fixture",
    "Sign out must retain working copies",
  );
  check(
    (
      await admin.request.post("/api/admin/posts", {
        headers: { origin },
        data: fixture,
      })
    ).status() === 401,
    "Signed-out save must fail",
  );
  check(
    pageErrors.length === 0,
    `Browser runtime errors: ${pageErrors.join("; ")}`,
  );
  console.log(
    "PASS: request with private image, status/conversion, admin pages, mobile layout, logout, browser runtime",
  );
} catch (error) {
  failures.push(
    error instanceof Error ? error.message : "Unknown test failure",
  );
} finally {
  await admin.request
    .delete("/api/auth", { headers: { origin } })
    .catch(() => {});
  await browser.close();
  async function clean(
    label: string,
    operation: PromiseLike<{ error: unknown }>,
  ) {
    try {
      const { error } = await operation;
      if (error) failures.push(`Cleanup failed: ${label}`);
    } catch {
      failures.push(`Cleanup failed: ${label}`);
    }
  }
  for (const id of requestIds) {
    const { data } = await db
      .from("solution_requests")
      .select("screenshot_paths")
      .eq("id", id)
      .single();
    if (data?.screenshot_paths.length)
      await clean(
        "request files",
        db.storage.from("request-media").remove(data.screenshot_paths),
      );
    await clean("request", db.from("solution_requests").delete().eq("id", id));
  }
  for (const id of postIds) {
    await clean("fixture events", db.from("events").delete().eq("post_id", id));
    await clean("fixture post", db.from("posts").delete().eq("id", id));
  }
  for (const id of mediaIds) {
    const { data } = await db
      .from("media")
      .select("original_path,path")
      .eq("id", id)
      .single();
    if (data) {
      await clean(
        "original image",
        db.storage.from("original-media").remove([data.original_path]),
      );
      await clean(
        "derived images",
        db.storage
          .from("article-media")
          .remove([data.path, `${id}/480.webp`, `${id}/960.webp`]),
      );
    }
    await clean("media record", db.from("media").delete().eq("id", id));
  }
  for (const id of users)
    await clean("test account", db.auth.admin.deleteUser(id));
  for (const scope of ["login", "engagement", "comment", "request"]) {
    const key = createHmac("sha256", process.env.VISITOR_SECRET!)
      .update(`${scope}:${testDay}:${testIp}`)
      .digest("hex");
    await clean(
      "test rate limit",
      db.from("rate_limits").delete().eq("key", key),
    );
  }
  const after = await rows("posts");
  if (
    after.length !== original.size ||
    after.some((p) => original.get(String(p.id)) !== fingerprint(p))
  )
    failures.push(
      "Existing article state changed during verification; inspect concurrent user changes.",
    );
  else
    console.log(
      `PASS: ${original.size} existing articles unchanged; temporary fixtures removed`,
    );
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else console.log("Hosted acceptance verification passed.");
