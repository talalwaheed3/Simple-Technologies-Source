import Link from "next/link";
import { adminPage } from "@/lib/supabase";
type Stats = {
  today: number;
  week: number;
  month: number;
  total: number;
  unique: number;
  pending: number;
  requests: number;
  daily: { day: string; views: number }[];
  events: { kind: string; count: number }[];
  zero_searches: { query: string; count: number }[];
  sources: { source: string; count: number }[];
};
export default async function Dashboard() {
  const admin = await adminPage();
  if (!admin) return null;
  const { db } = admin;
  const [
    { data, error },
    { data: top },
    { data: liked },
    { data: latest },
    { data: comments },
  ] = await Promise.all([
    db.rpc("dashboard_stats"),
    db
      .from("posts")
      .select("id,title,views")
      .order("views", { ascending: false })
      .limit(5),
    db
      .from("posts")
      .select("id,title,likes")
      .order("likes", { ascending: false })
      .limit(5),
    db
      .from("posts")
      .select("id,title,status")
      .order("created_at", { ascending: false })
      .limit(5),
    db
      .from("comments")
      .select("id,name,body,status")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  if (error) throw error;
  const s = data as Stats;
  const max = Math.max(1, ...s.daily.map((d) => d.views));
  return (
    <>
      <div className="section-heading">
        <h1>Your workbench</h1>
        <Link className="button" href="/admin/posts/new">
          ＋ Add problem
        </Link>
      </div>
      <div className="metrics">
        {[
          ["Today", s.today],
          ["Last 7 days", s.week],
          ["Last 30 days", s.month],
          ["All-time views", s.total],
          ["Visitors · 30 days", s.unique],
          ["Awaiting review", s.pending],
          ["New requests", s.requests],
        ].map(([label, value]) => (
          <div className="metric" key={label}>
            <span>{label}</span>
            <strong>{Number(value).toLocaleString()}</strong>
          </div>
        ))}
      </div>
      <section className="section">
        <h2>Views over the last 30 days</h2>
        <div
          className="bars"
          role="img"
          aria-label={`Daily article views. Total ${s.month} in the last 30 days.`}
        >
          {s.daily.map((d) => (
            <div
              className="bar"
              key={d.day}
              style={{ height: `${Math.max(1, (d.views / max) * 100)}%` }}
              title={`${d.day}: ${d.views}`}
            />
          ))}
        </div>
        <details>
          <summary>View chart data</summary>
          <table>
            <tbody>
              {s.daily.map((d) => (
                <tr key={d.day}>
                  <td>{d.day}</td>
                  <td>{d.views}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
        <p className="small muted">
          UTC days. Visitors are approximate browser identifiers. Clearing
          cookies changes the identifier.
        </p>
      </section>
      <div className="two-col">
        <section className="card">
          <h2>Most viewed</h2>
          {top?.map((p) => (
            <p key={p.id}>
              <Link href={`/admin/posts/${p.id}`}>{p.title}</Link> · {p.views}
            </p>
          ))}
        </section>
        <section className="card">
          <h2>Most helpful</h2>
          {liked?.map((p) => (
            <p key={p.id}>
              <Link href={`/admin/posts/${p.id}`}>{p.title}</Link> · {p.likes}
            </p>
          ))}
        </section>
        <section className="card">
          <h2>Business actions · 30 days</h2>
          {s.events.length ? (
            s.events.map((e) => (
              <p key={e.kind}>
                {e.kind.replaceAll("_", " ")}: <strong>{e.count}</strong>
              </p>
            ))
          ) : (
            <p>No tracked actions yet.</p>
          )}
        </section>
        <section className="card">
          <h2>Searches without a solution</h2>
          {s.zero_searches.length ? (
            s.zero_searches.map((e) => (
              <p key={e.query}>
                {e.query} · {e.count}
              </p>
            ))
          ) : (
            <p>No unanswered searches yet.</p>
          )}
        </section>
        <section className="card">
          <h2>Traffic sources</h2>
          {s.sources.map((e) => (
            <p key={e.source}>
              {e.source} · {e.count}
            </p>
          ))}
        </section>
        <section className="card">
          <h2>Recent articles</h2>
          {latest?.map((p) => (
            <p key={p.id}>
              <Link href={`/admin/posts/${p.id}`}>{p.title}</Link>{" "}
              <span className="badge">{p.status}</span>
            </p>
          ))}
        </section>
        <section className="card">
          <h2>Latest comments</h2>
          {comments?.map((c) => (
            <p key={c.id}>
              <strong>{c.name}</strong>: {c.body.slice(0, 120)}{" "}
              <Link href="/admin/comments">Review</Link>
            </p>
          ))}
        </section>
        <section className="card">
          <h2>Search performance</h2>
          <p>
            Google Search Console is not connected. Add the verification token
            in your deployment environment, then submit your sitemap.
          </p>
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noreferrer"
          >
            Open Search Console ↗
          </a>
        </section>
      </div>
    </>
  );
}
