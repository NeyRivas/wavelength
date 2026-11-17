import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { Breadcrumbs } from "@/components/landing/breadcrumbs";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { CompatibilityTestContent } from "@/components/play/compatibility-test-content";
import { playExperienceBreadcrumb } from "@/lib/seo/breadcrumbs";

/**
 * /play/dating-couples/couples-compatibility-test — the integrated
 * experience page for the "Are we on the same page?" ready-made game (the
 * couples compatibility quiz): editorial content and direct access to the
 * existing questionnaire on one URL. Its Couples catalog card links here
 * (its only button); the page's Start buttons submit the unchanged
 * startReadyMadeGame action with the game's id.
 *
 * Keyword map (Oct 2026 research): primary "couples compatibility test",
 * with "relationship compatibility test", "couples quiz", and
 * "compatibility quiz" variants. The plain head term "compatibility test"
 * is mostly zodiac/name searches, so the page says plainly that it isn't
 * one. /play/dating-couples was retitled ("Couples Games & Questions") in
 * the same change so the two pages don't compete for this term.
 */
const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "500", "600"],
  variable: "--font-fraunces",
  display: "swap",
});

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

const PAGE_PATH = "/play/dating-couples/couples-compatibility-test";
// SEO pass: shortened from "Couples Compatibility Test: Answer Apart,
// Compare Together — Sameeeish" (70 characters) — past the ~60-character
// point where Google tends to truncate a <title> in search results.
// "Answer Apart" is kept (the disambiguation from zodiac/name
// compatibility tests the keyword-map note above calls out); "Compare
// Together" is dropped since the page's own content and description
// already make that part clear.
const PAGE_TITLE = "Couples Compatibility Test — Answer Apart — Sameeeish";
const PAGE_DESCRIPTION =
  "A free couples compatibility test: 12 questions on love, conflict, money, kids, and the future. Answer separately, then see where you're aligned. No sign-up.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_PATH,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_PATH,
    siteName: "Sameeeish",
    type: "website",
    images: ["/opengraph-image"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/twitter-image"],
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

export default function CouplesCompatibilityTestPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--internal`}>
      <LandingHeader />
      <main>
        <Breadcrumbs
          trail={playExperienceBreadcrumb("dating-couples", "how-well-do-you-know-each-other")}
        />
        <CompatibilityTestContent />
      </main>
      <LandingFooter />
    </div>
  );
}
