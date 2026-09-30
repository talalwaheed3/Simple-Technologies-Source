import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  articleStructuredData,
  browseMetadata,
  normalizeBrowseParams,
  solutionsPath,
} from "../src/lib/seo";
import { blankPost, type Post } from "../src/lib/types";

const origin = "https://example.com";
const { configured, query } = vi.hoisted(() => ({
  configured: vi.fn(),
  query: {
    select: vi.fn(),
    eq: vi.fn(),
    lte: vi.fn(),
    order: vi.fn(),
    range: vi.fn(),
  },
}));
vi.mock("../src/lib/data", () => ({ siteUrl: () => "https://example.com" }));
vi.mock("../src/lib/supabase", () => ({
  configured,
  publicDb: () => ({ from: () => query }),
}));
import robots from "../src/app/robots";
import sitemap from "../src/app/sitemap";

const post: Post = {
  ...blankPost,
  id: "example-post",
  slug: "recover-windows",
  title: "Recover Windows",
  excerpt: "A documented repair.",
  status: "published",
  category: "Storage & recovery",
  created_at: "2026-09-01T12:00:00Z",
  updated_at: "2026-09-20T12:00:00Z",
  published_at: "2026-09-19T12:00:00Z",
  views: 10,
  likes: 2,
  comment_count: 0,
  screenshots: [
    {
      id: "public-image",
      path: "private-bucket-path",
      reviewed: true,
      width: 1200,
      height: 800,
      alt: "Windows repair screen",
      caption: "",
    },
    {
      id: "private-image",
      path: "private-bucket-path",
      reviewed: false,
      width: 1200,
      height: 800,
      alt: "Unreviewed",
      caption: "",
    },
  ],
};

describe("canonical browse pages", () => {
  it("gives subsequent pages and category collections their own canonical URL", () => {
    expect(browseMetadata({ page: "2" }).alternates?.canonical).toBe(
      "/solutions?page=2",
    );
    const metadata = browseMetadata({
      category: "Storage & recovery",
      page: "3",
    });
    expect(metadata.alternates?.canonical).toBe(
      "/solutions?category=Storage+%26+recovery&page=3",
    );
    expect(metadata.title).toContain("Storage & recovery");
    expect(metadata.robots).toBeUndefined();
  });

  it("consolidates duplicate defaults and ignores tracking parameters", () => {
    expect(
      solutionsPath({
        page: "1",
        sort: "newest",
        q: "",
        utm_source: "newsletter",
      }),
    ).toBe("/solutions");
    expect(
      solutionsPath({ category: "Windows", page: "1", sort: "newest" }),
    ).toBe("/solutions?category=Windows");
    expect(
      normalizeBrowseParams({ page: ["2", "3"], q: ["  repair  ", "ignored"] }),
    ).toEqual({ q: "repair", page: "2" });
  });

  it.each([
    { q: "disk error" },
    { device: "Latitude" },
    { os: "Windows 11" },
    { tag: "boot" },
    { sort: "likes" },
    { category: "unknown" },
  ])("keeps search and arbitrary filter views out of the index: %j", (params) =>
    expect(browseMetadata(params).robots).toEqual({
      index: false,
      follow: true,
    }),
  );
});

describe("article structured data", () => {
  it("uses real author, dates, linked breadcrumbs and only reviewed public images", () => {
    const [article, breadcrumb] = articleStructuredData(
      post,
      origin,
      "Simple Technologies",
    );
    expect(article).toMatchObject({
      "@type": ["Article", "TechArticle"],
      author: { name: "Simple Technologies", url: `${origin}/about` },
      datePublished: post.published_at,
      dateModified: post.updated_at,
      image: [`${origin}/api/media/public-image`],
    });
    expect(breadcrumb.itemListElement?.map((item) => item.item)).toEqual([
      origin,
      `${origin}/solutions`,
      `${origin}/solutions?category=Storage+%26+recovery`,
      `${origin}/solutions/recover-windows`,
    ]);
    expect(JSON.stringify(article)).not.toContain("private-image");
    expect(JSON.stringify(article)).not.toContain("private-bucket-path");
  });

  it("does not invent images for articles without reviewed screenshots", () => {
    expect(
      articleStructuredData(
        { ...post, screenshots: [] },
        origin,
        "Simple Technologies",
      )[0],
    ).not.toHaveProperty("image");
  });
});

describe("crawler discovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configured.mockReturnValue(true);
    for (const fn of [query.select, query.eq, query.lte, query.order])
      fn.mockReturnValue(query);
    query.range.mockResolvedValue({ data: [post], error: null });
  });

  it("allows reviewed public image URLs while retaining private route and preview restrictions", () => {
    expect(robots().rules).toMatchObject({
      allow: ["/", "/api/media/"],
      disallow: expect.arrayContaining([
        "/admin",
        "/login",
        "/api/",
        "/api/media/*?*preview=",
        "/go/",
      ]),
    });
  });

  it("includes canonical category and reviewed image URLs using published-only queries", async () => {
    const entries = await sitemap();
    expect(query.eq).toHaveBeenCalledWith("status", "published");
    expect(query.lte).toHaveBeenCalledWith("published_at", expect.any(String));
    expect(entries).toContainEqual({
      url: `${origin}/solutions?category=Storage+%26+recovery`,
    });
    expect(entries).toContainEqual({
      url: `${origin}/solutions/recover-windows`,
      lastModified: post.updated_at,
      images: [`${origin}/api/media/public-image`],
    });
    expect(JSON.stringify(entries)).not.toContain("private-image");
    expect(
      entries.some(
        (entry) => entry.url.includes("/admin") || entry.url.includes("/login"),
      ),
    ).toBe(false);
  });
});
