import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { ForFriendsGames } from "@/components/landing/for-friends-games";
import { ForFriendsHero } from "@/components/landing/for-friends-hero";
import { ForFriendsHowItWorks } from "@/components/landing/for-friends-how-it-works";
import { LandingCtaSection } from "@/components/landing/landing-cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

// /for-friends — the Friends category's own informational page, the
// equivalent of /for-couples for the Friends side of the product. Did
// not exist before this pass (confirmed by inspecting app/ and grepping
// the repo for "for-friends"/"ForFriends" — nothing). Same pattern as
// every other marketing route: own font instantiation, shared
// LandingHeader/LandingFooter/LandingCtaSection, .landing wrapper. No
// new functionality, routing, Supabase, scoring, or business-logic
// changes — purely presentational, and purely about the two games that
// already exist (lib/wavelength/ready-made-games.ts: "How Well Do You
// Know Me?" and "Friendship Check"). Deliberately a smaller page than
// /for-couples (3 sections instead of 6): enough to accurately explain
// the real experience and give a clear way into /play/friends, not an
// attempt to pad this out to the same length as the couples page for its
// own sake.
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

const PAGE_DESCRIPTION =
  "Two friendship trivia games for the two of you — answer first, then see how many your friend guesses right. No score on your friendship, just a fun way to find out who really knows who.";

export const metadata: Metadata = {
  title: "Questions for Friends — Sameeeish",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/for-friends",
  },
  openGraph: {
    title: "Questions for Friends — Sameeeish",
    description: PAGE_DESCRIPTION,
    url: "/for-friends",
    siteName: "Sameeeish",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Questions for Friends — Sameeeish",
    description: PAGE_DESCRIPTION,
  },
};

export default function ForFriendsPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--internal`}>
      <LandingHeader />
      <main>
        <ForFriendsHero />
        <ForFriendsGames />
        <ForFriendsHowItWorks />
        <LandingCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
