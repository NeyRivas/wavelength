import type { Metadata } from "next";
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
//
// SEO pass: this route previously had no metadata export of its own, so
// it fell back to app/layout.tsx's generic defaults — a bare "Sameeeish"
// title with no description of what the product actually is, on the one
// page with the most inbound authority. layout.tsx itself is untouched
// (it's still the correct fallback for any route that doesn't define its
// own metadata, e.g. /create and /w/[token]/*); this only adds a
// page-specific override, the same pattern every other marketing route
// under app/ already follows. Title/description describe the real
// mechanic (answer the same questions separately, then compare) using
// the page's own established voice ("A game for two", the hero's own
// eyebrow copy, and "on the same page", its own H1) rather than inventing
// new brand language. Deliberately not couples-only — "two people" covers
// the Dating & Couples and Friends categories alike, matching what /play
// actually offers; the H1 and visual design are unchanged.
const SITE_TITLE = "Sameeeish — A Game for Two: See If You're on the Same Page";
const SITE_DESCRIPTION =
  "A playful question game for two — couples, friends, or anyone curious. Answer honestly, compare notes, and discover how aligned you really are. Free, no sign-up needed.";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: "Sameeeish",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};
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
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--home`}>
      <LandingHeader />
      <main>
        <LandingHero />
        <LandingHowItWorks />
        <LandingExperience />
        <LandingCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
