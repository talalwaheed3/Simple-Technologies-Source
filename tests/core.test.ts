import { describe, it, expect } from "vitest";
import { featured } from "../src/lib/ranking";
import { postSchema, safeUrl } from "../src/lib/validation";
import { blankPost, type Post } from "../src/lib/types";
import seeds from "../content/posts.json";
function post(id: string, views = 0, likes = 0): Post {
  return {
    ...blankPost,
    id,
    title: "Example problem",
    slug: "example-" + id,
    status: "published",
    published_at: `2026-01-0${id}T00:00:00Z`,
    created_at: "",
    updated_at: "",
    views,
    likes,
    comment_count: 0,
  };
}
describe("homepage selection", () => {
  it("starts with three latest", () =>
    expect(
      featured([post("1"), post("2"), post("3"), post("4")]).map(
        (p) => p.post.id,
      ),
    ).toEqual(["4", "3", "2"]));
  it("selects unique latest, viewed and liked winners", () =>
    expect(
      featured([
        post("1", 40, 40),
        post("2", 90, 5),
        post("3", 0, 0),
        post("4", 100, 100),
      ]).map((p) => p.post.id),
    ).toEqual(["4", "2", "1"]));
  it("handles fewer than three and excludes drafts/future posts", () => {
    const future = { ...post("3"), published_at: "2099-01-01T00:00:00Z" };
    expect(
      featured([post("1"), { ...post("2"), status: "draft" }, future]),
    ).toHaveLength(1);
  });
});
describe("publishing boundary", () => {
  it("accepts hosted timestamps and unfinished private image metadata", () => {
    const draft = {
      ...blankPost,
      title: "Unverified private draft",
      slug: "unverified-private-draft",
      status: "needs_verification",
      published_at: "2026-09-24T07:00:00+00:00",
      screenshots: [
        {
          id: "00000000-0000-4000-8000-000000000010",
          path: "test/optimized.webp",
          alt: "",
          caption: "",
          width: 24,
          height: 16,
          reviewed: false,
        },
      ],
    };
    const parsed = postSchema.parse(draft);
    expect(parsed.published_at).toBe("2026-09-24T07:00:00.000Z");
    expect(
      postSchema.parse({ ...draft, published_at: "" }).published_at,
    ).toBeNull();
    expect(
      postSchema.parse({ ...draft, published_at: null }).published_at,
    ).toBeNull();
    for (const published_at of [
      "invalid",
      "2026-09-24T12:00",
      "2026-02-30T07:00:00Z",
    ])
      expect(postSchema.safeParse({ ...draft, published_at }).success).toBe(
        false,
      );
    expect(
      postSchema.safeParse({
        ...draft,
        screenshots: [{ ...draft.screenshots[0], width: 1.5 }],
      }).success,
    ).toBe(false);
    const publication = postSchema.safeParse({ ...draft, status: "published" });
    expect(publication.success).toBe(false);
    if (!publication.success)
      expect(
        publication.error.issues.map((issue) => issue.path.join(".")),
      ).toEqual(
        expect.arrayContaining([
          "verified",
          "screenshots.0.reviewed",
          "screenshots.0.alt",
        ]),
      );
  });
  it("rejects invented success and unreviewed media", () => {
    expect(
      postSchema.safeParse({
        ...blankPost,
        title: "Valid title",
        slug: "valid-title",
        status: "published",
      }).success,
    ).toBe(false);
  });
  it("accepts verified structured repair", () =>
    expect(
      postSchema.safeParse({
        ...blankPost,
        title: "A documented repair",
        slug: "documented-repair",
        steps: "Follow the verified repair procedure.",
        verification: "The device passed the recorded test.",
        excerpt: "A supported result.",
        status: "published",
        verified: true,
        published_at: new Date().toISOString(),
      }).success,
    ).toBe(true));
  it("keeps every history seed private and valid", () => {
    expect(seeds.length).toBe(37);
    for (const p of seeds) {
      expect(postSchema.safeParse(p).success).toBe(true);
      expect(["review", "needs_verification", "draft"]).toContain(p.status);
      expect(p.verified).toBe(false);
    }
  });
  it("rejects active link protocols", () => {
    expect(safeUrl("javascript:alert(1)")).toBeNull();
    expect(safeUrl("https://example.com")).toBe("https://example.com/");
  });
});

describe("homepage fallbacks", () => {
  it("does not call an article most helpful when every like count is zero", () => {
    const cards = featured([post("1", 50), post("2", 40), post("3")]);
    expect(cards.map((c) => c.post.id)).toEqual(["3", "1", "2"]);
    expect(cards[2].label).toBe("Latest solution");
  });
  it("handles empty and two-article sets after the engagement threshold", () => {
    expect(featured([], 0)).toEqual([]);
    const cards = featured([post("1", 100), post("2", 50)]);
    expect(cards.map((c) => c.post.id)).toEqual(["2", "1"]);
  });
});
