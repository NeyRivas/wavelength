import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { BackLink } from "@/components/landing/back-link";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { GameCategorySection } from "@/components/play/game-category-section";

// /play/friends — /play's other category screen (see
// app/play/page.tsx and app/play/dating-couples/page.tsx). Each card links
// to its game's own experience page (lib/wavelength/ready-made-games.ts's
// `href`), whose Start buttons start the game.
//
// SEO (Oct 2026 keyword map): positioned as the catalog, around
// "friendship quizzes & games". The two games' own terms ("how well do you
// know me quiz", "friendship test") belong to their experience pages.
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

const PAGE_TITLE = "Friendship Quizzes & Games — Sameeeish";
const PAGE_DESCRIPTION =
  "Friendship quizzes and games for two: a how well do you know me quiz and a friendship test about your shared memories. Free, no sign-up.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/play/friends",
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: "/play/friends",
    siteName: "Sameeeish",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

export default function FriendsPlayPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--internal`}>
      <LandingHeader />
      <main>
        <BackLink href="/play" />
        <GameCategorySection
          group="friends"
          heading="Friendship Quizzes & Games"
          text="Two guessing games for you and a friend. Find out how well they know you, or how well they remember the moments you've shared."
        />
      </main>
      <LandingFooter />
    </div>
  );
}
