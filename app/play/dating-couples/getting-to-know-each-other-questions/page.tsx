import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { BackLink } from "@/components/landing/back-link";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { GettingToKnowContent } from "@/components/play/getting-to-know-content";

/**
 * /play/dating-couples/getting-to-know-each-other-questions — the single,
 * integrated experience page for the "getting-to-know-you" ready-made game
 * (lib/wavelength/ready-made-games.ts): editorial content and direct access
 * to the existing questionnaire on one URL. The game's catalog card on
 * /play/dating-couples links here (its only button), the same pattern as
 * 36 Questions and Date Night; this page's Start buttons submit the
 * unchanged startReadyMadeGame action with the same gameId the card used to
 * submit directly, so drafts start and resume exactly as before.
 *
 * Same shell every other /play/dating-couples/* route uses (own font
 * instantiation, shared LandingHeader/LandingFooter/BackLink, .landing
 * landing--internal wrapper). The page body lives in GettingToKnowContent.
 *
 * Keyword map (Oct 2026 research): title targets "getting to know you
 * questions for couples"; the H1 and URL keep "getting to know each other
 * questions", the phrasing that already earns impressions. The URL and its
 * canonical are unchanged.
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

const PAGE_PATH = "/play/dating-couples/getting-to-know-each-other-questions";
const PAGE_TITLE = "Getting to Know You Questions for Couples — Sameeeish";
const PAGE_DESCRIPTION =
  "12 getting to know you questions for couples and early dates. Answer on your own, send the link, then see where you match. Free, no sign-up.";

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

export default function GettingToKnowEachOtherQuestionsPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--internal`}>
      <LandingHeader />
      <main>
        <BackLink href="/play/dating-couples" />
        <GettingToKnowContent />
      </main>
      <LandingFooter />
    </div>
  );
}
