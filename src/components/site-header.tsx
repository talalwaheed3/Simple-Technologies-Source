"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Terminal } from "lucide-react";
import { WhatsAppSupportLink } from "./whatsapp-support-link";
import { ThemePicker } from "./theme-picker";

export function SiteHeader({ brand }: { brand: string }) {
  const pathname = usePathname();
  const admin = pathname === "/admin" || pathname.startsWith("/admin/");
  const links = admin
    ? [
        ["/admin", "Overview"],
        ["/admin/posts", "Content inventory"],
        ["/admin/requests", "Solution requests"],
        ["/admin/settings", "Settings"],
        ["/", "View public site"],
      ]
    : [
        ["/solutions", "Solutions"],
        ["/categories", "Categories"],
        ["/laptops", "Laptops"],
        ["/support", "Remote support"],
        ["/request", "Request a solution"],
      ];
  return (
    <header>
      <div className="wrap header-inner">
        <Link
          href={admin ? "/admin" : "/"}
          className="brand"
          aria-label={`${brand} — ${admin ? "admin overview" : "home"}`}
        >
          <span className="brand-icon">
            <Terminal size={24} />
          </span>
          <span>
            {brand}
            <small>
              {admin ? "TECHNICIAN WORKSPACE" : "THE TROUBLESHOOTING DESK"}
            </small>
          </span>
        </Link>
        <nav
          className="top-nav"
          aria-label={admin ? "Workspace navigation" : "Main navigation"}
        >
          {links.map(([href, label], index) =>
            href === "/support" ? (
              <WhatsAppSupportLink key={href} className="nav-whatsapp">
                {label}
              </WhatsAppSupportLink>
            ) : (
              <Link
                key={href}
                href={href}
                className={
                  index === links.length - 1 ? "nav-request" : undefined
                }
              >
                {label}
              </Link>
            ),
          )}
        </nav>
        <ThemePicker />
        <details className="mobile-menu" key={pathname}>
          <summary>Menu</summary>
          <nav aria-label="Mobile navigation">
            {links.map(([href, label]) =>
              href === "/support" ? (
                <WhatsAppSupportLink key={href} className="nav-whatsapp">
                  {label}
                </WhatsAppSupportLink>
              ) : (
                <Link key={href} href={href}>
                  {label}
                </Link>
              ),
            )}
          </nav>
        </details>
      </div>
    </header>
  );
}
