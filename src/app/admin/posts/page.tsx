import Link from "next/link";
import { adminPage } from "@/lib/supabase";
export default async function Inventory({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const admin = await adminPage();
  if (!admin) return null;
  const p = await searchParams,
    { db } = admin;
  const page = Math.max(1, parseInt(p.page || "1") || 1);
  let query = db
    .from("posts")
    .select(
      "id,title,device,category,status,views,likes,comment_count,created_at,updated_at",
      { count: "exact" },
    )
    .order("updated_at", { ascending: false });
  if (p.status) query = query.eq("status", p.status);
  if (p.q) query = query.ilike("title", `%${p.q.replace(/[%_]/g, "")}%`);
  const { data, error, count } = await query.range(
    (page - 1) * 30,
    page * 30 - 1,
  );
  if (error) throw error;
  return (
    <>
      <h1>Content inventory</h1>
      <form className="filters">
        <label className="field">
          Search
          <input name="q" defaultValue={p.q} />
        </label>
        <label className="field">
          Status
          <select name="status" defaultValue={p.status || ""}>
            <option value="">All</option>
            {[
              "draft",
              "review",
              "needs_verification",
              "published",
              "archived",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <button style={{ marginBottom: 17 }}>Filter</button>
      </form>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {[
                "Title / device",
                "Category",
                "Status",
                "Views",
                "Likes",
                "Comments",
                "Added",
                "Updated",
              ].map((t) => (
                <th key={t}>{t}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data?.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/admin/posts/${p.id}`}>{p.title}</Link>
                  <div className="muted small">{p.device}</div>
                </td>
                <td>{p.category}</td>
                <td>{p.status}</td>
                <td>{p.views}</td>
                <td>{p.likes}</td>
                <td>{p.comment_count}</td>
                <td>{new Date(p.created_at).toLocaleDateString()}</td>
                <td>{new Date(p.updated_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!data?.length && (
        <p>
          No articles in this view. Add a problem or import the case inventory.
        </p>
      )}
      <div className="pagination">
        {page > 1 && (
          <Link
            href={`?${new URLSearchParams({ ...p, page: String(page - 1) })}`}
          >
            Previous
          </Link>
        )}
        {page * 30 < (count || 0) && (
          <Link
            href={`?${new URLSearchParams({ ...p, page: String(page + 1) })}`}
          >
            Next
          </Link>
        )}
      </div>
    </>
  );
}
