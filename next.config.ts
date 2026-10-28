import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Motion isn't on Next's default list; without this, importing hooks
    // from the "motion/react" barrel bundles the whole library instead of
    // only the pieces used (components use `m` from "motion/react-m").
    optimizePackageImports: ["motion"],
  },
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
