import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/data";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      // Reviewed public images must be crawlable for image search and previews.
      // The media endpoint still checks publication and privacy on each request.
      allow: ["/", "/api/media/"],
      disallow: ["/admin", "/login", "/api/", "/api/media/*?*preview=", "/go/"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
