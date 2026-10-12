import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { BackLink } from "@/components/landing/back-link";
import { DateNightExperienceLoader } from "@/components/date-night/date-night-experience-loader";
import { DateNightPreview } from "@/components/date-night/date-night-preview";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

// /play/dating-couples/date-night — a standalone conversation-starter
// library, not a questionnaire: no Supabase, no account, no scoring, no
// /create flow. Same page shell every other internal route under /play
// uses (own font instantiation, shared LandingHeader/LandingFooter/
// BackLink, .landing landing--internal wrapper) so it reads as part of
// the same site; everything interactive (mood filters, search, the
// current question, favorites) lives in DateNightExperience, rendered
// client-only via DateNightExperienceLoader — local state + localStorage
// only, no Supabase.
//
// SEO pass: DateNightExperienceLoader's `ssr:false` boundary means none
// of that interactive tool's content ships in the initial HTML — a real,
// deliberate tradeoff (its own `useState` initializers call
// `Math.random()`/read `localStorage`, which can't run during SSR
// without a hydration mismatch), but it left this page's crawlable
// content at just the 3-line hero below. DateNightPreview (a plain
// Server Component, mounted after the interactive tool so the on-page
// experience for a real visitor is unchanged) renders a small,
// deterministic sample of real question text server-side to close that
// gap — see that component's own doc comment for why it's a sample, not
// the full library.
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
  "60 real date night questions — flirty, funny, romantic, deep, and more. Pick one and see where it takes you.";

export const metadata: Metadata = {
  title: "Date Night Questions — Sameeeish",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/play/dating-couples/date-night",
  },
  openGraph: {
    title: "Date Night Questions — Sameeeish",
    description: PAGE_DESCRIPTION,
    url: "/play/dating-couples/date-night",
    siteName: "Sameeeish",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Date Night Questions — Sameeeish",
    description: PAGE_DESCRIPTION,
  },
};

export default function DateNightPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--internal`}>
      <LandingHeader />
      <main>
        <BackLink href="/play/dating-couples" />
        <section className="landing-section landing-how dn-page">
          <div className="dn-hero">
            <h1 className="dn-hero__title">Date Night</h1>
            <p className="dn-hero__subtitle">Conversation Starters</p>
            <p className="dn-hero__text">Pick a question. See where it takes you.</p>
          </div>
          <DateNightExperienceLoader />
          <DateNightPreview />
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
