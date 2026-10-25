import type { Metadata } from "next";
import { Fraunces, Nunito_Sans } from "next/font/google";
import Link from "next/link";

import { startReadyMadeGame } from "@/app/actions/ready-made-games";
import { BackLink } from "@/components/landing/back-link";
import { FaqAccordion } from "@/components/landing/faq-accordion";
import type { FaqItem } from "@/components/landing/faq-data";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHeader } from "@/components/landing/landing-header";
import { THIRTY_SIX_QUESTIONS } from "@/lib/wavelength/conversation-experiences";

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
 * Purely static content: the stage lists below render the real question
 * text from THIRTY_SIX_QUESTIONS (the exact set every instance is seeded
 * with, never a second copy). Nothing on this page reads a questionnaire,
 * a participant, or an answer.
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

const STAGE_TINTS = ["lavender", "pink", "peach"] as const;

const HOW_TO_PLAY = [
  {
    title: "Start the experience",
    text: "You'll get the 36 questions one at a time, in three stages of 12. No account and no sign-up.",
  },
  {
    title: "Answer in your own words",
    text: "Take your time. Each answer saves as you go, and you can go back and change any of them before you finish.",
  },
  {
    title: "Send your private link",
    text: "When you've answered all 36, add your name and share the link with the person you're doing this with.",
  },
  {
    title: "They answer the same questions",
    text: "Same questions, same order. Neither of you can see the other's answers until you've both finished.",
  },
  {
    title: "Read your conversation together",
    text: "Both answers to every question, side by side, stage by stage. Then put the phones down and talk.",
  },
];

const THIRTY_SIX_QUESTIONS_FAQ: FaqItem[] = [
  {
    question: "Do the 36 questions really make people fall in love?",
    answer:
      "No list of questions can promise that. The original study found that pairs of strangers felt closer after working through its questions than pairs who spent the same time on small talk — it didn't test whether anyone fell in love. Think of it as a structured way into a conversation you might not otherwise have.",
  },
  {
    question: "Are these the questions from the original study?",
    answer:
      "No. These are original questions written for Sameeeish, built on the same idea: start light and go a little deeper with each stage. If you'd like to read the research version, look up Aron and colleagues' 1997 paper, “The Experimental Generation of Interpersonal Closeness.”",
  },
  {
    question: "How long does it take?",
    answer:
      "In the original study, pairs had about 45 minutes for all three sets of questions, asked out loud. Writing your answers usually takes a bit longer, so many people spread it over an evening. Your answers save as you go, so you can stop and pick up where you left off on the same browser.",
  },
  {
    question: "Is it only for couples?",
    answer:
      "It sits in our Dating & Couples section and works just as well for a first date as for a long relationship. But the questions suit any two people who want to know each other better, close friends included.",
  },
  {
    question: "Who can see our answers?",
    answer:
      "Only the two of you. Your answers are tied to your private link and the browser you answered on, and neither of you can see the other's answers until you've both finished. Nothing you write appears on this page or anywhere public, and there's no account to create.",
  },
  {
    question: "Is there a score at the end?",
    answer:
      "No. This isn't a compatibility test, so there's no percentage, rating, or verdict. What you get is your conversation: both of your answers to every question, side by side.",
  },
  {
    question: "Can we do it together in person?",
    answer:
      "Yes. One easy way: each of you answers on your own phone, then sit down together with your finished conversation and go through it question by question, reading your answers out loud and talking about them.",
  },
];

function StartForm({ label }: { label: string }) {
  return (
    <form action={startReadyMadeGame}>
      <input type="hidden" name="gameId" value={THIRTY_SIX_QUESTIONS.id} />
      <button type="submit" className="landing-button landing-button--primary landing-button--play">
        {label} <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}

export default function ThirtySixQuestionsPage() {
  const questionCount = THIRTY_SIX_QUESTIONS.stages.reduce(
    (total, stage) => total + stage.questions.length,
    0,
  );
  const stageStarts = THIRTY_SIX_QUESTIONS.stages.map((_, stageIndex) =>
    THIRTY_SIX_QUESTIONS.stages
      .slice(0, stageIndex)
      .reduce((total, stage) => total + stage.questions.length, 0),
  );

  return (
    <div className={`${fraunces.variable} ${nunitoSans.variable} landing landing--internal`}>
      <LandingHeader />
      <main>
        <BackLink href="/play/dating-couples" />
        <article className="landing-section landing-how tsq-page">
          <header className="tsq-hero">
            <div className="tsq-hero__shapes" aria-hidden="true">
              <span className="tsq-hero__shape tsq-hero__shape--pink" />
              <span className="tsq-hero__shape tsq-hero__shape--lavender" />
            </div>
            <div className="tsq-hero__content">
              <p className="tsq-hero__eyebrow">A guided conversation for two</p>
              <h1 className="tsq-hero__title">36 Questions to Fall in Love</h1>
              <p className="tsq-hero__text">
                Some conversations take years to get to. This one gets there on purpose:{" "}
                {questionCount} questions in three stages, starting with the easy things and working
                gently toward the ones that matter. Each of you answers in your own words, then you
                read both sets of answers side by side.
              </p>
              <div className="tsq-hero__cta">
                <StartForm label="Start the experience" />
                <p className="tsq-hero__note">Free · No sign-up · Answers stay private</p>
              </div>
            </div>
          </header>

          <section className="tsq-section" aria-labelledby="tsq-origins">
            <h2 id="tsq-origins" className="tsq-section__heading">
              Where the idea comes from
            </h2>
            <p className="tsq-section__text">
              In 1997, psychologist Arthur Aron and his colleagues published a study in{" "}
              <cite>Personality and Social Psychology Bulletin</cite> describing a way to build a
              sense of closeness between two strangers. Pairs took turns asking each other 36
              questions, split into three sets that grew more personal, over about 45 minutes.
              Afterwards, they reported feeling closer to each other than pairs who had spent the
              same time on small talk.
            </p>
            <p className="tsq-section__text">
              The idea reached a much wider audience in 2015, when writer Mandy Len Catron described
              trying the questions on a date in the <cite>New York Times</cite> “Modern Love”
              column, under the headline “To Fall in Love With Anyone, Do This.” That&apos;s where
              the “fall in love” name comes from.
            </p>
            <p className="tsq-section__text">
              Worth knowing: the study measured closeness after a single conversation, not love. The
              questions here are our own, written for Sameeeish around the same idea — open up a
              little more with each stage. They aren&apos;t the questions from the study, and
              there&apos;s no score at the end.
            </p>
          </section>

          <section className="tsq-section" aria-labelledby="tsq-how">
            <h2 id="tsq-how" className="tsq-section__heading">
              How to play
            </h2>
            <ol className="tsq-steps">
              {HOW_TO_PLAY.map((step, index) => (
                <li key={step.title} className="tsq-step">
                  <span className="tsq-step__number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <div>
                    <h3 className="tsq-step__title">{step.title}</h3>
                    <p className="tsq-step__text">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section className="tsq-section" aria-labelledby="tsq-stages">
            <h2 id="tsq-stages" className="tsq-section__heading">
              The three stages
            </h2>
            <p className="tsq-section__text">
              Every conversation uses the same {questionCount} questions in the same order, so you
              both answer exactly what the other one did.
            </p>
            <div className="tsq-stages">
              {THIRTY_SIX_QUESTIONS.stages.map((stage, stageIndex) => (
                <section
                  key={stage.number}
                  className={`tsq-stage tsq-stage--${STAGE_TINTS[stageIndex % STAGE_TINTS.length]}`}
                  aria-labelledby={`tsq-stage-${stage.number}`}
                >
                  <p className="tsq-stage__eyebrow">Stage {stage.number}</p>
                  <h3 id={`tsq-stage-${stage.number}`} className="tsq-stage__title">
                    {stage.title}
                  </h3>
                  <p className="tsq-stage__text">{stage.description}</p>
                  <details className="tsq-stage__details">
                    <summary className="tsq-stage__summary">
                      See all {stage.questions.length} questions
                    </summary>
                    <ol className="tsq-stage__list" start={stageStarts[stageIndex]! + 1}>
                      {stage.questions.map((question) => (
                        <li key={question}>{question}</li>
                      ))}
                    </ol>
                  </details>
                </section>
              ))}
            </div>
          </section>

          <section className="tsq-cta" aria-labelledby="tsq-cta-heading">
            <h2 id="tsq-cta-heading" className="tsq-cta__heading">
              Ready when you are
            </h2>
            <p className="tsq-cta__text">
              Answer first, then send the link. You&apos;ll read each other&apos;s answers once
              you&apos;ve both finished.
            </p>
            <StartForm label="Start the experience" />
          </section>

          <section className="tsq-section" aria-labelledby="tsq-faq">
            <h2 id="tsq-faq" className="tsq-section__heading">
              Questions people ask
            </h2>
            <FaqAccordion categoryId="tsq" items={THIRTY_SIX_QUESTIONS_FAQ} tint="lavender" />
          </section>

          <nav className="tsq-section tsq-related" aria-labelledby="tsq-related">
            <h2 id="tsq-related" className="tsq-section__heading">
              More for the two of you
            </h2>
            <ul className="tsq-related__list">
              <li>
                <Link
                  href="/play/dating-couples/getting-to-know-each-other-questions"
                  className="tsq-related__link"
                >
                  <span className="tsq-related__title">Getting to know each other questions</span>
                  <span className="tsq-related__text">
                    Lighter questions for new couples and early dates.
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/play/dating-couples/date-night" className="tsq-related__link">
                  <span className="tsq-related__title">Date Night</span>
                  <span className="tsq-related__text">
                    Conversation starters to pick from, one at a time.
                  </span>
                </Link>
              </li>
              <li>
                <Link href="/play/dating-couples" className="tsq-related__link">
                  <span className="tsq-related__title">Are we on the same page?</span>
                  <span className="tsq-related__text">
                    A compatibility quiz to see where you align — and every other couples
                    experience.
                  </span>
                </Link>
              </li>
            </ul>
          </nav>
        </article>
      </main>
      <LandingFooter />
    </div>
  );
}
