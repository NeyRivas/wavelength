import type { FaqItem } from "@/components/landing/faq-data";

/**
 * schema.org object builders for JSON-LD (rendered by
 * components/seo/json-ld.tsx). Each one mirrors content that's already
 * visible in the page's own server-rendered HTML — never a separate,
 * invented description of the page — so the markup can't drift from what
 * a crawler (or a person) actually sees.
 */

export const SITE_URL = "https://sameeeish.com";

/** One question's worth of schema.org Question/Answer, from the same
 * `FaqItem` shape FaqAccordion/ExperienceFaq already render. Used for
 * /faq (every category, flattened — FaqSection shows all of them in the
 * initial HTML, just visually collapsed) and for each experience page's
 * own "Questions people ask" section. */
export function faqPageJsonLd(items: readonly FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export interface BreadcrumbSegment {
  label: string;
  href: string;
}

/** Matches the visible trail components/landing/breadcrumbs.tsx renders
 * — same segments, same order, same hrefs — since Google's own
 * structured-data guidelines expect BreadcrumbList to reflect the page
 * the user actually sees. */
export function breadcrumbListJsonLd(trail: readonly BreadcrumbSegment[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((segment, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: segment.label,
      item: `${SITE_URL}${segment.href === "/" ? "" : segment.href}`,
    })),
  };
}

/** The site as a brand entity — name/url/logo only. No `sameAs` social
 * profiles: none are linked anywhere else on the site (confirmed by
 * grepping the footer and layout), and inventing one here would be
 * exactly the kind of unverifiable claim this file's own rule (mirror
 * what's real, never invent) exists to rule out. `logo` points at the
 * real, already-generated apple touch icon (app/apple-icon.tsx) rather
 * than a new asset. */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Sameeeish",
    url: SITE_URL,
    logo: `${SITE_URL}/apple-icon`,
  };
}

/** The site itself, for the "Sameeeish" brand/site-name association in
 * search results. No `potentialAction` (SearchAction) — the site has no
 * internal search feature to describe. */
export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Sameeeish",
    url: SITE_URL,
  };
}
