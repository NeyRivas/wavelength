import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { BackLink } from "@/components/landing/back-link";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { GameCategorySection } from "@/components/play/game-category-section";

// /play/friends — /play's other category screen (see
// app/play/page.tsx and app/play/dating-couples/page.tsx). Neither game
// here has a real question set yet (lib/wavelength/ready-made-games.ts) —
// both render as prepared-but-inert cards.
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

const PAGE_DESCRIPTION = "Ready-made games for your favorite people.";

export const metadata: Metadata = {
  title: "Friends — Sameeeish",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/play/friends",
  },
  openGraph: {
    title: "Friends — Sameeeish",
    description: PAGE_DESCRIPTION,
    url: "/play/friends",
    siteName: "Sameeeish",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Friends — Sameeeish",
    description: PAGE_DESCRIPTION,
  },
};

export default function FriendsPlayPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--internal`}>
      <LandingHeader />
      <main>
        <BackLink href="/play" />
        <GameCategorySection group="friends" heading="Friends" text="For your favorite people." />
      </main>
      <LandingFooter />
    </div>
  );
}
