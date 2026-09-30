import { requireAdmin } from "@/lib/supabase";
import { postSchema } from "@/lib/validation";
import { ActionError, apiError, originGuard } from "@/lib/security";
import { revalidatePath } from "next/cache";
export async function POST(req: Request) {
  try {
    await originGuard(req);
    const { db } = await requireAdmin();
    const input = await req.json();
    if (input && input.status === "published" && !input.published_at)
      input.published_at = new Date().toISOString();
    const { expected_updated_at, ...d } = postSchema.parse(input);
    if (d.screenshots.length) {
      const { data: media, error: mediaError } = await db
        .from("media")
        .select("id,path")
        .in(
          "id",
          d.screenshots.map((s) => s.id),
        );
      if (mediaError) throw mediaError;
      if (
        d.screenshots.some(
          (s) => !media?.some((m) => m.id === s.id && m.path === s.path),
        )
      )
        throw new ActionError(
          "An attached image is no longer available. Remove that entry and upload it again.",
          400,
          {
            screenshots: [
              "One or more image records do not match the uploaded files.",
            ],
          },
        );
    }
    const query =
      d.id && expected_updated_at
        ? db
            .from("posts")
            .update(d)
            .eq("id", d.id)
            .eq("updated_at", expected_updated_at)
        : db.from("posts").upsert(d);
    const { data, error } = await query
      .select("id,slug,published_at,updated_at")
      .maybeSingle();
    if (error?.code === "23505")
      throw new ActionError(
        "That URL slug is already in use. Choose another slug.",
        409,
        { slug: ["Choose a unique URL slug."] },
      );
    if (error) throw error;
    if (!data)
      throw new ActionError(
        "This article changed after you opened it. Your working copy is preserved. Reopen the latest article before applying your edits.",
        409,
      );
    [
      "/",
      "/solutions",
      "/sitemap.xml",
      "/rss.xml",
      `/solutions/${data.slug}`,
    ].forEach((p) => revalidatePath(p));
    return Response.json(data);
  } catch (e) {
    return apiError(e, "save article");
  }
}
