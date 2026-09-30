export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const keys = [
      "NEXT_PUBLIC_SUPABASE_URL",
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_SECRET_KEY",
      "VISITOR_SECRET",
    ] as const;
    const present = keys.filter((k) => Boolean(process.env[k]));
    if (present.length && present.length !== keys.length)
      throw new Error(
        `Incomplete Supabase configuration. Missing: ${keys.filter((key) => !process.env[key]).join(", ")}. Set these server environment variables using .env.example.`,
      );
    if (process.env.VISITOR_SECRET && process.env.VISITOR_SECRET.length < 32)
      throw new Error("VISITOR_SECRET must have at least 32 characters.");
    for (const key of ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SITE_URL"]) {
      if (!process.env[key]) continue;
      try {
        const url = new URL(process.env[key]!);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error();
      } catch {
        throw new Error(`${key} must be a valid HTTP or HTTPS URL.`);
      }
    }
    if (
      Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) !==
      Boolean(process.env.TURNSTILE_SECRET_KEY)
    )
      throw new Error("Turnstile needs both site and secret keys.");
  }
}
