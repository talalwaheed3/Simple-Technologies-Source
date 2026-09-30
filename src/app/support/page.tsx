import Link from "next/link";
import { settings } from "@/lib/data";
import { WhatsAppSupportLink } from "@/components/whatsapp-support-link";
export const metadata = {
  title: "Remote IT support",
  description:
    "Explore remote IT support for Windows setup, driver problems, boot errors and everyday computer troubleshooting, and learn how to prepare for a session.",
  alternates: { canonical: "/support" },
};
export default async function Support({
  searchParams,
}: {
  searchParams: Promise<{ post?: string }>;
}) {
  const s = await settings(),
    p = await searchParams;
  const suffix = p.post ? `?post=${encodeURIComponent(p.post)}` : "";
  return (
    <div className="wrap section">
      <div className="prose">
        <div className="eyebrow">Talk to a technician</div>
        <h1>Let’s work through the next step.</h1>
        <p>
          Get help with Windows setup, driver problems, boot errors and everyday
          computer troubleshooting. Describe what happens and where you got
          stuck.
        </p>
        <div className="notice">
          <strong>Before a remote session</strong>
          <p>
            Keep a backup of important files. You stay in control of your
            device. Never send passwords or recovery keys in a message. Physical
            hardware faults and failing drives may need in-person attention.
          </p>
        </div>
        <div className="form-actions">
          {s.support_url && (
            <Link className="button" href={`/go/support/fiverr${suffix}`}>
              View support service
            </Link>
          )}
          <WhatsAppSupportLink>Chat on WhatsApp</WhatsAppSupportLink>
          {s.booking_url && (
            <Link className="button" href={`/go/support/booking${suffix}`}>
              Book a session
            </Link>
          )}
          <Link className="button secondary" href="/request">
            Describe your problem
          </Link>
        </div>
      </div>
    </div>
  );
}
