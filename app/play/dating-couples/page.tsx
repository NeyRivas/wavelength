import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { BackLink } from "@/components/landing/back-link";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { GameCategorySection } from "@/components/play/game-category-section";

// /play/dating-couples — one of /play's two category screens (see
// app/play/page.tsx). Only "How Well Do You Know Each Other?" currently
// has a real question set (lib/wavelength/ready-made-games.ts); the other
// two render as prepared-but-inert cards, same as before this move.
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

const PAGE_DESCRIPTION = "Ready-made games for the two of you.";

export const metadata: Metadata = {
  title: "Dating & Couples — Sameeeish",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/play/dating-couples",
  },
  openGraph: {
    title: "Dating & Couples — Sameeeish",
    description: PAGE_DESCRIPTION,
    url: "/play/dating-couples",
    siteName: "Sameeeish",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Dating & Couples — Sameeeish",
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
          heading="Dating & Couples"
          text="For the two of you."
        />
      </main>
      <LandingFooter />
    </div>
  );
}
