import Link from "next/link";
export const metadata = {
  title: "Terms of Use",
  description:
    "Read the terms for using Simple Technologies troubleshooting guides, submitting requests, arranging paid support and checking product availability.",
  alternates: { canonical: "/terms" },
};
export default function Page() {
  return (
    <div className="wrap section">
      <article className="prose">
        <h1>Terms of Use</h1>
        <p>
          These guides provide general troubleshooting information. Hardware,
          firmware, software versions and data conditions vary; no guide
          guarantees a repair.
        </p>
        <p>
          Back up important data before making changes. Stop and seek
          appropriate assistance if a drive is failing or a procedure is outside
          your experience. Only work on devices and accounts you own or are
          authorized to service.
        </p>
        <p>
          Do not submit unlawful, abusive, private or misleading content. We may
          moderate or remove submissions. A submitted request does not guarantee
          a reply or free support.
        </p>
        <p>
          Paid work requires a separately agreed scope, price and terms before
          it begins. Product availability and prices must be confirmed before
          purchase. Nothing in these terms excludes rights that cannot legally
          be excluded.
        </p>
        <p>
          Contact Simple Technologies through the Contact page for corrections
          or questions.
        </p>
        <Link href="/contact">Contact Simple Technologies →</Link>
      </article>
    </div>
  );
}
