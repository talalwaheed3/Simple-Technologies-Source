# WhatsApp remote support — 30 September 2026

Deployed to https://simple-technologies.vercel.app as `dpl_GxDC3F2JqnVsH9yZjmWtAdxxwz42`.

- Header navigation (desktop and mobile), the homepage/article “Still stuck?” buttons, and the remote-support page use the WhatsApp icon and click-to-chat link.
- Dedicated remote-support number: `03249593746`, represented as `923249593746` in the link. It is centralized in `src/lib/whatsapp.ts`.
- Generic buttons prefill a remote-support request; article buttons include the public guide title. The visitor sends the message from WhatsApp.
- Uses [WhatsApp's documented universal link](https://faq.whatsapp.com/425247423114725/) so WhatsApp handles the mobile-app or desktop/Web handoff. No browser sniffing, external widget script or extra dependency is required.
- TypeScript, ESLint, the production build, 98 existing unit/database tests and all 30 existing browser regressions passed locally.
- Dedicated desktop and 360px mobile browser checks passed both locally and on production: visible icons, correct phone number, encoded message, working new-tab clicks, isolated opener, and no runtime errors or horizontal overflow. The external WhatsApp destination was intercepted during click checks; no message was sent and no physical installed-app handoff was exercised.

The feature did not change article data or site settings. Other outbound contact destinations retain their existing settings.
