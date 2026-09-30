import type { PostSummary } from "./types";
export function featured(
  posts: PostSummary[],
  threshold = 30,
  totalEngagement?: number,
) {
  const available = posts.filter(
    (p) =>
      p.status === "published" &&
      p.published_at &&
      Date.parse(p.published_at) <= Date.now(),
  );
  const latest = [...available].sort(
    (a, b) =>
      Date.parse(b.published_at!) - Date.parse(a.published_at!) ||
      a.id.localeCompare(b.id),
  );
  if (
    (totalEngagement ?? available.reduce((n, p) => n + p.views + p.likes, 0)) <
    threshold
  )
    return latest
      .slice(0, 3)
      .map((post) => ({ post, label: "Latest solution" }));
  const result: { post: PostSummary; label: string }[] = [];
  if (latest[0]) result.push({ post: latest[0], label: "Latest solution" });
  for (const [metric, label] of [
    ["views", "Most viewed"],
    ["likes", "Most helpful"],
  ] as const) {
    const next = available
      .filter((p) => !result.some((r) => r.post.id === p.id))
      .sort(
        (a, b) =>
          b[metric] - a[metric] ||
          Date.parse(b.published_at!) - Date.parse(a.published_at!) ||
          a.id.localeCompare(b.id),
      )[0];
    if (next)
      result.push({
        post: next,
        label: next[metric] > 0 ? label : "Latest solution",
      });
  }
  return result;
}
