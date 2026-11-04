import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { BackLink } from "@/components/landing/back-link";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { HowWellDoYouKnowMeContent } from "@/components/play/how-well-do-you-know-me-content";

/**
 * /play/friends/how-well-do-you-know-me — the integrated experience page
 * for the "How Well Do You Know Me?" ready-made game: editorial content and
 * direct access to the existing questionnaire on one URL. Its Friends
 * catalog card links here (its only button); the page's Start buttons
 * submit the unchanged startReadyMadeGame action with the game's id.
 *
 * Keyword map (Oct 2026 research, revisited Nov 2026 for US/UK/CA/AU/NZ):
 * "how well do you know me quiz" and "… questions" (the larger search, served
 * by the extra question list); "best friend quiz/test" variants also belong
 * here (questions about the person), while shared-memory and "friendship
 * quiz"/"bff test" terms belong to /play/friends/friendship-test.
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

const PAGE_PATH = "/play/friends/how-well-do-you-know-me";
const PAGE_TITLE = "How Well Do You Know Me Quiz & Questions — Sameeeish";
const PAGE_DESCRIPTION =
  "Make a how well do you know me quiz for your best friend: 12 questions about you, plus 40 more ideas. Send the link and see their score. Free.";

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

export default function HowWellDoYouKnowMePage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--internal`}>
      <LandingHeader />
      <main>
        <BackLink href="/play/friends" />
        <HowWellDoYouKnowMeContent />
      </main>
      <LandingFooter />
    </div>
  );
}
