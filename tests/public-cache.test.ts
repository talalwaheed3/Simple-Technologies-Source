import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { publicDb, serviceDb } from "../src/lib/supabase";
import { posts } from "../src/lib/data";
const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-public-key");
  vi.stubEnv("SUPABASE_SECRET_KEY", "test-server-key");
  fetchMock.mockReset().mockImplementation(async () => Response.json([]));
  vi.stubGlobal("fetch", fetchMock);
});
describe("counted browse pagination", () => {
  it("treats an out-of-range database response as an empty page for the 404 boundary", async () => {
    fetchMock.mockImplementation(async () =>
      Response.json(
        {
          code: "PGRST103",
          message: "Requested range not satisfiable",
          details:
            "An offset of 119988 was requested, but there are only 28 rows.",
        },
        { status: 416, headers: { "content-range": "*/28" } },
      ),
    );
    expect((await posts({ page: 10000 })).posts).toEqual([]);
  });
  it("still reports real database failures rather than disguising them as empty results", async () => {
    fetchMock.mockImplementation(async () =>
      Response.json(
        {
          code: "42501",
          message: "Permission denied",
        },
        { status: 403 },
      ),
    );
    await expect(posts({ page: 2 })).rejects.toThrow(
      "Could not load solutions",
    );
  });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("database cache boundaries", () => {
  it("opts public settings into a tagged five-minute fetch cache", async () => {
    await publicDb({ revalidate: 300, tags: ["site-settings"] })
      .from("site_settings")
      .select("value");
    expect(fetchMock.mock.calls[0][1].next).toEqual({
      revalidate: 300,
      tags: ["site-settings"],
    });
  });
  it("does not persistently cache normal public visibility checks", async () => {
    await publicDb().from("posts").select("id");
    expect(fetchMock.mock.calls[0][1].next).toBeUndefined();
    expect(fetchMock.mock.calls[0][1].cache).not.toBe("force-cache");
  });
  it("never adds public cache settings to the privileged client", async () => {
    await serviceDb().from("media").select("id");
    expect(fetchMock.mock.calls[0][1].next).toBeUndefined();
    expect(fetchMock.mock.calls[0][1].cache).not.toBe("force-cache");
  });
});
