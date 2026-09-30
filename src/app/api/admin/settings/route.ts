import { z } from "zod";
import { requireAdmin } from "@/lib/supabase";
import { apiError, originGuard } from "@/lib/security";
import { safeUrl } from "@/lib/validation";
import { revalidatePath, revalidateTag } from "next/cache";
const url = z
  .string()
  .max(500)
  .refine((s) => !s || !!safeUrl(s));
export async function POST(req: Request) {
  try {
    await originGuard(req);
    const { db } = await requireAdmin();
    const value = z
      .object({
        brand: z.string().min(2).max(100),
        description: z.string().max(500),
        admin_label: z.string().min(2).max(80),
        support_url: url,
        booking_url: url,
        whatsapp: z.string().regex(/^[0-9+ ]{0,20}$/),
        email: z.union([z.email(), z.literal("")]),
      })
      .parse(await req.json());
    const { error } = await db
      .from("site_settings")
      .update({ value })
      .eq("id", 1);
    if (error) throw error;
    revalidateTag("site-settings", { expire: 0 });
    revalidatePath("/", "layout");
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
