import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { BackLink } from "@/components/landing/back-link";
import { LandingCtaSection } from "@/components/landing/landing-cta-section";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

// /about — a short, human description of what Sameeeish actually is. Same
// pattern as every other marketing route (own font instantiation, shared
// LandingHeader/LandingFooter, .landing--internal wrapper, BackLink). No
// new functionality, routing, Supabase, or business-logic changes.
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

const PAGE_DESCRIPTION = "What Sameeeish is, and what it isn't.";

export const metadata: Metadata = {
  title: "About Sameeeish",
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Sameeeish",
    description: PAGE_DESCRIPTION,
    url: "/about",
    siteName: "Sameeeish",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "About Sameeeish",
    description: PAGE_DESCRIPTION,
  },
};

export default function AboutPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--internal`}>
      <LandingHeader />
      <main>
        <BackLink href="/" />
        <section className="landing-section landing-how landing-legal">
          <h1 className="landing-section__heading">About Sameeeish</h1>
          <div className="landing-legal__body">
            <p>
              Sameeeish is a playful way to find out how aligned you and someone else really are.
              Pick a set of questions — ready-made, or entirely your own — answer them honestly,
              then send a link to someone else. They answer the same questions on their own, without
              seeing your answers first. Once you&apos;re both done, you see where you line up and
              where you&apos;re completely different.
            </p>
            <p>
              There&apos;s no sign-up, no profile, and nothing to install — just a link you create
              and a link you share. It&apos;s built to spark a conversation, not to hand out a
              verdict: the result is a starting point for talking, not a score to win or lose.
            </p>
          </div>
        </section>
        <LandingCtaSection />
      </main>
      <LandingFooter />
    </div>
  );
}
