import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { BackLink } from "@/components/landing/back-link";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { CatalogSectionBlock, MakeYourOwnSection } from "@/components/play/catalog";
import { CATALOG_SECTIONS } from "@/lib/wavelength/catalog";

// /play — the unified game catalog and the destination of every "Let's
// play"/"Start playing" CTA on the site. One page, three sections in a
// fixed order: Couples Games & Questions, Friendship Quizzes & Games, and
// Make Your Own — so every Sameeeish experience is visible at once, with
// no category screen in between. Each ready-made card links to its game's
// own experience page (which holds the detailed content and the Start
// button); Make Your Own links straight to the existing /create builder.
//
// /play/dating-couples and /play/friends stay as their own indexable pages,
// rendering the same section for their group (components/play/catalog.tsx).
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

const PAGE_TITLE = "What Are You Playing? — Sameeeish";
const PAGE_DESCRIPTION =
  "Every Sameeeish game in one place: couples games and questions, friendship quizzes, or make your own. Free, no sign-up.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/play",
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: "/play",
    siteName: "Sameeeish",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

export default function PlayCatalogPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--internal`}>
      <LandingHeader />
      <main>
        <BackLink href="/" />
        <div className="landing-section catalog">
          <header className="catalog__header">
            <h1 className="catalog__heading">What are you playing?</h1>
            <p className="catalog__lede">
              Pick a ready-made game, or make your own. Every one is free, private, and made for
              two.
            </p>
          </header>
          {CATALOG_SECTIONS.map((section) => (
            <CatalogSectionBlock key={section.group} section={section} />
          ))}
          <MakeYourOwnSection />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
