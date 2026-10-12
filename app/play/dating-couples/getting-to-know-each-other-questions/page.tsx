import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { startReadyMadeGame } from "@/app/actions/ready-made-games";
import { BackLink } from "@/components/landing/back-link";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { GettingToKnowPreview } from "@/components/play/getting-to-know-preview";
import { getReadyMadeGame } from "@/lib/wavelength/ready-made-games";

/**
 * /play/dating-couples/getting-to-know-each-other-questions — a dedicated,
 * public landing page for the "getting-to-know-you" ready-made game
 * (lib/wavelength/ready-made-games.ts), targeting the search intent
 * "getting to know each other questions". Before this page existed, that
 * game had no indexable URL of its own: it only ever appeared as one card
 * on /play/dating-couples (a page scoped to "compatibility quiz for
 * couples"), reachable only by submitting startReadyMadeGame directly —
 * never a page a search result could link to.
 *
 * Same shell every other /play/dating-couples/* route uses (own font
 * instantiation, shared LandingHeader/LandingFooter/BackLink, .landing
 * landing--internal wrapper, BackLink pointing at the parent listing —
 * see app/play/dating-couples/date-night/page.tsx for the identical
 * pattern one level up).
 *
 * The CTA below submits the exact same server action
 * (app/actions/ready-made-games.ts's startReadyMadeGame) with the same
 * gameId="getting-to-know-you" that the "Getting to know each other" card
 * on /play/dating-couples already submits via GameCard — not a new or
 * parallel flow, the identical one, so a draft started from either place
 * is the same resumable draft (see startReadyMadeGame's own doc comment
 * on per-game draft scoping).
 */
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
  "Thoughtful getting to know each other questions for new couples, early dates, or anyone who wants to go beyond small talk. Answer together on Sameeeish and see where you align.";

export const metadata: Metadata = {
  title: "Getting to Know Each Other Questions — Sameeeish",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/play/dating-couples/getting-to-know-each-other-questions",
  },
  openGraph: {
    title: "Getting to Know Each Other Questions — Sameeeish",
    description: PAGE_DESCRIPTION,
    url: "/play/dating-couples/getting-to-know-each-other-questions",
    siteName: "Sameeeish",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Getting to Know Each Other Questions — Sameeeish",
    description: PAGE_DESCRIPTION,
  },
};

export default function GettingToKnowEachOtherQuestionsPage() {
  // Subtitle sourced live from the real game data rather than hardcoded
  // here a second time — if that ever changes, this page can't drift out
  // of sync with the actual product (and the card it mirrors on
  // /play/dating-couples).
  const game = getReadyMadeGame("getting-to-know-you");

  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--internal`}>
      <LandingHeader />
      <main>
        <BackLink href="/play/dating-couples" />
        <section className="landing-section landing-how gtk-page">
          <div className="gtk-hero">
            <h1 className="gtk-hero__title">Getting to Know Each Other Questions</h1>
            {game?.subtitle && <p className="gtk-hero__subtitle">{game.subtitle}</p>}
            <div className="gtk-hero__body">
              <p className="gtk-hero__text">
                A set of getting to know each other questions made for two — for new couples, early
                dates, or anyone who wants to go beyond small talk. Each question is a small door
                into what someone cares about, remembers, and enjoys.
              </p>
              <p className="gtk-hero__text">
                Here&apos;s how it works: you each answer the same questions on your own, then
                compare your answers together. There&apos;s no score — just an easy way to discover
                shared interests and values, and spot the differences worth talking about.
              </p>
            </div>
          </div>

          <GettingToKnowPreview />

          <div className="gtk-cta">
            <form action={startReadyMadeGame}>
              <input type="hidden" name="gameId" value="getting-to-know-you" />
              <button
                type="submit"
                className="landing-button landing-button--primary landing-button--play"
              >
                Start getting to know each other <span aria-hidden="true">→</span>
              </button>
            </form>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
