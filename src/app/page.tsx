import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { homePosts, engagementTotal } from "@/lib/data";
import { featured } from "@/lib/ranking";
import { categories } from "@/lib/types";
import { Search, Card, Empty, Support } from "@/components/ui";
export const revalidate = 60;
export const metadata = { alternates: { canonical: "/" } };
export default async function Home() {
  const [items, total] = await Promise.all([homePosts(), engagementTotal()]);
  const picks = featured(items, 30, total);
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <div className="eyebrow">From the repair bench / To your screen</div>
          <h1>
            What problem are
            <br />
            you trying to fix?
          </h1>
          <p>
            Find the symptoms. Understand the cause. Follow a clear solution.
            <br />
            Computer troubleshooting, grounded in real repair cases.
          </p>
          <Search />
        </div>
      </section>
      <div className="wrap">
        <section className="section">
          <div className="section-heading">
            <h2>Start with a solution</h2>
            <Link href="/solutions">Browse all solutions →</Link>
          </div>
          {picks.length ? (
            <div className="grid">
              {picks.map((p) => (
                <Card key={p.post.id} {...p} />
              ))}
            </div>
          ) : (
            <Empty />
          )}
        </section>
      </div>
      <section className="section tinted">
        <div className="wrap">
          <div className="section-heading">
            <h2>Find your corner of the workbench</h2>
            <span className="muted small">Browse by category</span>
          </div>
          <div className="categories">
            {categories.map((c) => (
              <Link
                className="category"
                key={c}
                href={`/solutions?category=${encodeURIComponent(c)}`}
              >
                {c}
                <ArrowRight size={17} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <div className="wrap">
        <section className="section">
          <Support />
        </section>
        {items.length > 3 && (
          <section className="section">
            <div className="section-heading">
              <h2>Recently documented</h2>
            </div>
            <div className="grid">
              {items.slice(0, 6).map((post) => (
                <Card key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
