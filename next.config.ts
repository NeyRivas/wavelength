import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Dev server only; `next build`/`next start` ignore it. Playwright
  // (playwright.config.ts) opens the app at 127.0.0.1, which `next dev`
  // treats as a different origin from `localhost` and refuses on the
  // /_next/hmr websocket. Without that connection the dev client stalls:
  // Date Night's client-only deck never mounts and the guided quiz stops
  // advancing, so those e2e specs failed against `next dev` while passing
  // against a production build.
  allowedDevOrigins: ["127.0.0.1"],
  // A private or unknown URL (/create, /w/[token]/*, a 404 for a mistyped
  // share link — anything outside lib/analytics/ga-privacy-guard.ts's
  // PUBLIC_PATHS) must never reach a public page as `document.referrer`:
  // the browser's default policy hands the full same-origin URL — share
  // token included — to the next page on every full page load, and gtag
  // reports it as `page_referrer`. Every move between a private and a
  // public page is a full page load (the guard forces one), so this
  // header, which strips the referrer down to the origin, is what keeps it
  // out. Site-wide because both the page being left and the policy it was
  // loaded with decide what's sent.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [{ key: "Referrer-Policy", value: "strict-origin" }],
      },
    ];
  },
};

export default nextConfig;
