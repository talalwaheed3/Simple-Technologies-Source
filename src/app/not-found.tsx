import Link from "next/link";
export default function NotFound() {
  return (
    <div className="wrap section">
      <div className="empty">
        <div className="eyebrow">404 / Not on this workbench</div>
        <h1>That solution is not available.</h1>
        <p>
          The address may have changed, or this article is not published yet.
        </p>
        <Link className="button" href="/solutions">
          Search the solutions
        </Link>
      </div>
    </div>
  );
}
