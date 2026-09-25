import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { FaqHero } from "@/components/landing/faq-hero";
import { FaqSection } from "@/components/landing/faq-section";
import { LandingCtaSection } from "@/components/landing/landing-cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

// /faq — a fourth, purely presentational marketing route, alongside the
// existing "/" landing, "/how-it-works", and "/for-couples". No new
// functionality, routing, Supabase, or business-logic changes: the
// header, footer, and closing CTA are the exact same components every
// other marketing page renders (LandingHeader, LandingFooter,
// LandingCtaSection), completely unmodified. The only client-side state
// on this page is which FAQ category/question is expanded
// (components/landing/faq-section.tsx) — everything else here is static.
//
// Fonts are instantiated here — same pattern as the other marketing
// pages — scoped to this page's own wrapper div only, so every other
// route is unaffected either way.
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

const PAGE_DESCRIPTION = "Everything you need to know before you get started.";

export const metadata: Metadata = {
  title: "Sameeeish FAQ",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/faq",
  },
  openGraph: {
    title: "Sameeeish FAQ",
    description: PAGE_DESCRIPTION,
    url: "/faq",
    siteName: "Sameeeish",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Sameeeish FAQ",
    description: PAGE_DESCRIPTION,
  },
};

export default function FaqPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing`}>
      <LandingHeader />
      <main>
        <FaqHero />
        <FaqSection />
        <LandingCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
