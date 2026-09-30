import { beforeEach, describe, expect, it, vi } from "vitest";
import { blankPost } from "../src/lib/types";
const { requireAdmin, query } = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  query: {
    select: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    eq: vi.fn(),
    in: vi.fn(),
    maybeSingle: vi.fn(),
  },
}));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("../src/lib/supabase", () => ({ requireAdmin, serviceDb: vi.fn() }));
import { POST } from "../src/app/api/admin/posts/route";
const draft = {
  ...blankPost,
  id: "00000000-0000-4000-8000-000000000010",
  title: "Synthetic private article",
  slug: "synthetic-private-article",
  published_at: "2026-09-24T07:00:00+00:00",
};
function request(data: unknown) {
  return new Request("http://localhost:3000/api/admin/posts", {
    method: "POST",
    headers: {
      origin: "http://localhost:3000",
      "content-type": "application/json",
    },
    body: JSON.stringify(data),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
  for (const fn of [
    query.select,
    query.update,
    query.upsert,
    query.eq,
    query.in,
  ])
    fn.mockReturnValue(query);
  query.maybeSingle.mockResolvedValue({
    data: {
      id: draft.id,
      slug: draft.slug,
      published_at: draft.published_at,
      updated_at: "2026-09-24T07:00:01.123456+00:00",
    },
    error: null,
  });
  requireAdmin.mockResolvedValue({ db: { from: () => query } });
});
describe("article save route", () => {
  it("saves a private unverified draft with the hosted timestamp format", async () => {
    const response = await POST(request(draft));
    expect(response.status).toBe(200);
    expect(query.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        published_at: "2026-09-24T07:00:00.000Z",
        verified: false,
      }),
    );
  });
  it("returns field-specific errors without executing a write", async () => {
    const response = await POST(request({ ...draft, published_at: "broken" }));
    expect(response.status).toBe(400);
    expect((await response.json()).fields.published_at).toHaveLength(1);
    expect(query.upsert).not.toHaveBeenCalled();
  });
  it("uses exact database precision to reject a stale autosave", async () => {
    query.maybeSingle.mockResolvedValue({ data: null, error: null });
    const response = await POST(
      request({
        ...draft,
        expected_updated_at: "2026-09-24T07:00:01.123456+00:00",
      }),
    );
    expect(response.status).toBe(409);
    expect(query.eq).toHaveBeenCalledWith(
      "updated_at",
      "2026-09-24T07:00:01.123456+00:00",
    );
    expect(query.upsert).not.toHaveBeenCalled();
    expect(query.update.mock.calls[0][0]).not.toHaveProperty(
      "expected_updated_at",
    );
  });
  it("reports slug conflicts without exposing database details", async () => {
    query.maybeSingle.mockResolvedValue({
      data: null,
      error: { code: "23505", details: "private database payload" },
    });
    const response = await POST(request(draft));
    expect(response.status).toBe(409);
    const body = await response.json();
    expect(body.fields.slug).toHaveLength(1);
    expect(JSON.stringify(body)).not.toContain("private database payload");
  });
  it("rejects missing authentication before reading or writing draft data", async () => {
    requireAdmin.mockRejectedValue(new Error("Unauthorized"));
    expect((await POST(request(draft))).status).toBe(401);
    expect(query.upsert).not.toHaveBeenCalled();
  });
});
