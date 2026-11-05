import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Dev server only; `next build`/`next start` ignore it. `next dev`
  // treats 127.0.0.1 as a different origin from `localhost` and refuses it
  // on the /_next/hmr websocket, and without that connection the dev
  // client stalls (client-only components such as Date Night's deck never
  // mount). The e2e suite runs against a production build, but it opens
  // the app at 127.0.0.1, so anyone pointing it (or a browser) at a dev
  // server there would hit that.
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
