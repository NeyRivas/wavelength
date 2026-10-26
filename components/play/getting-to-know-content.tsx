import Link from "next/link";

import { startReadyMadeGame } from "@/app/actions/ready-made-games";
import { FaqAccordion } from "@/components/landing/faq-accordion";
import type { FaqItem } from "@/components/landing/faq-data";
import { CATEGORY_LABELS, type Category } from "@/lib/wavelength/categories";
import {
  getReadyMadeGame,
  GETTING_TO_KNOW_EACH_OTHER_QUESTIONS,
} from "@/lib/wavelength/ready-made-games";

/**
 * The "Getting to know each other" experience page body
 * (app/play/dating-couples/getting-to-know-each-other-questions): intro and
 * Start, how it works, every real question, when and how to use them, FAQ,
 * and related experiences. Same structure as the approved 36 Questions page
 * (components/conversation/thirty-six-questions-content.tsx), with its own
 * page-scoped .gtk-* classes and copy.
 *
 * The question list renders GETTING_TO_KNOW_EACH_OTHER_QUESTIONS directly —
 * the exact array startReadyMadeGame seeds the game with — so the page can
 * never show a question, option, or order the game doesn't actually use.
 * Both Start buttons submit startReadyMadeGame with this game's id, the
 * same path the catalog card used to take, so a draft started here is the
 * same resumable draft as before.
 *
 * Purely static: it reads no questionnaire, participant, or answer.
 */
const GAME_ID = "getting-to-know-you";
const QUESTIONS = GETTING_TO_KNOW_EACH_OTHER_QUESTIONS;
const QUESTION_COUNT = QUESTIONS.length;

/** Same tint per category as the page used before (the existing --wl-*
 * palette); only categories this game actually uses. */
const CATEGORY_TINTS: Partial<Record<Category, string>> = {
  relationship: "pink",
  lifestyle: "mint",
  adventures_travel: "blue",
  values_priorities: "lavender",
};

export function GettingToKnowContent() {
  return (
    <article className="landing-section landing-how gtk-page">
      <header className="gtk-hero">
        <div className="gtk-hero__shapes" aria-hidden="true">
          <span className="gtk-hero__shape gtk-hero__shape--blue" />
          <span className="gtk-hero__shape gtk-hero__shape--mint" />
        </div>
        <div className="gtk-hero__content">
          <p className="gtk-hero__eyebrow">Questions for two</p>
          <h1 className="gtk-hero__title">Getting to Know Each Other Questions</h1>
          <p className="gtk-hero__text">
            {QUESTION_COUNT} getting to know you questions for couples, early dates, and anyone who
            wants to get past small talk. You each answer on your own, then see which answers you
            share and which ones surprised you.
          </p>
          <div className="gtk-hero__cta">
            <StartForm />
            <p className="gtk-hero__note">Free · No sign-up · Answers stay private</p>
          </div>
        </div>
      </header>

      <section className="gtk-section" aria-labelledby="gtk-how">
        <h2 id="gtk-how" className="gtk-section__heading">
          How it works
        </h2>
        <ol className="gtk-steps">
          {HOW_IT_WORKS.map((step, index) => (
            <li key={step.title} className="gtk-step">
              <span className="gtk-step__number" aria-hidden="true">
                {index + 1}
              </span>
              <div>
                <h3 className="gtk-step__title">{step.title}</h3>
                <p className="gtk-step__text">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="gtk-section" aria-labelledby="gtk-questions">
        <h2 id="gtk-questions" className="gtk-section__heading">
          All {QUESTION_COUNT} questions
        </h2>
        <p className="gtk-section__text">
          These are the exact questions you&apos;ll both answer, in this order. Each one comes with
          a few answers to choose from.
        </p>
        <ol className="gtk-questions">
          {QUESTIONS.map((question, index) => (
            <li key={question.text} className="gtk-question">
              <span className="gtk-question__number" aria-hidden="true">
                {index + 1}
              </span>
              <div className="gtk-question__body">
                <span
                  className={`gtk-question__pill gtk-question__pill--${CATEGORY_TINTS[question.category] ?? "lavender"}`}
                >
                  {CATEGORY_LABELS[question.category]}
                </span>
                <p className="gtk-question__text">{question.text}</p>
                {question.options && question.options.length > 0 && (
                  <details className="gtk-question__details">
                    <summary className="gtk-question__summary">
                      See the {question.options.length} answer choices
                    </summary>
                    <ul className="gtk-question__options">
                      {question.options.map((option) => (
                        <li key={option}>{option}</li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="gtk-section" aria-labelledby="gtk-when">
        <h2 id="gtk-when" className="gtk-section__heading">
          When to use them
        </h2>
        <ul className="gtk-points">
          {WHEN_TO_USE.map((point) => (
            <li key={point.title} className="gtk-point">
              <h3 className="gtk-point__title">{point.title}</h3>
              <p className="gtk-point__text">{point.text}</p>
            </li>
          ))}
        </ul>
        <p className="gtk-section__text">
          The questions work for any two people, close friends included. For games made for friends,
          see our{" "}
          <Link href="/play/friends" className="gtk-inline-link">
            Friends games
          </Link>
          .
        </p>
      </section>

      <section className="gtk-section" aria-labelledby="gtk-conversation">
        <h2 id="gtk-conversation" className="gtk-section__heading">
          Turning an answer into a conversation
        </h2>
        <ul className="gtk-points gtk-points--pairs">
          {CONVERSATION_TIPS.map((tip) => (
            <li key={tip.title} className="gtk-point">
              <h3 className="gtk-point__title">{tip.title}</h3>
              <p className="gtk-point__text">{tip.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="gtk-section" aria-labelledby="gtk-later">
        <h2 id="gtk-later" className="gtk-section__heading">
          What these questions leave for later
        </h2>
        <p className="gtk-section__text">
          None of these {QUESTION_COUNT} questions ask about money, past relationships, kids, or
          where things are going. That&apos;s on purpose: they&apos;re for getting to know the
          person first. When you&apos;re ready for the bigger topics,{" "}
          <Link href="/play/dating-couples" className="gtk-inline-link">
            Are we on the same page?
          </Link>{" "}
          covers how you handle disagreements, money, and plans like marriage and kids.
        </p>
      </section>

      <section className="gtk-cta" aria-labelledby="gtk-cta-heading">
        <h2 id="gtk-cta-heading" className="gtk-cta__heading">
          Start with the first question
        </h2>
        <p className="gtk-cta__text">
          Answer first, then send the link. You&apos;ll see each other&apos;s answers once
          you&apos;ve both finished.
        </p>
        <StartForm />
      </section>

      <section className="gtk-section" aria-labelledby="gtk-faq">
        <h2 id="gtk-faq" className="gtk-section__heading">
          Questions people ask
        </h2>
        <FaqAccordion categoryId="gtk" items={FAQ} tint="blue" />
      </section>

      <RelatedExperiences />
    </article>
  );
}

const HOW_IT_WORKS = [
  {
    title: "Start the game",
    text: `You'll get ${QUESTION_COUNT} multiple-choice questions about memories, small joys, and what makes you you. No account needed.`,
  },
  {
    title: "Answer as yourself",
    text: "Pick the answer that fits you best. There are no right or wrong answers here.",
  },
  {
    title: "Send your private link",
    text: "When you're done, add your name and share the link with the person you're getting to know.",
  },
  {
    title: `They answer the same ${QUESTION_COUNT}`,
    text: "Same questions, same order. Neither of you sees the other's answers until you've both finished.",
  },
  {
    title: "See where you match",
    text: "Your result shows how aligned your answers are, then where you matched and where you didn't, question by question.",
  },
];

const WHEN_TO_USE = [
  {
    title: "Early dates",
    text: "Something to talk about besides work and the weather, without jumping straight to the heavy stuff.",
  },
  {
    title: "The first few months",
    text: "When you're still learning each other's stories: the people who shaped you, the places you'd go back to, the small things that make a day better.",
  },
  {
    title: "Long-term couples",
    text: "Answers change over time. Comparing them now can turn up things you never thought to ask.",
  },
];

const CONVERSATION_TIPS = [
  {
    title: "Ask why that one",
    text: "The answer each of you picked is the starting point. The reason behind it is the conversation.",
  },
  {
    title: "Share the story behind yours",
    text: "If they picked a childhood memory, tell them which one you were thinking of when you answered.",
  },
  {
    title: "Get curious about the differences",
    text: "Different answers aren't a bad sign. They're usually the most interesting part to talk about.",
  },
  {
    title: "Let one question run long",
    text: "There's no need to get through every question in one sitting. If one answer turns into a whole evening, that's the point.",
  },
];

const FAQ: FaqItem[] = [
  {
    question: "Is there a score?",
    answer:
      "Yes. Once you've both finished, you'll see how aligned your answers are as a percentage, followed by where you matched and where you didn't. It isn't a verdict on the two of you, just a quick way to see what you share and what's worth talking about.",
  },
  {
    question: "How many questions are there?",
    answer: `${QUESTION_COUNT}, all multiple choice. You each answer the same questions in the same order.`,
  },
  {
    question: "Do we need to be in the same place?",
    answer:
      "No. You answer on your own device, then send your private link. They can answer whenever suits them.",
  },
  {
    question: "Who can see our answers?",
    answer:
      "Only the two of you. Neither of you can see the other's answers until you've both finished. Keep your link private and only share it with the person you're playing with.",
  },
  {
    question: "Do we need an account?",
    answer: "No. There's nothing to sign up for, and it's free.",
  },
  {
    question: "Is it only for couples?",
    answer:
      "It's in our Dating & Couples section, but the questions work for any two people who want to know each other better, close friends included.",
  },
];

function StartForm() {
  return (
    <form action={startReadyMadeGame}>
      <input type="hidden" name="gameId" value={GAME_ID} />
      <button type="submit" className="landing-button landing-button--primary landing-button--play">
        Start getting to know each other <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}

/**
 * "More for the two of you". Eyebrows come from each experience's own
 * catalog card subtitle in READY_MADE_GAMES where it has one, so they can't
 * drift from the Couples catalog.
 */
const RELATED_EXPERIENCES: {
  href: string;
  eyebrow: string;
  title: string;
  text: string;
  tone: "lavender" | "peach" | "mint";
}[] = [
  {
    href: "/play/dating-couples/36-questions-to-fall-in-love",
    eyebrow: "Guided conversation",
    title: "36 Questions to Fall in Love",
    text: "A deeper conversation in three stages, answered in your own words.",
    tone: "lavender",
  },
  {
    href: "/play/dating-couples/date-night",
    eyebrow: getReadyMadeGame("date-night")?.subtitle ?? "Conversation Starters",
    title: "Date Night",
    text: "Conversation starters to pick from, one at a time.",
    tone: "peach",
  },
  {
    href: "/play/dating-couples",
    eyebrow: getReadyMadeGame("how-well-do-you-know-each-other")?.subtitle ?? "Compatibility Quiz",
    title: "Are we on the same page?",
    text: "A compatibility quiz for the bigger topics, and every other couples experience.",
    tone: "mint",
  },
];

function RelatedExperiences() {
  return (
    <nav className="gtk-section gtk-related" aria-labelledby="gtk-related">
      <h2 id="gtk-related" className="gtk-section__heading">
        More for the two of you
      </h2>
      <ul className="gtk-related__list">
        {RELATED_EXPERIENCES.map((experience) => (
          <li key={experience.href}>
            <Link
              href={experience.href}
              className={`gtk-related__card gtk-related__card--${experience.tone}`}
            >
              <span className="gtk-related__eyebrow">{experience.eyebrow}</span>
              <span className="gtk-related__title">{experience.title}</span>
              <span className="gtk-related__text">{experience.text}</span>
              <span className="gtk-related__go">
                Explore <span aria-hidden="true">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
