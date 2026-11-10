import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import Link from "next/link";

import { startReadyMadeGame } from "@/app/actions/ready-made-games";
import { BackLink } from "@/components/landing/back-link";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { FUNNY_QUESTIONS } from "@/lib/wavelength/ready-made-games";

/**
 * /play/dating-couples/funny-questions — public landing page for the
 * "funny-questions" ready-made game (lib/wavelength/ready-made-games.ts).
 * It's the destination for Sameeeish's "10 Funny Questions for Couples"
 * Pinterest pins: a visitor sees the same ten questions they just read on
 * the pin, then starts the actual game in one tap.
 *
 * A GET-able page is needed because /create?game=… only *resumes* an
 * existing draft — it never seeds a new one, so linking a pin straight to
 * it lands first-time visitors on an empty Make Your Own form. Seeding
 * happens only through the startReadyMadeGame server action, which this
 * page's CTA submits, exactly like the "Getting to know each other" page
 * (app/play/dating-couples/getting-to-know-each-other-questions/page.tsx),
 * whose shell and gtk-* styles this page reuses.
 *
 * Unlike that page's per-category sample, this one lists all ten
 * questions: the pin promises "10 funny questions", so the page delivers
 * the full list, read straight from FUNNY_QUESTIONS.
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

const PAGE_TITLE = "Funny Questions for Couples (Try Not to Laugh) — Sameeeish";
const PAGE_DESCRIPTION =
  "10 funny questions for couples. Answer them separately on Sameeeish, then compare your answers and try not to laugh.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/play/dating-couples/funny-questions",
  },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: "/play/dating-couples/funny-questions",
    siteName: "Sameeeish",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
};

function StartFunnyQuestionsButton() {
  return (
    <form action={startReadyMadeGame}>
      <input type="hidden" name="gameId" value="funny-questions" />
      <button type="submit" className="landing-button landing-button--primary landing-button--play">
        Play these questions together <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}

export default function FunnyQuestionsPage() {
  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--internal`}>
      <LandingHeader />
      <main>
        <BackLink href="/play/dating-couples" />
        <section className="landing-section landing-how gtk-page">
          <div className="gtk-hero">
            <h1 className="gtk-hero__title">Funny Questions for Couples</h1>
            <p className="gtk-hero__subtitle">Try not to laugh</p>
            <div className="gtk-hero__body">
              <p className="gtk-hero__text">
                Ten silly questions for the two of you. You each answer on your own, then compare
                your answers and see who saw what coming.
              </p>
            </div>
          </div>

          <div className="gtk-cta">
            <StartFunnyQuestionsButton />
          </div>

          <section className="gtk-browse" aria-label="The ten funny questions">
            <h2 className="gtk-browse__heading">The questions</h2>
            <ol className="gtk-browse-group__list">
              {FUNNY_QUESTIONS.map((question) => (
                <li key={question.text} className="gtk-browse-item">
                  {question.text}
                </li>
              ))}
            </ol>
          </section>

          <div className="gtk-cta">
            <StartFunnyQuestionsButton />
            <p className="gtk-cta__more">
              <Link href="/play/dating-couples" className="landing-back-link">
                Explore more Dating & Couples experiences
              </Link>
            </p>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
