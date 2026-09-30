import { adminPage } from "@/lib/supabase";
import { RequestActions } from "@/components/admin-controls";
export default async function Requests({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const admin = await adminPage();
  if (!admin) return null;
  const { db } = admin,
    p = await searchParams;
  const page = Math.max(1, parseInt(p.page || "1") || 1);
  let q = db
    .from("solution_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (p.status) q = q.eq("status", p.status);
  const { data, error } = await q.range((page - 1) * 25, page * 25 - 1);
  if (error) throw error;
  return (
    <>
      <h1>Solution requests</h1>
      <form className="filters">
        <label className="field">
          Status
          <select name="status" defaultValue={p.status || ""}>
            <option value="">All requests</option>
            {[
              "new",
              "reviewing",
              "need_more_information",
              "solved",
              "converted",
              "closed",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <button>Filter</button>
      </form>
      {data?.map((r) => (
        <details key={r.id}>
          <summary>
            {r.title} · {r.status}
          </summary>
          <p className="muted">
            {r.device} · {r.os}
          </p>
          <p className="text-lines">{r.description}</p>
          <p>Error: {r.error_message}</p>
          <p>Already tried: {r.tried}</p>
          <p>Contact: {r.contact || "Not supplied"}</p>
          {r.screenshot_paths.map((path: string) => (
            <p key={path}>
              <a
                href={`/api/admin/request-image?id=${r.id}`}
                target="_blank"
                rel="noreferrer"
              >
                View private screenshot ↗
              </a>
            </p>
          ))}
          <RequestActions id={r.id} status={r.status} />
        </details>
      ))}
      {!data?.length && <p>No requests yet.</p>}
      <div className="pagination">
        {page > 1 && (
          <a href={`?status=${p.status || ""}&page=${page - 1}`}>Previous</a>
        )}
        {data?.length === 25 && (
          <a href={`?status=${p.status || ""}&page=${page + 1}`}>Next</a>
        )}
      </div>
    </>
  );
}
