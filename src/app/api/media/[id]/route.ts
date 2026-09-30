import { z } from "zod";
import { requireAdmin, serviceDb } from "@/lib/supabase";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    z.uuid().parse(id);
    const preview = new URL(req.url).searchParams.get("preview") === "1";
    const db = preview ? (await requireAdmin()).db : serviceDb();
    const { data: media, error: mediaError } = await db
      .from("media")
      .select("path")
      .eq("id", id)
      .maybeSingle();
    if (mediaError) throw mediaError;
    if (!media) return new Response(null, { status: 404 });
    if (!preview) {
      const { data, error: postError } = await db
        .from("posts")
        .select("id")
        .eq("status", "published")
        .lte("published_at", new Date().toISOString())
        // This is a JSONB array, not a Postgres array. Preserve JSON encoding.
        .contains("screenshots", JSON.stringify([{ id, reviewed: true }]))
        .limit(1);
      if (postError) throw postError;
      if (!data?.length) {
        const { data: laptops, error: laptopError } = await db
          .from("laptops")
          .select("id")
          .eq("available", true)
          .contains("images", JSON.stringify([{ id, reviewed: true }]))
          .limit(1);
        if (laptopError) throw laptopError;
        if (!laptops?.length) return new Response(null, { status: 404 });
      }
    }
    const { data, error } = await db.storage
      .from("article-media")
      .download(
        ["480", "960"].includes(new URL(req.url).searchParams.get("w") || "")
          ? `${id}/${new URL(req.url).searchParams.get("w")}.webp`
          : media.path,
      );
    if (error || !data) return new Response(null, { status: 404 });
    return new Response(data, {
      headers: {
        "Content-Type": "image/webp",
        // Re-check publication/privacy on every request, including after unpublishing.
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        ...(preview ? { "X-Robots-Tag": "noindex, nofollow" } : {}),
      },
    });
  } catch (error) {
    if (
      error instanceof z.ZodError ||
      (error instanceof Error &&
        ["Unauthorized", "Forbidden"].includes(error.message))
    )
      return new Response(null, { status: 404 });
    const code =
      error && typeof error === "object" && "code" in error
        ? String(error.code)
        : undefined;
    console.warn("Image lookup failed", {
      code: code && /^[A-Z0-9_]{1,32}$/.test(code) ? code : undefined,
    });
    return new Response(null, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
