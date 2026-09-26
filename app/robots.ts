import type { MetadataRoute } from "next";

const BASE_URL = "https://sameeeish.com";

/**
 * Basic technical-SEO pass: allow the approved public marketing pages,
 * disallow the app's real functional/dynamic routes. /create
 * requires a signed-in/anonymous user (lib/supabase/identity.ts's
 * requireUserId) and renders a personal in-progress draft, and /w/[token]
 * (and its /answer, /result sub-routes) are per-pair, token-scoped
 * private questionnaire/result pages — none of these are content meant
 * for search results, so they're excluded rather than left to be
 * discovered and crawled.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/how-it-works", "/for-couples", "/faq", "/ways-to-play"],
      disallow: ["/create", "/w/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
