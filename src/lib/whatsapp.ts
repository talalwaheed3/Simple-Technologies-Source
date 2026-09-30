// Pakistan local number 03249593746 in WhatsApp's international digits-only form.
export const REMOTE_SUPPORT_WHATSAPP_NUMBER = "923249593746";

export function remoteSupportWhatsAppUrl(articleTitle?: string) {
  const message = articleTitle
    ? `Hi, I need remote support with this guide: ${articleTitle}`
    : "Hi, I need remote support with my computer.";
  return `https://wa.me/${REMOTE_SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
