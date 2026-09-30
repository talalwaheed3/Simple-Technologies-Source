import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
export const configured = () =>
  Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
// Cache only explicitly opted-in public data. Session and service clients never
// use this policy; publication and media authorization reads remain fresh.
export function publicDb(cachePolicy?: { revalidate: number; tags: string[] }) {
  if (!configured()) throw new Error("Database not configured");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false },
      ...(cachePolicy && {
        global: {
          fetch: (input: RequestInfo | URL, init?: RequestInit) =>
            fetch(input, { ...init, next: cachePolicy }),
        },
      }),
    },
  );
}
export function serviceDb() {
  if (!configured() || !process.env.SUPABASE_SECRET_KEY)
    throw new Error("Database not configured");
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
export async function sessionDb() {
  const jar = await cookies();
  if (!configured()) throw new Error("Database not configured");
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll(values) {
          try {
            values.forEach((v) => jar.set(v.name, v.value, v.options));
          } catch {
            /* Server Component: proxy refreshes cookies. */
          }
        },
      },
    },
  );
}
export async function requireAdmin() {
  const db = await sessionDb();
  const {
    data: { user },
    error,
  } = await db.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  const { data } = await db
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!data) throw new Error("Forbidden");
  return { db, user };
}

// Page-level guard avoids rendering child data before the parent layout resolves.
export async function adminPage() {
  if (!configured()) return null;
  try {
    return await requireAdmin();
  } catch (error) {
    if (
      error instanceof Error &&
      ["Unauthorized", "Forbidden"].includes(error.message)
    )
      redirect("/login");
    throw error;
  }
}
