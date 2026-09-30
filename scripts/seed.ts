import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { postSchema } from "../src/lib/validation";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
  key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key)
  throw new Error(
    "Load the target project URL and server secret via environment; never commit them.",
  );
const db = createClient(url, key, { auth: { persistSession: false } });
const posts = JSON.parse(
  await readFile(new URL("../content/posts.json", import.meta.url), "utf8"),
);
const cases = JSON.parse(
  await readFile(
    new URL("../content/case-inventory.json", import.meta.url),
    "utf8",
  ),
);
for (const item of posts) {
  const record = postSchema.parse(item);
  if (record.status === "published")
    throw new Error("The initial seed must not publish unverified history");
  const { error } = await db
    .from("posts")
    .upsert(record, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
}
for (const record of cases) {
  const { error } = await db
    .from("case_inventory")
    .upsert(record, { onConflict: "id", ignoreDuplicates: true });
  if (error) throw error;
}
console.log(
  `Imported ${posts.length} private drafts and ${cases.length} cases. Existing records were preserved.`,
);
