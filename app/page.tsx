import { Fraunces, Nunito_Sans } from "next/font/google";

import { LandingCtaSection } from "@/components/landing/landing-cta-section";
import { LandingExperience } from "@/components/landing/landing-experience";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";

// Landing page only (app/page.tsx / route "/"). Everything below is
// presentation for this one route — no new functionality, no routing,
// Supabase, or business-logic changes. Every actual entry point into the
// product is still the same plain link to /create it always was; this
// only changes how that content is framed visually, to match the
// approved Figma Make reference (see components/landing/* doc comments
// for section-by-section notes on what was reproduced and any
// deliberate deviation).
//
// Fonts are instantiated here, not in the root layout, and their CSS
// variables are applied only to this page's own wrapper div — every
// other route keeps inheriting globals.css's existing system-ui stack
// untouched.
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

export default function HomePage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing`}>
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingHowItWorks />
        <LandingExperience />
        <LandingCtaSection className="landing-dark-cta--home" />
      </main>
      <LandingFooter />
    </div>
  );
}
