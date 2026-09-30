import { randomUUID } from "node:crypto";
import { requireAdmin } from "@/lib/supabase";
import { ActionError, apiError, originGuard } from "@/lib/security";
import { processImage } from "@/lib/images";
export async function POST(req: Request) {
  try {
    await originGuard(req);
    const { db } = await requireAdmin();
    if (Number(req.headers.get("content-length")) > 4 * 1024 * 1024)
      throw new ActionError("This upload exceeds the 3 MiB image limit.", 413);
    const f = await req.formData(),
      file = f.get("file");
    if (!(file instanceof File))
      throw new ActionError("Choose an image to upload.");
    const image = await processImage(file),
      id = randomUUID(),
      path = `${id}/optimized.webp`,
      original_path = `${id}/original.${image.ext}`;
    const uploaded: { bucket: string; path: string }[] = [];
    try {
      for (const item of [
        {
          bucket: "original-media",
          path: original_path,
          data: image.original,
          type: file.type,
        },
        { bucket: "article-media", path, data: image.data, type: "image/webp" },
        ...image.variants.map((v) => ({
          bucket: "article-media",
          path: `${id}/${v.width}.webp`,
          data: v.data,
          type: "image/webp",
        })),
      ]) {
        const { error } = await db.storage
          .from(item.bucket)
          .upload(item.path, item.data, { contentType: item.type });
        if (error) throw error;
        uploaded.push(item);
      }
      const { error } = await db.from("media").insert({
        id,
        path,
        original_path,
        width: image.width,
        height: image.height,
      });
      if (error) throw error;
    } catch (error) {
      const cleanup = await Promise.allSettled(
        uploaded.map((item) =>
          db.storage.from(item.bucket).remove([item.path]),
        ),
      );
      if (
        cleanup.some(
          (result) => result.status === "rejected" || result.value.error,
        )
      )
        console.warn("Image upload cleanup incomplete", { mediaId: id });
      throw error;
    }
    return Response.json({
      id,
      path,
      width: image.width,
      height: image.height,
    });
  } catch (e) {
    return apiError(e, "upload image");
  }
}
