import { z } from "zod";
import { requireAdmin } from "@/lib/supabase";
import { apiError, originGuard } from "@/lib/security";
import { settings } from "@/lib/data";
import { revalidatePath } from "next/cache";
export async function POST(req: Request) {
  try {
    await originGuard(req);
    const { db } = await requireAdmin();
    const d = z
      .object({
        id: z.uuid(),
        status: z.enum(["approved", "hidden", "spam", "delete"]).optional(),
        reply: z.string().trim().min(3).max(3000).optional(),
      })
      .parse(await req.json());
    const { data: parent } = await db
      .from("comments")
      .select("post_id,parent_id")
      .eq("id", d.id)
      .single();
    if (!parent) throw new Error("Missing comment");
    if (d.reply) {
      const s = await settings();
      const { error } = await db
        .from("comments")
        .insert({
          post_id: parent.post_id,
          parent_id: parent.parent_id || d.id,
          name: s.admin_label,
          body: d.reply,
          status: "approved",
          is_admin: true,
        });
      if (error) throw error;
    } else {
      const q =
        d.status === "delete"
          ? db.from("comments").delete().eq("id", d.id)
          : db.from("comments").update({ status: d.status }).eq("id", d.id);
      const { error } = await q;
      if (error) throw error;
    }
    revalidatePath("/solutions", "layout");
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
