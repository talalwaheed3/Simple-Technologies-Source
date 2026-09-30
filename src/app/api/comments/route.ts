import { commentSchema } from "@/lib/validation";
import {
  apiError,
  originGuard,
  rateLimit,
  verifyChallenge,
} from "@/lib/security";
import { serviceDb } from "@/lib/supabase";
export async function POST(req: Request) {
  try {
    await originGuard(req);
    await rateLimit("comment", 5);
    const d = commentSchema.parse(await req.json());
    await verifyChallenge(d.token);
    const db = serviceDb();
    const { data: post } = await db
      .from("posts")
      .select("id")
      .eq("id", d.post_id)
      .eq("status", "published")
      .lte("published_at", new Date().toISOString())
      .maybeSingle();
    if (!post) throw new Error("Unavailable");
    const { error } = await db
      .from("comments")
      .insert({
        post_id: d.post_id,
        name: d.name,
        body: d.body,
        status: "pending",
        is_admin: false,
      });
    if (error) throw error;
    return Response.json({ ok: true }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
