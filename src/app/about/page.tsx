import Link from "next/link";
export const metadata = {
  title: "From the repair bench",
  description:
    "Learn how Simple Technologies documents practical computer repairs, checks repair outcomes and handles corrections to troubleshooting guides.",
  alternates: { canonical: "/about" },
};
export default function Page() {
  return (
    <div className="wrap section">
      <article className="prose">
        <h1>From the repair bench</h1>
        <p>
          Simple Technologies brings practical computer troubleshooting into one
          searchable place. The work behind it comes from hands-on laptop sales,
          repair and IT support.
        </p>
        <p>
          Our guides distinguish observed symptoms, technical guidance checked
          against references, and confirmed repair outcomes. Reviewed guidance
          can be published without claiming that the original repair outcome
          was confirmed. Material that still needs technical verification stays
          private. We do not invent credentials, repair outcomes or customer
          testimonials.
        </p>
        <p>
          Devices differ. Follow the warnings in each guide, and stop when a
          step puts important data at risk. If a guide needs a correction, tell
          us through the contact page.
        </p>
        <Link href="/contact">Contact Simple Technologies →</Link>
      </article>
    </div>
  );
}
