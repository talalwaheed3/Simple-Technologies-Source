import Link from "next/link";
export const metadata = {
  title: "Affiliate Disclosure",
  description:
    "Learn how affiliate recommendations, commissions, remote support and laptop sales relate to the free troubleshooting guides on Simple Technologies.",
  alternates: { canonical: "/disclosure" },
};
export default function Page() {
  return (
    <div className="wrap section">
      <article className="prose">
        <h1>Affiliate Disclosure</h1>
        <p>
          Some guides may contain links to relevant products or services. When a
          link is an affiliate link, we may earn a commission from a qualifying
          purchase. The relevant recommendation includes a disclosure.
        </p>
        <p>
          We aim to recommend products only when they help with the problem
          being discussed. A paid recommendation does not establish that a
          product will fix your specific device. Check compatibility, current
          prices and the seller’s terms before purchasing.
        </p>
        <p>
          The site can also offer remote support and laptop sales. These are
          separate from the free troubleshooting guides.
        </p>
        <Link href="/contact">Contact Simple Technologies →</Link>
      </article>
    </div>
  );
}
