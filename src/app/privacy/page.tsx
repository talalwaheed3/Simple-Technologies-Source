import Link from "next/link";
export const metadata = {
  title: "Privacy Policy",
  description:
    "How Simple Technologies handles comments, support requests, privacy choices, optional analytics and advertising, and requests to access or delete your data.",
  alternates: { canonical: "/privacy" },
};
export default function Page() {
  return (
    <div className="wrap section">
      <article className="prose">
        <h1>Privacy Policy</h1>
        <p>
          We collect only the information needed to operate this site and
          respond to requests.
        </p>
        <p>
          Helpful votes use a random, signed, first-party identifier stored for
          up to one year. Article views are deduplicated per identifier, article
          and UTC day. These are approximate visits, not a count of people.
          Referring hostnames are recorded without full referring URLs. No
          device fingerprint is created.
        </p>
        <p>
          Comments collect the display name and message you supply and are
          moderated before publication. Requests collect problem details, an
          optional email and optional private screenshot. Do not submit
          passwords, account keys, customer records or other sensitive
          information.
        </p>
        <p>
          To limit abuse, the server stores a keyed daily hash of your network
          address, not the raw address, in short-lived rate-limit records.
          Infrastructure providers may maintain their own security logs. Search
          terms are logged to improve coverage; obvious emails and long numbers
          are removed, but please do not search for personal data.
        </p>
        <p>
          Operational analytics and request data are retained for up to 90 days
          by the documented maintenance process. Published comments remain until
          removed. Anonymous active likes remain until removed or an erasure
          request is processed.
        </p>
        <p>
          Optional Google Analytics and advertising load only after you choose
          to allow them. You can change this using Privacy choices. Third-party
          links, including support and affiliate destinations, have their own
          policies.
        </p>
        <p>
          The site uses Vercel and Supabase to host and process data. Data may
          be processed outside your country. For access, correction or deletion,
          use the Contact page and include enough information to locate your
          submission. This policy must be reviewed by the operator when contact
          details, vendors or retention practices change.
        </p>
        <Link href="/contact">Contact Simple Technologies →</Link>
      </article>
    </div>
  );
}
