import type { FaqItem } from "@/components/landing/faq-data";
import type { AlignmentLevel } from "@/lib/scoring/score";
import { SCALE_LABELS, SCALE_VALUES } from "@/lib/wavelength/categories";
import { getReadyMadeGame } from "@/lib/wavelength/ready-made-games";
import { ALIGNMENT_INTERPRETATION } from "@/lib/wavelength/result";

import {
  ExperienceArticle,
  ExperienceCta,
  ExperienceFaq,
  ExperienceHero,
  ExperienceLink,
  ExperiencePoints,
  ExperienceQuestionList,
  ExperienceRelated,
  ExperienceSection,
  ExperienceSteps,
  ExperienceText,
  StartGameForm,
  type RelatedExperience,
} from "./experience-page";

/**
 * The "Are we on the same page?" experience page body
 * (app/play/dating-couples/couples-compatibility-test): the couples
 * compatibility quiz, scored with the standard alignment result
 * (lib/scoring/score.ts — same option = aligned for choice questions,
 * closeness for the one scale question).
 *
 * Questions and answer choices render straight from this game's
 * READY_MADE_GAMES entry; the scale question shows the fixed SCALE_LABELS
 * every scale question uses; the alignment levels and their wording come
 * from ALIGNMENT_INTERPRETATION. The ranges below mirror
 * lib/scoring/score.ts's alignmentLevel (75+ High, 50–74 Mixed, under 50
 * Low), checked by tests/unit/compatibility-test-page.test.ts.
 */
export const COMPATIBILITY_GAME_ID = "how-well-do-you-know-each-other";
const QUESTIONS = getReadyMadeGame(COMPATIBILITY_GAME_ID)?.questions ?? [];
const QUESTION_COUNT = QUESTIONS.length;
const START_LABEL = "Start the compatibility test";

export const ALIGNMENT_RANGES: { level: AlignmentLevel; range: string }[] = [
  { level: "High Alignment", range: "75–100%" },
  { level: "Mixed Alignment", range: "50–74%" },
  { level: "Low Alignment", range: "0–49%" },
];

export function CompatibilityTestContent() {
  return (
    <ExperienceArticle tone="mint">
      <ExperienceHero
        eyebrow="Are we on the same page?"
        title="Couples Compatibility Test"
        shapes={["mint", "blue"]}
        action={<StartGameForm gameId={COMPATIBILITY_GAME_ID} label={START_LABEL} />}
        note="Free · No sign-up · Answers stay private"
      >
        <p>
          A couples compatibility test you take separately and compare together. {QUESTION_COUNT}{" "}
          questions about love, conflict, money, kids, and the future. You each answer on your own,
          then see where you&apos;re aligned and where you see things differently.
        </p>
      </ExperienceHero>

      <ExperienceSection id="ct-how" heading="How it works">
        <ExperienceSteps steps={HOW_IT_WORKS} />
      </ExperienceSection>

      <ExperienceSection id="ct-covers" heading="What it covers">
        <ExperiencePoints points={COVERS} />
      </ExperienceSection>

      <ExperienceSection id="ct-questions" heading={`All ${QUESTION_COUNT} questions`}>
        <ExperienceText>
          These are the exact questions you&apos;ll both answer, in this order, with the answers you
          can choose from.
        </ExperienceText>
        <ExperienceQuestionList
          questions={QUESTIONS.map((question) => ({
            text: question.text,
            category: question.category,
            detail:
              question.type === "scale"
                ? {
                    summary: "Answered on a scale",
                    items: SCALE_VALUES.map((value) => SCALE_LABELS[value]),
                  }
                : question.options && {
                    summary: `See the ${question.options.length} answer choices`,
                    items: question.options,
                  },
          }))}
        />
      </ExperienceSection>

      <ExperienceSection id="ct-result" heading="How to read your result">
        <ExperienceText>
          For each question, the same answer counts as aligned. On the scale question, the closer
          your answers, the more aligned you are. Your overall percentage puts you in one of three
          levels:
        </ExperienceText>
        <ul className="xp-levels">
          {ALIGNMENT_RANGES.map(({ level, range }) => (
            <li key={level} className="xp-level">
              <span className="xp-level__name">
                {level} <span className="xp-level__range">{range}</span>
              </span>
              <span className="xp-level__text">{ALIGNMENT_INTERPRETATION[level]}</span>
            </li>
          ))}
        </ul>
        <ExperienceText>
          After the percentage, you&apos;ll see how you compare in each area, where you&apos;re
          aligned, where your answers were different, and every question with both of your answers
          side by side.
        </ExperienceText>
      </ExperienceSection>

      <ExperienceSection id="ct-accurate" heading="Is a compatibility test accurate?">
        <ExperienceText>
          It&apos;s accurate about one thing: how your answers to these {QUESTION_COUNT} questions
          compare. It can&apos;t predict whether a relationship will last, and no quiz can. Treat
          the result as a map of what to talk about, not a grade.
        </ExperienceText>
        <ExperienceText>
          It&apos;s also not a zodiac or name compatibility test. There are no star signs, birth
          dates, or love calculators here, only what the two of you actually say about how you want
          to live.
        </ExperienceText>
      </ExperienceSection>

      <ExperienceSection id="ct-differences" heading="Talking about the differences">
        <ExperiencePoints points={DIFFERENCE_TIPS} pairs />
        <ExperienceText>
          Just getting to know each other? Start lighter with the{" "}
          <ExperienceLink href="/play/dating-couples/getting-to-know-each-other-questions">
            getting to know each other questions
          </ExperienceLink>
          , and come back to this one when you&apos;re ready for the bigger topics.
        </ExperienceText>
      </ExperienceSection>

      <ExperienceCta
        id="ct-cta"
        heading="See where you stand"
        text="Answer first, then send the link to your partner. You'll both see the result once you've each finished."
      >
        <StartGameForm gameId={COMPATIBILITY_GAME_ID} label={START_LABEL} />
      </ExperienceCta>

      <ExperienceFaq categoryId="ct" items={FAQ} tint="mint" />

      <ExperienceRelated heading="More for the two of you" items={RELATED} />
    </ExperienceArticle>
  );
}

const HOW_IT_WORKS = [
  {
    title: "Start the test",
    text: `You'll get ${QUESTION_COUNT} questions, almost all multiple choice. No account needed.`,
  },
  {
    title: "Answer honestly, on your own",
    text: "Pick what's true for you, not what you think your partner wants to hear.",
  },
  {
    title: "Send your private link",
    text: "When you're done, add your name and share the link with your partner.",
  },
  {
    title: "They answer the same questions",
    text: "Same questions, same order. Neither of you sees the other's answers until you've both finished.",
  },
  {
    title: "Compare your results",
    text: "See your overall alignment, how you compare in each area, and every answer side by side.",
  },
];

const COVERS = [
  {
    title: "Love and commitment",
    text: "What makes each of you feel loved, and what commitment actually means to you.",
  },
  {
    title: "Conflict",
    text: "What you do when something's bothering you, what matters in a disagreement, and how much space you need after one.",
  },
  {
    title: "Everyday life",
    text: "How much time alone you need, and how you feel about living together before marriage.",
  },
  {
    title: "Money",
    text: "How you approach money, and how comfortable you'd be combining finances.",
  },
  {
    title: "The future",
    text: "Kids, how important marriage is to you, and whether you'd move for each other.",
  },
];

const DIFFERENCE_TIPS = [
  {
    title: "Start with what you share",
    text: "Look at where you're aligned first. It makes the differences easier to talk about.",
  },
  {
    title: "Ask, don't argue",
    text: "“What made you pick that?” goes further than explaining why your answer is right.",
  },
  {
    title: "Separate “different” from “dealbreaker”",
    text: "Most differences are just preferences. Talk about which ones really matter to each of you.",
  },
  {
    title: "Pick one topic, not all of them",
    text: "You don't have to resolve money, kids, and moving in one evening. Choose one to start.",
  },
];

const FAQ: FaqItem[] = [
  {
    question: "Do we take it on separate phones?",
    answer:
      "Yes. You answer on your device, then send your private link, and your partner answers on theirs. You don't need to be in the same place.",
  },
  {
    question: "What if we score low?",
    answer:
      "A low score means you answered many of these questions differently. That's information, not a verdict, and often the most useful starting point for a real conversation.",
  },
  {
    question: "Can we take it again?",
    answer:
      "Yes. Once you've shared a test, starting again from this page gives you a fresh one to send. Until you share, starting again picks up where you left off.",
  },
  {
    question: "Who can see our answers?",
    answer:
      "Only the two of you. Neither of you can see the other's answers until you've both finished. Keep your link private and only share it with your partner.",
  },
  {
    question: "Do we need an account?",
    answer: "No. There's nothing to sign up for, and it's free.",
  },
];

const RELATED: RelatedExperience[] = [
  {
    href: "/play/dating-couples/getting-to-know-each-other-questions",
    eyebrow: getReadyMadeGame("getting-to-know-you")?.subtitle ?? "Discovery & Conversation",
    title: "Getting to know each other",
    text: "Lighter questions for new couples and early dates.",
    tone: "blue",
  },
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
];
