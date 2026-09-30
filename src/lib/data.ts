import "server-only";
import { cache } from "react";
import { configured, publicDb } from "./supabase";
import type { Post, PostSummary, Settings, Comment } from "./types";
const summaryColumns =
  "id,title,slug,excerpt,device,category,status,published_at,views,likes";
export const siteUrl = () =>
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
export const settings = cache(async (): Promise<Settings> => {
  const base = {
    brand: "Simple Technologies",
    support_url: "",
    whatsapp: "",
    email: "",
    booking_url: "",
    admin_label: "Simple Technologies / Technician",
    description: "Practical troubleshooting from the repair bench.",
  };
  if (!configured()) return base;
  const { data, error } = await publicDb({
    revalidate: 300,
    tags: ["site-settings"],
  })
    .from("site_settings")
    .select("value")
    .eq("id", 1)
    .single();
  if (error) throw new Error("Could not load site settings");
  return { ...base, ...data.value };
});
export async function posts(
  filters: {
    q?: string;
    category?: string;
    os?: string;
    device?: string;
    tag?: string;
    sort?: string;
    page?: number;
  } = {},
) {
  if (!configured()) return { posts: [] as PostSummary[], count: 0 };
  const db = publicDb();
  let query = db
    .from("posts")
    .select(summaryColumns, { count: "exact" })
    .eq("status", "published")
    .lte("published_at", new Date().toISOString());
  if (filters.q)
    query = query.textSearch("search_document", filters.q, {
      type: "websearch",
      config: "english",
    });
  if (filters.category) query = query.eq("category", filters.category);
  if (filters.os)
    query = query.ilike("os", `%${filters.os.replace(/[%_]/g, "")}%`);
  if (filters.device)
    query = query.ilike("device", `%${filters.device.replace(/[%_]/g, "")}%`);
  if (filters.tag) query = query.contains("tags", [filters.tag]);
  const sort =
    filters.sort === "views"
      ? "views"
      : filters.sort === "likes"
        ? "likes"
        : "published_at";
  const offset = ((filters.page || 1) - 1) * 12;
  const { data, error, count } = await query
    .order(sort, { ascending: false })
    .order("id")
    .range(offset, offset + 11);
  // PostgREST returns 416 (PGRST103), rather than [], when a counted
  // range starts beyond the result set. Let the page render its normal 404.
  if (error?.code === "PGRST103" && offset > 0)
    return { posts: [] as PostSummary[], count: count || 0 };
  if (error) throw new Error("Could not load solutions");
  return { posts: (data || []) as PostSummary[], count: count || 0 };
}
export const homePosts = cache(async () => {
  if (!configured()) return [] as PostSummary[];
  const db = publicDb();
  const results = await Promise.all(
    ["published_at", "views", "likes"].map((order) =>
      db
        .from("posts")
        .select(summaryColumns)
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .order(order, { ascending: false })
        .order("id")
        .limit(12),
    ),
  );
  if (results.some((r) => r.error)) throw new Error("Could not load solutions");
  return [
    ...new Map(
      results
        .flatMap((r) => (r.data || []) as PostSummary[])
        .map((p) => [p.id, p]),
    ).values(),
  ];
});
export const getPost = cache(async (slug: string) => {
  if (!configured()) return null;
  const { data, error } = await publicDb()
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error("Could not load solution");
  return data as Post | null;
});
export async function getComments(id: string) {
  if (!configured()) return [];
  const { data, error } = await publicDb()
    .from("comments")
    .select("id,post_id,parent_id,name,body,status,is_admin,created_at")
    .eq("post_id", id)
    .eq("status", "approved")
    .order("created_at")
    .limit(200);
  if (error) throw new Error("Could not load comments");
  return data as Comment[];
}
export async function related(post: Post) {
  if (!configured()) return [];
  const db = publicDb();
  const now = new Date().toISOString();
  const [manual, fallback] = await Promise.all([
    post.related_ids.length
      ? db
          .from("posts")
          .select(summaryColumns)
          .in("id", post.related_ids)
          .eq("status", "published")
          .lte("published_at", now)
          .neq("id", post.id)
      : Promise.resolve({ data: [], error: null }),
    db
      .from("posts")
      .select(summaryColumns)
      .eq("category", post.category)
      .neq("id", post.id)
      .eq("status", "published")
      .lte("published_at", now)
      .order("published_at", { ascending: false })
      .order("id")
      .limit(4),
  ]);
  if (manual.error || fallback.error)
    throw new Error("Could not load related solutions");
  return [
    ...new Map(
      [...(manual.data || []), ...(fallback.data || [])].map((p) => [
        p.id,
        p as PostSummary,
      ]),
    ).values(),
  ].slice(0, 3);
}
export function jsonLd(value: unknown) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

export async function engagementTotal() {
  if (!configured()) return 0;
  const { data, error } = await publicDb().rpc("engagement_total");
  if (error) throw error;
  return Number(data);
}
