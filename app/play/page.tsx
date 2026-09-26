import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { BackLink } from "@/components/landing/back-link";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { CategoryCard } from "@/components/play/category-card";

// /play — the landing Hero's "Let's play →" destination. A deliberately
// simple, standalone picker screen: "What are you playing?" plus the
// three ways to start (Dating & Couples, Friends, Make Your Own). Same
// pattern as every other marketing route (own font instantiation, shared
// LandingHeader/LandingFooter, .landing wrapper) — no new functionality,
// Supabase, or business-logic changes live here; picking a category just
// navigates to /play/[group], and Make Your Own links straight to the
// existing /create.
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

const PAGE_DESCRIPTION = "Pick a ready-made game or make your own questions.";

export const metadata: Metadata = {
  title: "What Are You Playing? — Sameeeish",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/play",
  },
  openGraph: {
    title: "What Are You Playing? — Sameeeish",
    description: PAGE_DESCRIPTION,
    url: "/play",
    siteName: "Sameeeish",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "What Are You Playing? — Sameeeish",
    description: PAGE_DESCRIPTION,
  },
};

export default function PlayPickerPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing`}>
      <LandingHeader />
      <main>
        <BackLink href="/" />
        <section className="landing-section landing-how play-picker">
          <h1 className="landing-section__heading play-picker__heading">What are you playing?</h1>
          <div className="landing-card-grid game-card-grid">
            <CategoryCard
              href="/play/dating-couples"
              title="Dating & Couples"
              description="For the two of you."
              blobClass="landing-card__blob--pink"
            />
            <CategoryCard
              href="/play/friends"
              title="Friends"
              description="For your favorite people."
              blobClass="landing-card__blob--blue"
            />
            <CategoryCard
              href="/create"
              title="Make Your Own"
              description="Create your own questions."
              blobClass="landing-card__blob--mint"
            />
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
