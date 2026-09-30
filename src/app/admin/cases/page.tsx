import Link from "next/link";
import { adminPage } from "@/lib/supabase";
export default async function Cases() {
  const admin = await adminPage();
  if (!admin) return null;
  const { db } = admin;
  const { data, error } = await db
    .from("case_inventory")
    .select("*")
    .order("source_date", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (
    <>
      <h1>Historical case inventory</h1>
      <div className="notice">
        History scope: April 5, 2026 onward. The full export audit is deferred
        until the export arrives. Earlier candidates are preserved privately as
        legacy drafts, outside this scope. No case is published without verified
        evidence.
      </div>
      {data?.map((c) => (
        <details key={c.id}>
          <summary>
            {c.title} · {c.status}
          </summary>
          <dl>
            {Object.entries(c)
              .filter(([k]) => !["id", "post_id", "title"].includes(k))
              .map(([k, v]) => (
                <div key={k}>
                  <dt>
                    <strong>{k.replaceAll("_", " ")}</strong>
                  </dt>
                  <dd className="text-lines">
                    {Array.isArray(v) ? v.join(", ") : String(v ?? "Unknown")}
                  </dd>
                </div>
              ))}
          </dl>
          {c.post_id && (
            <Link className="button" href={`/admin/posts/${c.post_id}`}>
              Review article draft
            </Link>
          )}
        </details>
      ))}
      {!data?.length && (
        <p>
          No cases imported yet. Run the seed command described in SETUP.md.
        </p>
      )}
    </>
  );
}
