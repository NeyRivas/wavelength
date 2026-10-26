import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { BackLink } from "@/components/landing/back-link";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { CompatibilityTestContent } from "@/components/play/compatibility-test-content";

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
const PAGE_TITLE = "Couples Compatibility Test: Answer Apart, Compare Together — Sameeeish";
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
  },
  twitter: {
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

export default function CouplesCompatibilityTestPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--internal`}>
      <LandingHeader />
      <main>
        <BackLink href="/play/dating-couples" />
        <CompatibilityTestContent />
      </main>
      <LandingFooter />
    </div>
  );
}
