import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@supabase/supabase-js";
const mocks = vi.hoisted(() => ({ serviceDb: vi.fn(), requireAdmin: vi.fn() }));
vi.mock("../src/lib/supabase", () => mocks);
import { GET } from "../src/app/api/media/[id]/route";
const id = "00000000-0000-4000-8000-000000000010";
let published: boolean, listing: boolean;
const filters: { table: string; value: unknown }[] = [];
beforeEach(() => {
  published = true;
  listing = false;
  filters.length = 0;
  const db = createClient(
    "https://example.supabase.co",
    "test-publishable-key",
    {
      auth: { persistSession: false },
      global: {
        fetch: async (input) => {
          const url = new URL(String(input));
          if (url.pathname.includes("/storage/"))
            return new Response(new Uint8Array([1, 2, 3]), {
              headers: { "content-type": "image/webp" },
            });
          if (url.pathname.endsWith("/media"))
            return Response.json([{ path: `${id}/optimized.webp` }]);
          const table = url.pathname.endsWith("/posts") ? "posts" : "laptops";
          const filter = url.searchParams.get(
            table === "posts" ? "screenshots" : "images",
          )!;
          // The actual SDK must produce cs.[{...}], not cs.{[object Object]}.
          filters.push({ table, value: JSON.parse(filter.slice(3)) });
          return Response.json(
            (table === "posts" ? published : listing) ? [{ id }] : [],
          );
        },
      },
    },
  );
  mocks.serviceDb.mockReturnValue(db);
  mocks.requireAdmin.mockRejectedValue(new Error("Unauthorized"));
});
const read = (suffix = "") =>
  GET(new Request(`http://localhost:3000/api/media/${id}${suffix}`), {
    params: Promise.resolve({ id }),
  });
describe("public media authorization", () => {
  it("serves reviewed published media using a JSONB filter with the installed SDK", async () => {
    const response = await read();
    expect(response.status).toBe(200);
    expect(filters).toEqual([
      { table: "posts", value: [{ id, reviewed: true }] },
    ]);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("also supports reviewed public listing images", async () => {
    published = false;
    listing = true;
    expect((await read()).status).toBe(200);
    expect(filters[1]).toEqual({
      table: "laptops",
      value: [{ id, reviewed: true }],
    });
  });
  it("denies unpublished media and anonymous private previews", async () => {
    published = false;
    expect((await read()).status).toBe(404);
    expect((await read("?preview=1")).status).toBe(404);
  });
});
