import type { Metadata } from "next";
import { categories, type Post } from "./types";

export type BrowseSearchParams = Record<string, string | string[] | undefined>;

// Use the same normalized parameters for results, links and canonical URLs.
// Tracking parameters, empty filters and the default sort don't change content.
export function normalizeBrowseParams(input: BrowseSearchParams) {
  const params: Record<string, string> = {};
  for (const key of ["category", "q", "os", "device", "tag"]) {
    const raw = input[key];
    const value = (Array.isArray(raw) ? raw[0] : raw)?.trim();
    if (value) params[key] = value.slice(0, key === "q" ? 200 : 100);
  }
  const sort = Array.isArray(input.sort) ? input.sort[0] : input.sort;
  if (sort === "views" || sort === "likes") params.sort = sort;
  const rawPage = Array.isArray(input.page) ? input.page[0] : input.page;
  const page = Math.max(1, Math.min(10000, parseInt(rawPage || "1", 10) || 1));
  if (page > 1) params.page = String(page);
  return params;
}

export function solutionsPath(input: BrowseSearchParams = {}) {
  const query = new URLSearchParams(normalizeBrowseParams(input)).toString();
  return `/solutions${query ? `?${query}` : ""}`;
}

export function browseMetadata(input: BrowseSearchParams): Metadata {
  const p = normalizeBrowseParams(input);
  const title = `${p.q ? `Search: ${p.q}` : p.category ? `${p.category} troubleshooting` : "Browse problems & solutions"}${p.page ? ` — Page ${p.page}` : ""}`;
  const description = p.category
    ? `Browse ${p.category} troubleshooting guides with symptoms, causes, step-by-step fixes and checks to verify the repair.`
    : "Find practical computer troubleshooting guides for Windows, Linux, macOS, storage, drivers and hardware, with clear repair steps and verification checks.";
  const canonical = solutionsPath(p);
  const filtered = Boolean(
    p.q ||
    p.sort ||
    p.device ||
    p.os ||
    p.tag ||
    (p.category && !categories.includes(p.category)),
  );
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", title, description, url: canonical },
    twitter: { card: "summary", title, description },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export function articleStructuredData(
  post: Post,
  origin: string,
  brand: string,
) {
  const url = `${origin}/solutions/${post.slug}`;
  const images = post.screenshots
    .filter((shot) => shot.reviewed)
    .map((shot) => `${origin}/api/media/${shot.id}`);
  return [
    {
      "@context": "https://schema.org",
      "@type": ["Article", "TechArticle"],
      "@id": `${url}#article`,
      url,
      headline: post.title,
      description: post.excerpt,
      datePublished: post.published_at || undefined,
      dateModified: post.updated_at,
      author: {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: brand,
        url: `${origin}/about`,
      },
      publisher: { "@id": `${origin}/#organization` },
      mainEntityOfPage: { "@type": "WebPage", "@id": url },
      isPartOf: { "@id": `${origin}/#website` },
      inLanguage: "en",
      articleSection: post.category,
      ...(images.length ? { image: images } : {}),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: origin },
        {
          "@type": "ListItem",
          position: 2,
          name: "Solutions",
          item: `${origin}/solutions`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: post.category,
          item: `${origin}${solutionsPath({ category: post.category })}`,
        },
        { "@type": "ListItem", position: 4, name: post.title, item: url },
      ],
    },
  ];
}
