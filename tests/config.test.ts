import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { register } from "../src/instrumentation";
const required = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SECRET_KEY",
  "VISITOR_SECRET",
];
beforeEach(() => {
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
  for (const key of [
    ...required,
    "NEXT_PUBLIC_SITE_URL",
    "NEXT_PUBLIC_TURNSTILE_SITE_KEY",
    "TURNSTILE_SECRET_KEY",
  ])
    vi.stubEnv(key, "");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});
describe("safe configuration errors", () => {
  it("names missing keys without exposing supplied values", async () => {
    vi.stubEnv("SUPABASE_SECRET_KEY", "private-value-must-not-appear");
    await expect(register()).rejects.toThrow(
      "NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, VISITOR_SECRET",
    );
    await expect(register()).rejects.not.toThrow(
      "private-value-must-not-appear",
    );
  });
  it("names invalid URL fields without echoing their contents", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "bad-url-with-sensitive-value");
    await expect(register()).rejects.toThrow(
      "NEXT_PUBLIC_SITE_URL must be a valid HTTP or HTTPS URL.",
    );
  });
  it("supports fully unconnected preview mode", async () => {
    await expect(register()).resolves.toBeUndefined();
  });
  it.each(["development", "production"])(
    "limits eval and local websocket CSP exceptions to development (%s)",
    async (mode) => {
      vi.stubEnv("NODE_ENV", mode);
      const { default: config } = await import("../next.config");
      const entries = await config.headers!();
      const csp = entries[0].headers.find(
        (header) => header.key === "Content-Security-Policy",
      )!.value;
      expect(csp.includes("'unsafe-eval'")).toBe(mode === "development");
      expect(csp.includes("ws://localhost:")).toBe(mode === "development");
      expect(csp).toContain("frame-ancestors 'none'");
    },
  );
});
