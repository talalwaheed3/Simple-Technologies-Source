import { randomUUID } from "node:crypto";
import { requestSchema } from "@/lib/validation";
import {
  apiError,
  originGuard,
  rateLimit,
  verifyChallenge,
} from "@/lib/security";
import { serviceDb } from "@/lib/supabase";
import { processImage } from "@/lib/images";
export async function POST(req: Request) {
  let uploaded: string | undefined;
  try {
    await originGuard(req);
    await rateLimit("request", 4);
    if (Number(req.headers.get("content-length")) > 4 * 1024 * 1024)
      throw new Error("Too large");
    const f = await req.formData();
    const d = requestSchema.parse({
      ...Object.fromEntries(f),
      consent: f.get("consent") === "on",
    });
    await verifyChallenge(d.token);
    const db = serviceDb(),
      id = randomUUID();
    const file = f.get("screenshot");
    if (file instanceof File && file.size) {
      const image = await processImage(file);
      uploaded = `${id}/${randomUUID()}.webp`;
      const { error } = await db.storage
        .from("request-media")
        .upload(uploaded, image.data, { contentType: "image/webp" });
      if (error) throw error;
    }
    const { website: _website, token: _token, ...body } = d;
    void _website;
    void _token;
    const { error } = await db
      .from("solution_requests")
      .insert({ ...body, id, screenshot_paths: uploaded ? [uploaded] : [] });
    if (error) throw error;
    return Response.json({ id }, { status: 201 });
  } catch (e) {
    if (uploaded)
      await serviceDb().storage.from("request-media").remove([uploaded]);
    return apiError(e);
  }
}
