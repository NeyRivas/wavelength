import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // /create and /w/[token]/* (the private routes app/robots.ts disallows and
  // components/analytics/google-analytics.tsx keeps Google Analytics off
  // for) must never reach a public page as `document.referrer`: the
  // browser's default policy hands the full same-origin URL — share token
  // included — to the next page on any full page load (a plain <a>,
  // open-in-new-tab on a <Link>), and gtag reports it as `page_referrer`.
  // Site-wide rather than only on those routes because App Router
  // navigations keep the first document — and its policy — so a visit that
  // reached /w/[token] client-side from / is still governed by /'s header.
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
