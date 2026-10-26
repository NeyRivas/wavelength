import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";

import { ThirtySixQuestionsContent } from "@/components/conversation/thirty-six-questions-content";
import { BackLink } from "@/components/landing/back-link";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";

/**
 * /play/dating-couples/36-questions-to-fall-in-love — the public, indexable
 * landing page for the "36 Questions to Fall in Love" conversation
 * experience (lib/wavelength/conversation-experiences.ts), targeting that
 * search intent. Same shell as its sibling landing page,
 * app/play/dating-couples/getting-to-know-each-other-questions (own font
 * instantiation, shared LandingHeader/LandingFooter/BackLink, .landing
 * landing--internal wrapper).
 *
 * Both CTAs submit the existing startReadyMadeGame action with this
 * experience's id — the same path the "What are you playing?" card leads
 * to — which seeds (or resumes) the visitor's own fixed 36-question draft
 * and sends them to /create.
 *
 * The page body itself lives in ThirtySixQuestionsContent
 * (components/conversation/thirty-six-questions-content.tsx), which B's
 * invitation screen also renders below the invitation — one copy of the
 * content, never two. Nothing on this page reads a questionnaire, a
 * participant, or an answer.
 *
 * Research background is limited to what the cited sources support (Aron
 * et al., 1997, Personality and Social Psychology Bulletin 23(4); Mandy
 * Len Catron's 2015 New York Times "Modern Love" essay) — the study
 * measured felt closeness between strangers, so the copy never promises
 * love, and never presents these original questions as the study's.
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

const PAGE_PATH = "/play/dating-couples/36-questions-to-fall-in-love";
const PAGE_TITLE = "36 Questions to Fall in Love — Sameeeish";
const PAGE_DESCRIPTION =
  "Play 36 questions to fall in love as a guided conversation in three stages. Each of you answers privately, then read both answers side by side. Free, no sign-up.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: PAGE_PATH,
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_PATH,
    siteName: "Sameeeish",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

export default function ThirtySixQuestionsPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--internal`}>
      <LandingHeader />
      <main>
        <BackLink href="/play/dating-couples" />
        <ThirtySixQuestionsContent context="landing" />
      </main>
      <LandingFooter />
    </div>
  );
}
