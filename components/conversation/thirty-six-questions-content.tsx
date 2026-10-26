import Link from "next/link";

import { startReadyMadeGame } from "@/app/actions/ready-made-games";
import { FaqAccordion } from "@/components/landing/faq-accordion";
import type { FaqItem } from "@/components/landing/faq-data";
import { THIRTY_SIX_QUESTIONS } from "@/lib/wavelength/conversation-experiences";
import { getReadyMadeGame } from "@/lib/wavelength/ready-made-games";

import { JoinInvitationLink } from "./join-invitation-link";

/**
 * The complete "36 Questions to Fall in Love" experience page body —
 * introduction, research background, how to play, the three stages (real
 * question text from THIRTY_SIX_QUESTIONS), FAQ, and "More for the two of
 * you". One implementation, rendered in two places:
 *
 * - `context="landing"` — the public SEO page
 *   (app/play/dating-couples/36-questions-to-fall-in-love). Its CTAs
 *   submit startReadyMadeGame, which starts (or resumes) the visitor's
 *   own questionnaire.
 * - `context="invite"` — below B's invitation on /w/[token]. Identical
 *   content, except: the title is an h2 (the invitation keeps the page's
 *   only h1); both CTAs become JoinInvitationLink, which only moves focus
 *   to the invitation's name field — nothing here can start a new
 *   questionnaire or take B away from the one they were invited to; and
 *   the related experiences open in a new tab so B's invitation stays put.
 *
 * Purely static: it reads no questionnaire, participant, or answer.
 */
export function ThirtySixQuestionsContent({ context }: { context: "landing" | "invite" }) {
  const invite = context === "invite";
  const TitleTag = invite ? "h2" : "h1";
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
    <article className="landing-section landing-how tsq-page">
      <header className="tsq-hero">
        <div className="tsq-hero__shapes" aria-hidden="true">
          <span className="tsq-hero__shape tsq-hero__shape--pink" />
          <span className="tsq-hero__shape tsq-hero__shape--lavender" />
        </div>
        <div className="tsq-hero__content">
          <p className="tsq-hero__eyebrow">A guided conversation for two</p>
          <TitleTag className="tsq-hero__title">36 Questions to Fall in Love</TitleTag>
          <p className="tsq-hero__text">
            Some conversations take years to get to. This one gets there on purpose: {questionCount}{" "}
            questions in three stages, starting with the easy things and working gently toward the
            ones that matter. Each of you answers in your own words, then you read both sets of
            answers side by side.
          </p>
          <div className="tsq-hero__cta">
            {invite ? (
              <JoinInvitationLink label="Join the conversation" />
            ) : (
              <StartForm label="Start the experience" />
            )}
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
          <cite>Personality and Social Psychology Bulletin</cite> describing a way to build a sense
          of closeness between two strangers. Pairs took turns asking each other 36 questions, split
          into three sets that grew more personal, over about 45 minutes. Afterwards, they reported
          feeling closer to each other than pairs who had spent the same time on small talk.
        </p>
        <p className="tsq-section__text">
          The idea reached a much wider audience in 2015, when writer Mandy Len Catron described
          trying the questions on a date in the <cite>New York Times</cite> “Modern Love” column,
          under the headline “To Fall in Love With Anyone, Do This.” That&apos;s where the “fall in
          love” name comes from.
        </p>
        <p className="tsq-section__text">
          Worth knowing: the study measured closeness after a single conversation, not love. The
          questions here are our own, written for Sameeeish around the same idea — open up a little
          more with each stage. They aren&apos;t the questions from the study, and there&apos;s no
          score at the end.
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
          Every conversation uses the same {questionCount} questions in the same order, so you both
          answer exactly what the other one did.
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
        {invite ? (
          <>
            <p className="tsq-cta__text">
              Add your name at the top of this page to start answering. You&apos;ll read each
              other&apos;s answers once you&apos;ve both finished.
            </p>
            <JoinInvitationLink label="Add your name above" />
          </>
        ) : (
          <>
            <p className="tsq-cta__text">
              Answer first, then send the link. You&apos;ll read each other&apos;s answers once
              you&apos;ve both finished.
            </p>
            <StartForm label="Start the experience" />
          </>
        )}
      </section>

      <section className="tsq-section" aria-labelledby="tsq-faq">
        <h2 id="tsq-faq" className="tsq-section__heading">
          Questions people ask
        </h2>
        <FaqAccordion categoryId="tsq" items={THIRTY_SIX_QUESTIONS_FAQ} tint="lavender" />
      </section>

      <RelatedExperiences invite={invite} />
    </article>
  );
}

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

type RelatedTone = "lavender" | "peach" | "mint";

/**
 * "More for the two of you". Titles, destinations, and descriptions are
 * unchanged; each eyebrow is that experience's own card subtitle from
 * READY_MADE_GAMES, so it can't drift from the Couples catalog.
 */
const RELATED_EXPERIENCES: {
  gameId: string;
  href: string;
  title: string;
  text: string;
  tone: RelatedTone;
  art: () => React.ReactNode;
}[] = [
  {
    gameId: "getting-to-know-you",
    href: "/play/dating-couples/getting-to-know-each-other-questions",
    title: "Getting to know each other questions",
    text: "Lighter questions for new couples and early dates.",
    tone: "lavender",
    art: TwoDotsArt,
  },
  {
    gameId: "date-night",
    href: "/play/dating-couples/date-night",
    title: "Date Night",
    text: "Conversation starters to pick from, one at a time.",
    tone: "peach",
    art: MoonArt,
  },
  {
    gameId: "how-well-do-you-know-each-other",
    href: "/play/dating-couples",
    title: "Are we on the same page?",
    text: "A compatibility quiz to see where you align — and every other couples experience.",
    tone: "mint",
    art: OverlapArt,
  },
];

function RelatedExperiences({ invite }: { invite: boolean }) {
  return (
    <nav className="tsq-section tsq-related" aria-labelledby="tsq-related">
      <h2 id="tsq-related" className="tsq-section__heading">
        More for the two of you
      </h2>
      <ul className="tsq-related__list">
        {RELATED_EXPERIENCES.map((experience) => {
          const Art = experience.art;
          return (
            <li key={experience.href}>
              <Link
                href={experience.href}
                className={`tsq-related__card tsq-related__card--${experience.tone}`}
                // In B's invitation, open these alongside it rather than
                // replacing the page they need to come back to.
                {...(invite ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <span className="tsq-related__art" aria-hidden="true">
                  <Art />
                </span>
                <span className="tsq-related__body">
                  <span className="tsq-related__eyebrow">
                    {getReadyMadeGame(experience.gameId)?.subtitle}
                  </span>
                  <span className="tsq-related__title">{experience.title}</span>
                  <span className="tsq-related__text">{experience.text}</span>
                  <span className="tsq-related__go">
                    Explore <span aria-hidden="true">{invite ? "↗" : "→"}</span>
                    {invite && <span className="sr-only"> (opens in a new tab)</span>}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Two people on the same path — the product's dashed-trajectory motif. */
function TwoDotsArt() {
  return (
    <svg viewBox="0 0 96 56" fill="none">
      <path
        d="M14 36c14-18 28-18 34 0s20 18 34 0"
        stroke="var(--wl-ink)"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        strokeDasharray="4 5"
      />
      <circle cx="14" cy="36" r="8" fill="#ffffff" stroke="var(--wl-lavender)" strokeWidth="4" />
      <circle cx="14" cy="36" r="3" fill="var(--wl-ink)" />
      <circle cx="82" cy="36" r="8" fill="#ffffff" stroke="var(--wl-blue)" strokeWidth="4" />
      <circle cx="82" cy="36" r="3" fill="var(--wl-ink)" />
    </svg>
  );
}

/** An evening in — a crescent moon with the invitation's sparkle. */
function MoonArt() {
  return (
    <svg viewBox="0 0 96 56" fill="none">
      <path d="M50 8a20 20 0 1 0 14 34A16 16 0 0 1 50 8z" fill="#ffffff" />
      <path
        d="M50 8a20 20 0 1 0 14 34A16 16 0 0 1 50 8z"
        stroke="var(--wl-ink)"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />
      <path
        d="M72 12l1.5 3.5 3.5 1.5-3.5 1.5L72 22l-1.5-3.5L67 17l3.5-1.5z"
        fill="var(--wl-pink)"
      />
      <path
        d="M80 30l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z"
        fill="var(--wl-ink)"
        opacity="0.5"
      />
      <circle cx="20" cy="18" r="2" fill="var(--wl-pink)" />
    </svg>
  );
}

/** Where two answers meet — two overlapping circles. */
function OverlapArt() {
  return (
    <svg viewBox="0 0 96 56" fill="none">
      <circle cx="38" cy="28" r="18" fill="#ffffff" fillOpacity="0.7" />
      <circle cx="58" cy="28" r="18" fill="var(--wl-blue)" fillOpacity="0.75" />
      <circle
        cx="38"
        cy="28"
        r="18"
        stroke="var(--wl-ink)"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />
      <circle
        cx="58"
        cy="28"
        r="18"
        stroke="var(--wl-ink)"
        strokeOpacity="0.35"
        strokeWidth="1.5"
      />
      <circle cx="48" cy="28" r="3" fill="var(--wl-ink)" />
    </svg>
  );
}
