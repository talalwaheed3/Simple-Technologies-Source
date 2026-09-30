import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import {
  getPost,
  getComments,
  related,
  siteUrl,
  jsonLd,
  settings,
} from "@/lib/data";
import { articleStructuredData, solutionsPath } from "@/lib/seo";
import { configured, publicDb } from "@/lib/supabase";
import { ArticleBody } from "@/components/article";
import { Engagement, CommentForm } from "@/components/engagement";
import { Card, Support } from "@/components/ui";
import { AdSlot } from "@/components/consent";
import { AffiliateRecommendations } from "@/components/monetization";
export const revalidate = 60;
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [p, s] = await Promise.all([getPost(slug), settings()]);
  const cover = p?.screenshots.find((s) => s.reviewed);
  const images = cover
    ? [
        {
          url: `${siteUrl()}/api/media/${cover.id}`,
          width: cover.width,
          height: cover.height,
          alt: cover.alt,
        },
      ]
    : [];
  return p
    ? {
        title: p.seo_title || p.title,
        description: p.seo_description || p.excerpt,
        alternates: { canonical: `/solutions/${p.slug}` },
        openGraph: {
          type: "article" as const,
          siteName: s.brand,
          locale: "en_US",
          url: `${siteUrl()}/solutions/${p.slug}`,
          images,
          title: p.title,
          description: p.excerpt,
          publishedTime: p.published_at || undefined,
          modifiedTime: p.updated_at,
          authors: [`${siteUrl()}/about`],
          section: p.category,
          tags: p.tags,
        },
        twitter: {
          card: cover ? ("summary_large_image" as const) : ("summary" as const),
          images,
          title: p.title,
          description: p.excerpt,
        },
      }
    : { title: "Solution not found", robots: { index: false } };
}
export default async function Article({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getPost(slug);
  if (!p) {
    if (configured()) {
      const { data } = await publicDb()
        .from("redirects")
        .select("post_id")
        .eq("old_slug", slug)
        .maybeSingle();
      if (data) {
        const { data: target } = await publicDb()
          .from("posts")
          .select("slug")
          .eq("id", data.post_id)
          .maybeSingle();
        if (target && target.slug !== slug)
          permanentRedirect(`/solutions/${target.slug}`);
      }
    }
    notFound();
  }
  const [comments, more, s] = await Promise.all([
    getComments(p.id),
    related(p),
    settings(),
  ]);
  return (
    <div className="wrap section">
      <div className="small muted" role="navigation" aria-label="Breadcrumb">
        <Link href="/">Home</Link> / <Link href="/solutions">Solutions</Link> /{" "}
        <Link href={solutionsPath({ category: p.category })}>{p.category}</Link>{" "}
        / <span aria-current="page">{p.title}</span>
      </div>
      <div className="article-layout">
        <article className="prose">
          <div className="eyebrow" style={{ marginTop: 28 }}>
            {p.category} · {p.os}
          </div>
          <h1>{p.title}</h1>
          <p className="muted">{p.excerpt}</p>
          <div className="small muted">
            By <Link href="/about">{s.brand}</Link> · Updated{" "}
            <time dateTime={p.updated_at}>
              {new Date(p.updated_at).toLocaleDateString("en-GB")}
            </time>
            {p.device && ` · ${p.device}`}
          </div>
          <ArticleBody post={p} />
          <Engagement postId={p.id} initialLikes={p.likes} />
          <AffiliateRecommendations post={p} />
          <AdSlot />
          <section id="comments">
            <h2>From the workbench community</h2>
            {comments
              .filter((c) => !c.parent_id)
              .map((c) => (
                <div className="comment" key={c.id}>
                  <strong>{c.name}</strong>{" "}
                  <time className="small muted" dateTime={c.created_at}>
                    {new Date(c.created_at).toLocaleDateString("en-GB")}
                  </time>
                  <p>{c.body}</p>
                  {comments
                    .filter((r) => r.parent_id === c.id)
                    .map((r) => (
                      <div className="reply" key={r.id}>
                        <strong>
                          {r.name} <span className="badge">Technician</span>
                        </strong>
                        <p>{r.body}</p>
                      </div>
                    ))}
                </div>
              ))}
            {!comments.length && (
              <p className="muted">
                No comments yet. Tell us whether this worked on your device.
              </p>
            )}
            <CommentForm postId={p.id} />
          </section>
        </article>
        <aside className="article-aside">
          <strong>In this solution</strong>
          <a href="#symptoms">Symptoms</a>
          <a href="#solution">The solution</a>
          <a href="#verification">Verify the repair</a>
          <a href="#comments">Comments</a>
          <hr />
          <Link href="/request">Request a solution →</Link>
        </aside>
      </div>
      <section className="section">
        <Support post={p} />
      </section>
      {more.length > 0 && (
        <section>
          <h2>Related problems</h2>
          <div className="grid">
            {more.map((post) => (
              <Card post={post} key={post.id} />
            ))}
          </div>
        </section>
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLd(articleStructuredData(p, siteUrl(), s.brand)),
        }}
      />
    </div>
  );
}
