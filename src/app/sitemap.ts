import type { MetadataRoute } from "next";
import { configured, publicDb } from "@/lib/supabase";
import { siteUrl } from "@/lib/data";
import { solutionsPath } from "@/lib/seo";
import { categories, type Shot } from "@/lib/types";
export const revalidate = 60;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = [
    "",
    "/solutions",
    "/categories",
    "/support",
    "/request",
    "/laptops",
    "/about",
    "/contact",
    "/privacy",
    "/terms",
    "/disclosure",
  ].map((p) => ({ url: siteUrl() + p }));
  if (!configured()) return pages;
  const all: MetadataRoute.Sitemap = [];
  const publishedCategories = new Set<string>();
  const now = new Date().toISOString();
  for (let from = 0; ; from += 1000) {
    const { data, error } = await publicDb()
      .from("posts")
      .select("slug,updated_at,category,screenshots")
      .eq("status", "published")
      .lte("published_at", now)
      .order("id")
      .range(from, from + 999);
    if (error) throw error;
    for (const p of data) {
      if (categories.includes(p.category)) publishedCategories.add(p.category);
      const images = (p.screenshots as Shot[])
        .filter((shot) => shot.reviewed)
        .map((shot) => `${siteUrl()}/api/media/${shot.id}`);
      all.push({
        url: `${siteUrl()}/solutions/${p.slug}`,
        lastModified: p.updated_at,
        ...(images.length ? { images } : {}),
      });
    }
    if (data.length < 1000) break;
  }
  return [
    ...pages,
    ...[...publishedCategories].sort().map((category) => ({
      url: `${siteUrl()}${solutionsPath({ category })}`,
    })),
    ...all,
  ];
}
