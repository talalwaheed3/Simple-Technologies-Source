import { z } from "zod";
import { settings } from "@/lib/data";
import { safeUrl } from "@/lib/validation";
import { serviceDb } from "@/lib/supabase";
import { visitor, rateLimit, apiError } from "@/lib/security";
export async function GET(
  req: Request,
  { params }: { params: Promise<{ kind: string; id: string }> },
) {
  try {
    const { kind, id } = await params;
    await rateLimit("outbound", 60);
    const db = serviceDb(),
      s = await settings();
    let destination: string | null = null;
    if (kind === "affiliate") {
      z.uuid().parse(id);
      const { data } = await db
        .from("affiliate_links")
        .select("*")
        .eq("id", id)
        .eq("enabled", true)
        .single();
      if (data)
        destination = safeUrl(data.affiliate_destination || data.destination);
    } else if (kind === "laptop") {
      z.uuid().parse(id);
      const { data } = await db
        .from("laptops")
        .select("id")
        .eq("id", id)
        .eq("available", true)
        .single();
      if (data)
        destination = s.whatsapp
          ? `https://wa.me/${s.whatsapp.replace(/\D/g, "")}`
          : safeUrl(s.support_url);
    } else if (kind === "support") {
      destination =
        id === "whatsapp" && s.whatsapp
          ? `https://wa.me/${s.whatsapp.replace(/\D/g, "")}`
          : id === "booking"
            ? safeUrl(s.booking_url)
            : safeUrl(s.support_url);
    }
    if (!destination)
      return Response.json(
        { error: "This contact or product link is unavailable." },
        { status: 404 },
      );
    const rawPost = new URL(req.url).searchParams.get("post");
    const post = z.uuid().safeParse(rawPost);
    await db
      .from("events")
      .insert({
        kind,
        visitor_id: await visitor(),
        post_id: post.success ? post.data : null,
        target_id: z.uuid().safeParse(id).success ? id : null,
      });
    return Response.redirect(destination, 302);
  } catch (e) {
    return apiError(e);
  }
}
