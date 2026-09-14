import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { HowItWorksBadges } from "@/components/landing/how-it-works-badges";
import { HowItWorksHero } from "@/components/landing/how-it-works-hero";
import { HowItWorksSteps } from "@/components/landing/how-it-works-steps";
import { LandingCtaSection } from "@/components/landing/landing-cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

// /how-it-works — a second, purely presentational marketing route,
// alongside the existing "/" landing. No new functionality, no routing,
// Supabase, or business-logic changes: the header, footer, and closing
// CTA are the exact same components "/" renders (LandingHeader,
// LandingFooter, LandingCtaSection), completely unmodified, so this page
// shares the Landing's identity rather than reinventing it. The only new
// pieces are the three components under components/landing/how-it-works-*
// that make up the middle of this page.
//
// Fonts are instantiated here — same pattern as app/page.tsx — scoped to
// this page's own wrapper div only, not the root layout, so every other
// route (including "/") is unaffected either way.
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

export const metadata: Metadata = {
  title: "How it works — Wavelength",
  description: "See how two people create, share, answer, and discover their wavelength together.",
};

export default function HowItWorksPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing`}>
      <LandingHeader />
      <main>
        <HowItWorksHero />
        <HowItWorksSteps />
        <HowItWorksBadges />
        <LandingCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
