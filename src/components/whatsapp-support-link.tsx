import type { ReactNode } from "react";
import { remoteSupportWhatsAppUrl } from "@/lib/whatsapp";

export function WhatsAppSupportLink({
  children = "Get remote support",
  className = "button",
  articleTitle,
}: {
  children?: ReactNode;
  className?: string;
  articleTitle?: string;
}) {
  return (
    <a
      href={remoteSupportWhatsAppUrl(articleTitle)}
      className={`whatsapp-contact ${className}`}
      target="_blank"
      rel="noopener noreferrer"
      title="Chat on WhatsApp (opens in a new tab or the WhatsApp app)"
    >
      <svg
        className="whatsapp-icon"
        width="21"
        height="21"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M20.52 3.48A11.89 11.89 0 0 0 12.06 0C5.47 0 .11 5.36.1 11.95c0 2.11.55 4.17 1.6 5.99L0 24l6.23-1.63a11.96 11.96 0 0 0 5.82 1.48h.01c6.59 0 11.95-5.36 11.96-11.95 0-3.19-1.24-6.2-3.5-8.46ZM12.06 21.83a9.92 9.92 0 0 1-5.06-1.38l-.36-.21-3.7.97.99-3.61-.23-.37a9.9 9.9 0 0 1-1.52-5.28c0-5.47 4.45-9.92 9.93-9.92a9.85 9.85 0 0 1 7.02 2.91 9.85 9.85 0 0 1 2.91 7.02c-.01 5.47-4.46 9.92-9.98 9.87Zm5.44-7.44c-.3-.15-1.77-.87-2.05-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.18.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.88-.79-1.48-1.77-1.65-2.07-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.03-1.04 2.5 0 1.47 1.07 2.89 1.22 3.09.15.2 2.11 3.22 5.12 4.52.72.31 1.28.5 1.71.64.72.23 1.37.2 1.88.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35Z" />
      </svg>
      <span>{children}</span>
      <span className="sr-only"> on WhatsApp (opens in a new tab or app)</span>
    </a>
  );
}
