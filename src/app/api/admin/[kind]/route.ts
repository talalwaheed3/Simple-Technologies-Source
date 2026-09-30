import { z } from "zod";
import { requireAdmin } from "@/lib/supabase";
import { ActionError, apiError, originGuard } from "@/lib/security";
import { shotSchema, safeUrl } from "@/lib/validation";
import { revalidatePath } from "next/cache";
const text = z.string().max(2000);
const url = z
  .string()
  .max(2000)
  .refine((s) => !!safeUrl(s));
export async function POST(
  req: Request,
  { params }: { params: Promise<{ kind: string }> },
) {
  try {
    await originGuard(req);
    const { db } = await requireAdmin(),
      { kind } = await params;
    const raw = await req.json();
    let body;
    if (kind === "affiliates") {
      body = z
        .object({
          id: z.uuid().optional(),
          name: text.min(2),
          destination: url,
          affiliate_destination: z.union([url, z.literal("")]),
          disclosure: text.min(10),
          enabled: z.boolean(),
          category: text,
          post_ids: z
            .string()
            .transform((s) =>
              s
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean),
            )
            .pipe(z.array(z.uuid())),
        })
        .parse(raw);
    } else if (kind === "laptops") {
      body = z
        .object({
          id: z.uuid().optional(),
          model: text.min(2),
          cpu: text,
          ram: text,
          storage: text,
          display: text,
          condition: text,
          price: z.union([
            z.literal("").transform(() => null),
            z.coerce.number().nonnegative(),
          ]),
          currency: z.string().length(3),
          description: text,
          available: z.boolean(),
          images: z.array(shotSchema).max(20),
        })
        .parse(raw);
    } else throw new ActionError("Invalid resource", 404);
    if (
      kind === "laptops" &&
      "images" in body &&
      body.available &&
      body.images.some((s) => !s.reviewed || s.alt.length < 3)
    )
      throw new ActionError("Add alt text and review each image before publishing this listing.");
    const { error } = await db
      .from(kind === "affiliates" ? "affiliate_links" : "laptops")
      .upsert({ ...body } as Record<string, unknown>);
    if (error) throw error;
    revalidatePath("/laptops");
    revalidatePath("/solutions", "layout");
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
