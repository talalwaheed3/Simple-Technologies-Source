import { adminPage } from "@/lib/supabase";
import { CatalogForm } from "@/components/admin-controls";
export default async function Page() {
  const admin = await adminPage();
  if (!admin) return null;
  const { db } = admin;
  const { data, error } = await db
    .from("laptops")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (
    <>
      <h1>Laptop listings</h1>
      <details>
        <summary>Add new</summary>
        <CatalogForm kind="laptops" />
      </details>
      {data?.map((p) => (
        <details key={p.id}>
          <summary>{p.name || p.model}</summary>
          <CatalogForm kind="laptops" existing={p} />
        </details>
      ))}
    </>
  );
}
