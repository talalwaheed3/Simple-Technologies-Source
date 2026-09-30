import { z } from "zod";
import { serviceDb } from "@/lib/supabase";
import { apiError, originGuard, rateLimit, visitor } from "@/lib/security";
const schema = z.object({
  kind: z.enum(["view", "like", "search", "feedback_yes", "feedback_no"]),
  post_id: z.uuid().optional(),
  active: z.boolean().optional(),
  source: z.string().max(2000).optional(),
  query: z.string().max(200).optional(),
  result_count: z.number().int().min(0).max(1000000).optional(),
});
export async function POST(req: Request) {
  try {
    await originGuard(req);
    await rateLimit("engagement", 180);
    const d = schema.parse(await req.json());
    const id = await visitor(),
      db = serviceDb();
    if (d.kind !== "search" && !d.post_id) throw new Error("Missing post");
    if (d.kind === "view") {
      let source = "direct";
      try {
        source = new URL(d.source || "").hostname;
      } catch {}
      const { error } = await db.rpc("record_view", {
        p_post: d.post_id,
        p_visitor: id,
        p_source: source,
      });
      if (error) throw error;
      const [{ data: p }, { data: l }] = await Promise.all([
        db.from("posts").select("likes").eq("id", d.post_id).single(),
        db
          .from("likes")
          .select("post_id")
          .eq("post_id", d.post_id)
          .eq("visitor_id", id)
          .maybeSingle(),
      ]);
      return Response.json({ likes: p?.likes || 0, liked: !!l });
    }
    if (d.kind === "like") {
      if (typeof d.active !== "boolean") throw new Error("Missing like state");
      const { data, error } = await db.rpc("set_like", {
        p_post: d.post_id,
        p_visitor: id,
        p_active: d.active,
      });
      if (error) throw error;
      return Response.json(data);
    }
    if (d.post_id) {
      const { data } = await db
        .from("posts")
        .select("id")
        .eq("id", d.post_id)
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        .maybeSingle();
      if (!data) throw new Error("Unavailable");
    }
    let query = (d.query || "")
      .replace(/[\w.+-]+@[\w.-]+\.[a-z]+/gi, "[email removed]")
      .replace(/\b\d{7,}\b/g, "[number removed]");
    query = query.slice(0, 200);
    const { error } = await db
      .from("events")
      .insert({
        kind: d.kind,
        post_id: d.post_id,
        visitor_id: id,
        query,
        result_count: d.result_count,
      });
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
