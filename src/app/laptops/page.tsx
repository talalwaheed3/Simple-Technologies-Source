import Link from "next/link";
import { Screenshot } from "@/components/screenshot";
import type { Shot } from "@/lib/types";
import { configured, publicDb } from "@/lib/supabase";
export const revalidate = 60;
export const metadata = {
  title: "Available laptops",
  description:
    "Browse available laptops for work, study and everyday use, compare listed specifications and condition, and contact Simple Technologies to confirm availability.",
  alternates: { canonical: "/laptops" },
};
export default async function Laptops() {
  const { data } = configured()
    ? await publicDb()
        .from("laptops")
        .select(
          "id,images,model,cpu,ram,storage,display,condition,description,price,currency",
        )
        .eq("available", true)
        .order("created_at", { ascending: false })
    : { data: [] };
  return (
    <div className="wrap section">
      <div className="page-head">
        <div className="eyebrow">Hardware desk</div>
        <h1>Available laptops</h1>
        <p className="muted">
          Practical systems for work, study and everyday use. Confirm
          availability before arranging a purchase.
        </p>
      </div>
      {data?.length ? (
        <div className="grid">
          {data.map((p) => (
            <article className="card" key={p.id}>
              {(p.images as Shot[])
                ?.filter((s) => s.reviewed)
                .slice(0, 1)
                .map((s) => (
                  <Screenshot
                    key={s.id}
                    src={`/api/media/${s.id}`}
                    alt={s.alt}
                    width={s.width}
                    height={s.height}
                    sizes="(max-width: 600px) calc(100vw - 88px), (max-width: 900px) calc((100vw - 184px) / 2), 315px"
                  />
                ))}
              <h2>{p.model}</h2>
              <p>
                {p.cpu} · {p.ram} · {p.storage}
              </p>
              <p>
                {p.display} · {p.condition}
              </p>
              <p>{p.description}</p>
              <strong>
                {p.price
                  ? `${p.currency} ${Number(p.price).toLocaleString()}`
                  : "Ask for price"}
              </strong>
              <p>
                <Link className="button" href={`/go/laptop/${p.id}`}>
                  Ask about this laptop
                </Link>
              </p>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty">
          <h2>No current listings</h2>
          <p>Tell us your budget and what you need the computer to do.</p>
          <Link href="/contact" className="button">
            Contact us
          </Link>
        </div>
      )}
    </div>
  );
}
