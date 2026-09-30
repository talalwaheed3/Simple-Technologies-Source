import { z } from "zod";
import { requireAdmin } from "@/lib/supabase";
import { apiError } from "@/lib/security";
export async function GET(req: Request) {
  try {
    const { db } = await requireAdmin();
    const id = z.uuid().parse(new URL(req.url).searchParams.get("id"));
    const { data: r } = await db
      .from("solution_requests")
      .select("screenshot_paths")
      .eq("id", id)
      .single();
    if (!r?.screenshot_paths[0]) return new Response(null, { status: 404 });
    const { data, error } = await db.storage
      .from("request-media")
      .download(r.screenshot_paths[0]);
    if (error) throw error;
    return new Response(data, {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
