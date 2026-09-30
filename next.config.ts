import type { NextConfig } from "next";
const isDevelopment = process.env.NODE_ENV === "development";
const config: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: process.env.NEXT_PUBLIC_SUPABASE_URL
      ? [
          {
            protocol: "https",
            hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
            pathname: "/storage/v1/object/public/article-media/**",
          },
        ]
      : [],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline'${isDevelopment ? " 'unsafe-eval'" : ""} https://www.googletagmanager.com https://pagead2.googlesyndication.com https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self'${isDevelopment ? " ws://localhost:* ws://127.0.0.1:*" : ""} https://*.supabase.co https://*.google-analytics.com https://pagead2.googlesyndication.com; frame-src https://challenges.cloudflare.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'`,
          },
        ],
      },
    ];
  },
};
export default config;
