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

// SEO pass: description expanded to name the three real games this page
// actually hosts (lib/wavelength/ready-made-games.ts: "Are we on the same
// page?" subtitled "Compatibility Quiz", "Getting to know each other",
// and "Date Night") instead of the generic "Ready-made games" line — an
// accurate description of real on-page content, not three keywords
// bolted on; title is left as the approved "Dating & Couples", which
// already accurately scopes the page (it covers all three games, not
// just one of them).
const PAGE_DESCRIPTION =
  "Ready-made games for the two of you — a relationship compatibility quiz, a getting-to-know-you conversation game, and date night questions.";

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
