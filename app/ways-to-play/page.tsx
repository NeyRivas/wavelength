import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { BackLink } from "@/components/landing/back-link";
import { LandingCtaSection } from "@/components/landing/landing-cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { WaysToPlayHero } from "@/components/landing/ways-to-play-hero";
import { WaysToPlayModes } from "@/components/landing/ways-to-play-modes";

// /ways-to-play — the top nav's parent information page for the different
// Sameeeish experiences (replaces "For couples" as the nav entry;
// /for-couples itself is untouched and still exists as its own route —
// see components/landing/for-couples-hero.tsx). Same pattern as every
// other marketing route: own font instantiation, shared
// LandingHeader/LandingFooter/LandingCtaSection, .landing wrapper. No new
// functionality, routing, Supabase, or business-logic changes — purely
// informational content that deep-links into the existing /play/[group]
// routes.
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
  "One shared set of questions, made for however you play — couples, friends, or anyone curious to compare notes.";

export const metadata: Metadata = {
  title: "Ways to Play — Sameeeish",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/ways-to-play",
  },
  openGraph: {
    title: "Ways to Play — Sameeeish",
    description: PAGE_DESCRIPTION,
    url: "/ways-to-play",
    siteName: "Sameeeish",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Ways to Play — Sameeeish",
    description: PAGE_DESCRIPTION,
  },
};

export default function WaysToPlayPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--internal`}>
      <LandingHeader />
      <main>
        <BackLink href="/" />
        <WaysToPlayHero />
        <WaysToPlayModes />
        <LandingCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
