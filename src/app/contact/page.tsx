import Link from "next/link";
import { settings } from "@/lib/data";
export const metadata = {
  title: "Contact",
  description:
    "Contact Simple Technologies about computer troubleshooting, guide corrections, laptop availability or remote IT support.",
  alternates: { canonical: "/contact" },
};
export default async function Contact() {
  const s = await settings();
  return (
    <div className="wrap section">
      <article className="prose">
        <h1>Contact Simple Technologies</h1>
        <p>
          For a repair question, a correction, a privacy request or a laptop
          enquiry, tell us what you need.
        </p>
        {s.email && (
          <p>
            <a href={`mailto:${s.email}`}>{s.email}</a>
          </p>
        )}
        <div className="form-actions">
          <Link className="button" href="/request">
            Send a request
          </Link>
          <Link className="button secondary" href="/support">
            Remote support options
          </Link>
        </div>
      </article>
    </div>
  );
}
