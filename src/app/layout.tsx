import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/site-header";
import { Consent } from "@/components/consent";
import { siteUrl, jsonLd, settings } from "@/lib/data";
import { themeScript } from "@/lib/theme";
import "./globals.css";
export async function generateMetadata(): Promise<Metadata> {
  const s = await settings();
  return {
    metadataBase: new URL(siteUrl()),
    title: {
      default: `${s.brand} — Practical computer fixes`,
      template: `%s | ${s.brand}`,
    },
    description: s.description,
    applicationName: s.brand,
    alternates: {
      types: { "application/rss+xml": [{ url: "/rss.xml", title: s.brand }] },
    },
    robots: { index: true, follow: true, "max-image-preview": "large" },
    verification: {
      google: process.env.NEXT_PUBLIC_SEARCH_CONSOLE_VERIFICATION,
    },
    openGraph: { type: "website", siteName: s.brand, locale: "en_US" },
    twitter: { card: "summary" },
  };
}
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const s = await settings();
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          id="theme-init"
          dangerouslySetInnerHTML={{ __html: themeScript }}
        />
      </head>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <SiteHeader brand={s.brand} />
        <main id="main">{children}</main>
        <footer>
          <div className="wrap footer-inner">
            <div>
              <strong>{s.brand}</strong>
              <p>Practical fixes. Carefully documented.</p>
            </div>
            <div className="footer-links">
              <Link href="/about">About</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <Link href="/disclosure">Affiliate disclosure</Link>
              <Link href="/rss.xml">RSS</Link>
            </div>
          </div>
        </footer>
        <Consent />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": `${siteUrl()}/#website`,
                  name: s.brand,
                  description: s.description,
                  url: siteUrl(),
                  inLanguage: "en",
                  publisher: { "@id": `${siteUrl()}/#organization` },
                },
                {
                  "@type": "Organization",
                  "@id": `${siteUrl()}/#organization`,
                  name: s.brand,
                  url: siteUrl(),
                },
              ],
            }),
          }}
        />
      </body>
    </html>
  );
}
