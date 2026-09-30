import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { serviceDb } from "./supabase";
import { ZodError } from "zod";
import { ActionError } from "./action-error";
export { ActionError } from "./action-error";
export function sign(value: string) {
  if (!process.env.VISITOR_SECRET || process.env.VISITOR_SECRET.length < 32)
    throw new Error("Visitor secret not configured");
  return createHmac("sha256", process.env.VISITOR_SECRET)
    .update(value)
    .digest("hex");
}
export async function visitor() {
  const jar = await cookies();
  const raw = jar.get("st_visitor")?.value;
  const [id, sig] = raw?.split(".") || [];
  if (id && sig && /^[a-f0-9-]{36}$/.test(id)) {
    const expected = sign(id);
    if (
      sig.length === expected.length &&
      timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
    )
      return id;
  }
  const value = randomUUID();
  jar.set("st_visitor", `${value}.${sign(value)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 86400 * 365,
  });
  return value;
}
export async function originGuard(req: Request) {
  const expected = new URL(process.env.NEXT_PUBLIC_SITE_URL || req.url).origin;
  if (req.headers.get("origin") !== expected) throw new Error("Invalid origin");
}
export async function rateLimit(scope: string, limit = 20) {
  const h = await headers();
  const ip =
    h.get("x-vercel-forwarded-for")?.split(",")[0] ||
    h.get("x-forwarded-for")?.split(",")[0] ||
    "local";
  const day = new Date().toISOString().slice(0, 10);
  const key = sign(`${scope}:${day}:${ip}`);
  const { data, error } = await serviceDb().rpc("consume_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window: 3600,
  });
  if (error) throw new Error("Rate limit unavailable");
  if (!data) throw new Error("Too many requests");
}
export async function verifyChallenge(token?: string) {
  if (!process.env.TURNSTILE_SECRET_KEY) return;
  const result = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token || "",
      }),
    },
  );
  if (!(await result.json()).success)
    throw new ActionError("Please complete the spam check");
}
export function apiError(error: unknown, action = "request") {
  if (error instanceof ZodError) {
    const fields: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "form";
      (fields[key] ||= []).push(issue.message);
    }
    console.warn("API validation failed", {
      action,
      fields: Object.keys(fields),
    });
    return Response.json(
      { error: "Check the highlighted fields and try again.", fields },
      { status: 400 },
    );
  }
  if (error instanceof ActionError)
    return Response.json(
      { error: error.message, fields: error.fields },
      { status: error.status },
    );
  if (error instanceof SyntaxError)
    return Response.json(
      { error: "The request could not be read. Try saving again." },
      { status: 400 },
    );
  const message = error instanceof Error ? error.message : "Request failed";
  const status =
    message === "Unauthorized"
      ? 401
      : message === "Forbidden" || message === "Invalid origin"
        ? 403
        : message === "Too many requests"
          ? 429
          : message.includes("not configured")
            ? 503
            : 500;
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : undefined;
  // Never log request bodies, database details, cookies, or credentials.
  console.warn("API request failed", {
    action,
    status,
    code: code && /^[A-Z0-9_]{1,32}$/.test(code) ? code : undefined,
  });
  return Response.json(
    {
      error:
        status === 503
          ? "This feature is not connected yet. Please try again later."
          : status === 500
            ? "The request could not be completed. Your changes have not been confirmed; please try again."
            : message,
    },
    { status },
  );
}
