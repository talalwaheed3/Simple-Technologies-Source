import { posts, siteUrl } from "@/lib/data";
function xml(s: string) {
  return s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
}
export const revalidate = 60;
export async function GET() {
  const { posts: list } = await posts();
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Simple Technologies</title><link>${xml(siteUrl())}</link><description>Practical computer fixes</description>${list.map((p) => `<item><title>${xml(p.title)}</title><link>${xml(siteUrl() + "/solutions/" + p.slug)}</link><guid>${xml(siteUrl() + "/solutions/" + p.slug)}</guid><description>${xml(p.excerpt)}</description><pubDate>${new Date(p.published_at!).toUTCString()}</pubDate></item>`).join("")}</channel></rss>`,
    { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } },
  );
}
