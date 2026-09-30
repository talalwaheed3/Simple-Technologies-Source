import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin, configured } from "@/lib/supabase";
import { SignOut } from "@/components/admin-controls";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Technician workspace",
  robots: { index: false, follow: false },
};
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!configured())
    return (
      <div className="wrap section">
        <div className="notice">
          <h1>Connect your technician workspace</h1>
          <p>
            The admin area requires this site’s Supabase project and an
            authorized administrator. Follow SETUP.md in the source package to
            connect it.
          </p>
          <Link href="/">Return to site</Link>
        </div>
      </div>
    );
  let authorized = false;
  try {
    await requireAdmin();
    authorized = true;
  } catch {}
  if (!authorized) redirect("/login");
  return (
    <div className="wrap admin-shell">
      <nav className="admin-nav" aria-label="Admin navigation">
        {[
          ["", "Overview"],
          ["posts/new", "＋ Add problem"],
          ["posts", "Content inventory"],
          ["cases", "Historical cases"],
          ["comments", "Comments"],
          ["requests", "Solution requests"],
          ["affiliates", "Affiliate links"],
          ["laptops", "Laptop listings"],
          ["settings", "Settings"],
        ].map(([path, label]) => (
          <Link key={path} href={`/admin/${path}`}>
            {label}
          </Link>
        ))}
        <SignOut />
      </nav>
      <div className="admin-main">{children}</div>
    </div>
  );
}
