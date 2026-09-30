import { z } from "zod";
import { requireAdmin } from "@/lib/supabase";
import { apiError, originGuard } from "@/lib/security";
import { slugify } from "@/lib/validation";
export async function POST(req: Request) {
  try {
    await originGuard(req);
    const { db } = await requireAdmin();
    const d = z
      .object({
        id: z.uuid(),
        convert: z.boolean().optional(),
        status: z
          .enum([
            "new",
            "reviewing",
            "need_more_information",
            "solved",
            "converted",
            "closed",
          ])
          .optional(),
      })
      .parse(await req.json());
    if (d.convert) {
      const { data: r, error } = await db
        .from("solution_requests")
        .select("*")
        .eq("id", d.id)
        .single();
      if (error) throw error;
      if (r.post_id) return Response.json({ post_id: r.post_id });
      const { data: pid, error: pe } = await db.rpc("convert_request", {
        p_id: r.id,
        p_slug: slugify(r.title).slice(0, 170) + "-" + r.id.slice(0, 8),
      });
      if (pe) throw pe;
      return Response.json({ post_id: pid });
    }
    const { error } = await db
      .from("solution_requests")
      .update({ status: d.status })
      .eq("id", d.id);
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
