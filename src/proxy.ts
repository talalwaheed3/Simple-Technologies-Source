import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
export async function proxy(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
    return res;
  const db = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll(values, headers) {
          values.forEach((v) => req.cookies.set(v.name, v.value));
          res = NextResponse.next({ request: req });
          values.forEach((v) => res.cookies.set(v.name, v.value, v.options));
          Object.entries(headers ?? {}).forEach(([k, v]) =>
            res.headers.set(k, v),
          );
        },
      },
    },
  );
  await db.auth.getUser();
  res.headers.set("Cache-Control", "private, no-store");
  return res;
}
export const config = {
  matcher: ["/admin/:path*", "/login", "/api/admin/:path*", "/api/auth/:path*"],
};
