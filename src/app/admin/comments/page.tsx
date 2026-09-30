import { adminPage } from "@/lib/supabase";
import { Moderate } from "@/components/admin-controls";
export default async function Comments({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const admin = await adminPage();
  if (!admin) return null;
  const p = await searchParams,
    { db } = admin;
  const page = Math.max(1, parseInt(p.page || "1") || 1);
  let q = db
    .from("comments")
    .select("*")
    .order("created_at", { ascending: false });
  if (p.status) q = q.eq("status", p.status);
  const { data, error } = await q.range((page - 1) * 30, page * 30 - 1);
  if (error) throw error;
  return (
    <>
      <h1>Comment moderation</h1>
      <form className="filters">
        <label className="field">
          Status
          <select name="status" defaultValue={p.status || ""}>
            <option value="">All comments</option>
            {["pending", "approved", "hidden", "spam"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <button>Filter</button>
      </form>
      {data?.map((c) => (
        <details key={c.id}>
          <summary>
            {c.name} · {c.status} ·{" "}
            {new Date(c.created_at).toLocaleDateString()}
          </summary>
          <p className="text-lines">{c.body}</p>
          <Moderate id={c.id} />
        </details>
      ))}
      {!data?.length && <p>No comments in this view.</p>}
      <div className="pagination">
        {page > 1 && (
          <a href={`?status=${p.status || ""}&page=${page - 1}`}>Previous</a>
        )}
        {data?.length === 30 && (
          <a href={`?status=${p.status || ""}&page=${page + 1}`}>Next</a>
        )}
      </div>
    </>
  );
}
