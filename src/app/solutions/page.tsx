import { notFound } from "next/navigation";
import { posts } from "@/lib/data";
import {
  browseMetadata,
  normalizeBrowseParams,
  solutionsPath,
  type BrowseSearchParams,
} from "@/lib/seo";
import { categories } from "@/lib/types";
import { Card, Empty, Search } from "@/components/ui";
import { SearchEvent } from "@/components/engagement";
export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<BrowseSearchParams>;
}) {
  return browseMetadata(await searchParams);
}
export default async function Browse({
  searchParams,
}: {
  searchParams: Promise<BrowseSearchParams>;
}) {
  const params = normalizeBrowseParams(await searchParams);
  const page = Number(params.page || 1);
  const filters = {
    q: params.q?.slice(0, 200),
    category: params.category,
    os: params.os?.slice(0, 100),
    device: params.device?.slice(0, 100),
    tag: params.tag,
    sort: params.sort,
    page,
  };
  const result = await posts(filters);
  if (page > 1 && !result.posts.length) notFound();
  const pageUrl = (n: number) => solutionsPath({ ...params, page: String(n) });
  return (
    <div className="wrap">
      <div className="page-head">
        <div className="eyebrow">The knowledge base</div>
        <h1>
          {params.category
            ? `${params.category} troubleshooting`
            : "Problems, meet solutions."}
        </h1>
        <p className="muted">
          Search an error message, a device, or what has stopped working.
        </p>
        <Search value={params.q} />
      </div>
      <form className="filters">
        <input type="hidden" name="q" value={params.q || ""} />
        <label className="field">
          Category
          <select name="category" defaultValue={params.category || ""}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Operating system
          <input
            name="os"
            defaultValue={params.os}
            placeholder="e.g. Windows 11"
          />
        </label>
        <label className="field">
          Device
          <input
            name="device"
            defaultValue={params.device}
            placeholder="e.g. Latitude"
          />
        </label>
        <label className="field">
          Tag
          <input
            name="tag"
            defaultValue={params.tag}
            placeholder="e.g. storage"
          />
        </label>
        <label className="field">
          Sort
          <select name="sort" defaultValue={params.sort || "newest"}>
            <option value="newest">Newest</option>
            <option value="views">Most viewed</option>
            <option value="likes">Most helpful</option>
          </select>
        </label>
        <button style={{ marginBottom: 17 }}>Apply</button>
      </form>
      <p className="small muted">
        {result.count} solution{result.count === 1 ? "" : "s"} found
      </p>
      {result.posts.length ? (
        <div className="grid">
          {result.posts.map((post) => (
            <Card post={post} key={post.id} />
          ))}
        </div>
      ) : (
        <Empty
          title={
            params.q
              ? "No matching solution yet"
              : "No published solutions in this view"
          }
        />
      )}
      <nav className="pagination" aria-label="Solution pages">
        {/* A document navigation keeps the head in sync with query-only pages.
            The installed router can retain page-one metadata on client transitions. */}
        {page > 1 && (
          <a className="button secondary" href={pageUrl(page - 1)} rel="prev">
            Previous
          </a>
        )}
        <span>Page {page}</span>
        {page * 12 < result.count && (
          <a className="button secondary" href={pageUrl(page + 1)} rel="next">
            Next
          </a>
        )}
      </nav>
      {params.q && (
        <SearchEvent query={params.q.slice(0, 200)} count={result.count} />
      )}
    </div>
  );
}
