import { createClient } from "@supabase/supabase-js";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Missing target credentials");
const db = createClient(url, key, { auth: { persistSession: false } });
const before = new Date(Date.now() - 90 * 86400000).toISOString();
for (;;) {
  const { data, error } = await db
    .from("solution_requests")
    .select("id,screenshot_paths")
    .lt("created_at", before)
    .limit(100);
  if (error) throw error;
  if (!data.length) break;
  const paths = data.flatMap((r) => r.screenshot_paths as string[]);
  if (paths.length) {
    const { error } = await db.storage.from("request-media").remove(paths);
    if (error) throw error;
  }
  const { error: del } = await db
    .from("solution_requests")
    .delete()
    .in(
      "id",
      data.map((r) => r.id),
    );
  if (del) throw del;
}
const { error } = await db.rpc("cleanup_events");
if (error) throw error;
console.log(
  "Expired rate limits, 90-day analytics and old requests/attachments removed.",
);
