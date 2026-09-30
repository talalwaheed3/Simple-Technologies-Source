import Link from "next/link";
import { configured, publicDb } from "@/lib/supabase";
import type { Post } from "@/lib/types";
export async function AffiliateRecommendations({ post }: { post: Post }) {
  if (!configured()) return null;
  const { data } = await publicDb()
    .from("affiliate_links")
    .select("id,name,disclosure")
    .eq("enabled", true)
    .or(
      `category.eq.${post.category.replace(/[(),.]/g, "")},post_ids.cs.{${post.id}}`,
    )
    .limit(2);
  if (!data?.length) return null;
  return (
    <aside className="notice">
      <h2>Useful for this repair</h2>
      {data.map((p) => (
        <div key={p.id}>
          <Link
            href={`/go/affiliate/${p.id}?post=${post.id}`}
            rel="sponsored nofollow"
          >
            {p.name} →
          </Link>
          <p className="small muted">{p.disclosure}</p>
        </div>
      ))}
    </aside>
  );
}
