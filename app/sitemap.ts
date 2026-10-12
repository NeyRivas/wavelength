import type { MetadataRoute } from "next";

const BASE_URL = "https://sameeeish.com";

/**
 * Only the approved, canonical marketing pages — no questionnaire
 * tokens, results, or other dynamic app routes (see app/robots.ts for the
 * matching disallow + noindex on those). Includes /play and its four
 * subroutes — real, indexable content (the actual "Let's play"/"Start
 * playing" destination, plus Dating & Couples, Friends, Date Night, and
 * the dedicated "getting to know each other questions" landing page).
 *
 * `lastModified` dates are static, not `new Date()` recomputed on every
 * build/request — a sitemap that claims every page changed "right now"
 * on every single build is a worse signal to a crawler than no date at
 * all. Each date below is the real date that route's own content last
 * meaningfully changed (its `page.tsx`'s own last commit, or today for
 * the routes touched in a given SEO pass). These are necessarily
 * hand-maintained: bump a route's date here when its content next
 * actually changes, not on every deploy.
 */
const LAST_MODIFIED = {
  home: new Date("2026-10-11"), // app/page.tsx: added home metadata (this pass)
  howItWorks: new Date("2026-09-26"),
  waysToPlay: new Date("2026-10-11"), // added the /for-couples contextual link (this pass)
  forCouples: new Date("2026-10-11"), // title/description reworked (this pass)
  faq: new Date("2026-09-26"),
  about: new Date("2026-10-09"),
  privacy: new Date("2026-10-09"),
  terms: new Date("2026-10-09"),
  contact: new Date("2026-10-09"),
  play: new Date("2026-10-03"),
  playDatingCouples: new Date("2026-10-12"), // added the new-page contextual link (this pass)
  playFriends: new Date("2026-09-26"),
  dateNight: new Date("2026-10-11"), // server-rendered question preview added (this pass)
  gettingToKnowEachOther: new Date("2026-10-12"), // new dedicated landing page (this pass)
} as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${BASE_URL}/`,
      lastModified: LAST_MODIFIED.home,
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/how-it-works`,
      lastModified: LAST_MODIFIED.howItWorks,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/ways-to-play`,
      lastModified: LAST_MODIFIED.waysToPlay,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      // The actual destination of the site's "Let's play"/"Start
      // playing" CTAs (components/landing/landing-hero.tsx,
      // landing-header.tsx) — same priority tier as /how-it-works and
      // /ways-to-play, the other two primary-nav destinations.
      url: `${BASE_URL}/play`,
      lastModified: LAST_MODIFIED.play,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/for-couples`,
      lastModified: LAST_MODIFIED.forCouples,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/play/dating-couples`,
      lastModified: LAST_MODIFIED.playDatingCouples,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/play/friends`,
      lastModified: LAST_MODIFIED.playFriends,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/play/dating-couples/date-night`,
      lastModified: LAST_MODIFIED.dateNight,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      // The new dedicated "getting to know each other questions" landing
      // page — same priority tier as its sibling, Date Night.
      url: `${BASE_URL}/play/dating-couples/getting-to-know-each-other-questions`,
      lastModified: LAST_MODIFIED.gettingToKnowEachOther,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: LAST_MODIFIED.faq,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: LAST_MODIFIED.about,
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: LAST_MODIFIED.contact,
      changeFrequency: "yearly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: LAST_MODIFIED.privacy,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: LAST_MODIFIED.terms,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
