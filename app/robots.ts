import type { MetadataRoute } from "next";

const BASE_URL = "https://sameeeish.com";

/**
 * Technical-SEO pass: disallow the app's real functional/dynamic routes,
 * leave every marketing page crawlable by the standard "anything not
 * disallowed is allowed" robots.txt default rather than hand-maintaining
 * a parallel `allow` list.
 *
 * A previous version of this file paired `disallow` with an explicit
 * `allow` array naming only 5 routes ("/", "/how-it-works", "/for-couples",
 * "/faq", "/ways-to-play") — it was already stale (missing /about,
 * /contact, and the entire /play tree, including /play itself, the
 * actual destination of the site's own "Let's play"/"Start playing"
 * CTAs) and, structurally, an allow-list like that can only ever drift
 * further out of date: every new marketing route needs a matching edit
 * here, and forgetting one doesn't fail loudly — it just quietly leaves
 * a real page undeclared. Dropping it entirely removes that whole class
 * of bug: any current or future route under app/ is crawlable unless
 * it's under one of the two disallowed prefixes below.
 *
 * /create requires a signed-in/anonymous user
 * (lib/supabase/identity.ts's requireUserId) and renders a personal
 * in-progress draft, and /w/[token] (and its /answer, /result
 * sub-routes) are per-pair, token-scoped private questionnaire/result
 * pages — none of these are content meant for search results, so
 * they're excluded rather than left to be discovered and crawled. See
 * each of those routes' own `generateMetadata`/`metadata` for the
 * matching `robots: { index: false }` — disallowing the crawl here
 * stops Googlebot from ever fetching these, but a disallowed URL can
 * still get indexed (as a bare link with no snippet) if it's discovered
 * some other way, since Google never crawls far enough to see a noindex
 * tag on a page it's told not to fetch; the noindex tags are the actual
 * backstop against that, this is just the first line of defense.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: ["/create", "/w/"],
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
