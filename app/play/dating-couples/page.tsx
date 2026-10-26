import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { BackLink } from "@/components/landing/back-link";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { GameCategorySection } from "@/components/play/game-category-section";

// /play/dating-couples — one of /play's two category screens (see
// app/play/page.tsx). Every card links to its experience's own page (one
// clear action per card, lib/wavelength/ready-made-games.ts's `href`):
// "Are we on the same page?" → the couples compatibility test page,
// "Getting to know each other" and "36 Questions to Fall in Love" → their
// experience pages, whose Start buttons start the game, and "Date Night" →
// its standalone conversation-starter deck.
//
// SEO (Oct 2026 keyword map): positioned as the catalog, around "couples
// games & questions". It used to carry "compatibility quiz for couples",
// which now belongs to /play/dating-couples/couples-compatibility-test, so
// the two pages don't compete. "Questions for couples" stays with
// /for-couples. GameCategorySection itself (shared with /play/friends) is
// untouched — only this page's own metadata and heading/text props.
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

const PAGE_TITLE = "Couples Games & Questions — Sameeeish";
const PAGE_DESCRIPTION =
  "Games and questions for couples: a compatibility test, getting to know you questions, 36 questions to fall in love, and date night questions. Free, no sign-up.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/play/dating-couples",
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: "/play/dating-couples",
    siteName: "Sameeeish",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

export default function DatingCouplesPlayPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--internal`}>
      <LandingHeader />
      <main>
        <BackLink href="/play" />
        <GameCategorySection
          group="dating-couples"
          heading="Couples Games & Questions"
          text="Four ways to learn something new about each other. See where you're aligned on the big topics, get to know each other a little better, go deeper with 36 questions, or pick a date night question and see where it goes."
        />
      </main>
      <LandingFooter />
    </div>
  );
}
