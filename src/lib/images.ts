import "server-only";
import sharp from "sharp";
import { ActionError } from "./action-error";
export async function processImage(file: File) {
  if (file.size > 3 * 1024 * 1024)
    throw new ActionError("This image exceeds the 3 MiB limit.", 413);
  if (file.size === 0) throw new ActionError("The selected image is empty.");
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type))
    throw new ActionError("Choose a JPEG, PNG or WebP image.");
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const decoder = sharp(input, {
      limitInputPixels: 25000000,
      animated: false,
    });
    const meta = await decoder.metadata();
    if (!["jpeg", "png", "webp"].includes(meta.format || ""))
      throw new ActionError("The file is not a valid JPEG, PNG or WebP image.");
    if (`image/${meta.format}` !== file.type)
      throw new ActionError(
        "The image contents do not match its file type. Export it as JPEG, PNG or WebP and try again.",
      );
    const { data, info } = await decoder
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    const variants = await Promise.all(
      [480, 960].map(async (width) => ({
        width,
        data: await sharp(data)
          .resize({ width, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer(),
      })),
    );
    return {
      data,
      width: info.width,
      height: info.height,
      original: input,
      ext: meta.format,
      variants,
    };
  } catch (error) {
    if (error instanceof ActionError) throw error;
    throw new ActionError(
      "This image could not be decoded. Use an undamaged JPEG, PNG or WebP with no more than 25 million pixels.",
    );
  }
}
