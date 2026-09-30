import { z } from "zod";
import { sessionDb } from "@/lib/supabase";
import { apiError, originGuard, rateLimit } from "@/lib/security";
export async function POST(req: Request) {
  try {
    await originGuard(req);
    await rateLimit("login", 10);
    const d = z
      .object({ email: z.email(), password: z.string().min(1).max(200) })
      .parse(await req.json());
    const db = await sessionDb();
    const { error } = await db.auth.signInWithPassword(d);
    if (error) throw new Error("Unauthorized");
    const {
      data: { user },
      error: userError,
    } = await db.auth.getUser();
    if (userError || !user) throw new Error("Unauthorized");
    const { data } = await db
      .from("admins")
      .select("user_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!data) {
      await db.auth.signOut();
      throw new Error("Forbidden");
    }
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(req: Request) {
  try {
    await originGuard(req);
    const db = await sessionDb();
    const { error } = await db.auth.signOut();
    if (error) throw error;
    return Response.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
