import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { BackLink } from "@/components/landing/back-link";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { GameCategorySection } from "@/components/play/game-category-section";

// /play/dating-couples — one of /play's two category screens (see
// app/play/page.tsx). All three cards are wired up
// (lib/wavelength/ready-made-games.ts): "Are we on the same page?" and
// "Getting to know each other" seed a questionnaire draft, while "Date
// Night" is plain navigation to its own standalone experience
// (app/play/dating-couples/date-night) rather than a questionnaire.
//
// SEO pass: heading/intro reworked around this page's primary search
// intent, "compatibility quiz for couples" — "Compatibility Quiz" is
// already this page's own established vocabulary (the "Are we on the
// same page?" card's `subtitle` in ready-made-games.ts), not an invented
// term. The intro below stays accurate to what the page actually offers
// (three cards, not one): it leads with the compatibility quiz, states
// plainly that it's a conversation starter rather than a scientific
// assessment (matching the existing FAQ answer to "Is this a
// compatibility test?"), and still names the other two games so the copy
// doesn't overclaim the page's scope. GameCategorySection itself
// (shared with /play/friends) is untouched — only this page's own
// `heading`/`text` props changed.
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

// SEO pass: title/description reworked around this page's primary search
// intent, "compatibility quiz for couples" (see the doc comment above).
// Description still names all three real games this page hosts
// (lib/wavelength/ready-made-games.ts: "Are we on the same page?"
// subtitled "Compatibility Quiz", "Getting to know each other", and
// "Date Night") — leading with the quiz, not replacing the other two,
// since the page genuinely offers all three. Distinct from /ways-to-play
// (title "Ways to Play — Sameeeish", H1 "Ways to play"): that page is a
// parent picker between couples/friends, this one is the couples
// experience itself.
const PAGE_DESCRIPTION =
  "A compatibility quiz for couples, plus a getting-to-know-you conversation game and date night questions — all for the two of you.";

export const metadata: Metadata = {
  title: "Compatibility Quiz for Couples — Sameeeish",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/play/dating-couples",
  },
  openGraph: {
    title: "Compatibility Quiz for Couples — Sameeeish",
    description: PAGE_DESCRIPTION,
    url: "/play/dating-couples",
    siteName: "Sameeeish",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Compatibility Quiz for Couples — Sameeeish",
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
          heading="A Compatibility Quiz for Couples"
          text="Answer the same questions on your own, then compare notes together. It's not a science — just a quick, honest way to see where you align, where you see things differently, and what's worth talking about. This page also has a getting-to-know-you conversation game and a set of date night questions, if you'd rather start there."
        />
      </main>
      <LandingFooter />
    </div>
  );
}
