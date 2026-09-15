import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { ForCouplesAlike } from "@/components/landing/for-couples-alike";
import { ForCouplesHero } from "@/components/landing/for-couples-hero";
import { ForCouplesNotAboutRight } from "@/components/landing/for-couples-not-about-right";
import { ForCouplesQuestions } from "@/components/landing/for-couples-questions";
import { ForCouplesSummary } from "@/components/landing/for-couples-summary";
import { ForCouplesTakeaways } from "@/components/landing/for-couples-takeaways";
import { LandingCtaSection } from "@/components/landing/landing-cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

// /for-couples — a third, purely presentational marketing route, alongside
// the existing "/" landing and "/how-it-works". No new functionality,
// routing, Supabase, or business-logic changes: the header, footer, and
// closing CTA are the exact same components "/" and "/how-it-works" render
// (LandingHeader, LandingFooter, LandingCtaSection), completely
// unmodified. The middle of the page is new, under
// components/landing/for-couples-*, plus a direct reuse of the homepage's
// question-mockup pattern (ExperienceDemoCard) inside ForCouplesQuestions.
//
// Fonts are instantiated here — same pattern as app/page.tsx and
// app/how-it-works/page.tsx — scoped to this page's own wrapper div only,
// so every other route is unaffected either way.
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
  title: "For couples — Wavelength",
  description:
    "You can know someone well and still discover new things about how they think. See where you align, where you differ, and what's worth talking about.",
};

export default function ForCouplesPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing`}>
      <LandingHeader />
      <main>
        <ForCouplesHero />
        <ForCouplesAlike />
        <ForCouplesTakeaways />
        <ForCouplesQuestions />
        <ForCouplesNotAboutRight />
        <ForCouplesSummary />
        <LandingCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
