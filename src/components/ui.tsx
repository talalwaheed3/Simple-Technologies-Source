import Link from "next/link";
import {
  ArrowUpRight,
  Eye,
  ThumbsUp,
  Terminal,
  ArrowRight,
} from "lucide-react";
import type { Post, PostSummary } from "@/lib/types";
import { WhatsAppSupportLink } from "./whatsapp-support-link";
export function Empty({
  title = "No solutions published yet",
  children,
}: {
  title?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <Terminal size={30} />
      <h2>{title}</h2>
      <p>
        {children ||
          "Have a specific problem? Tell us what you see and what you have already tried."}
      </p>
      <Link className="button" href="/request">
        Request a solution <ArrowUpRight size={16} />
      </Link>
    </div>
  );
}
export function Card({ post, label }: { post: PostSummary; label?: string }) {
  return (
    <article className="card solution-card">
      <div className="eyebrow">{label || post.category}</div>
      <h3>
        <Link href={`/solutions/${post.slug}`}>{post.title}</Link>
      </h3>
      <p>{post.excerpt}</p>
      <div className="tags">
        <span>{post.category}</span>
        {post.device && <span>{post.device}</span>}
      </div>
      <div className="card-bottom">
        <span className="stats">
          <Eye size={14} />
          {post.views} <ThumbsUp size={14} />
          {post.likes}
        </span>
        <Link href={`/solutions/${post.slug}`}>
          Read solution <ArrowRight size={15} />
        </Link>
      </div>
      {post.published_at && (
        <time className="muted small" dateTime={post.published_at}>
          {new Date(post.published_at).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </time>
      )}
    </article>
  );
}
export function Search({ value = "" }: { value?: string }) {
  return (
    <form action="/solutions" className="search">
      <label className="sr-only" htmlFor="site-search">
        Search problems and solutions
      </label>
      <input
        id="site-search"
        name="q"
        defaultValue={value}
        placeholder="Try ‘SSD not showing’ or an error message"
        maxLength={200}
      />
      <button type="submit">
        Search <ArrowRight size={18} />
      </button>
    </form>
  );
}
export function Support({ post }: { post?: Post }) {
  return (
    <aside className="support">
      <div>
        <span className="eyebrow">A second pair of eyes</span>
        <h2>Still stuck{post?.device ? ` on your ${post.device}` : ""}?</h2>
        <p>
          Tell me where the fix stops working. We can work through the next step
          together.
        </p>
      </div>
      <WhatsAppSupportLink articleTitle={post?.title} />
    </aside>
  );
}
