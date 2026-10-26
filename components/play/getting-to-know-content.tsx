import type { FaqItem } from "@/components/landing/faq-data";
import {
  getReadyMadeGame,
  GETTING_TO_KNOW_EACH_OTHER_QUESTIONS,
} from "@/lib/wavelength/ready-made-games";

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
 * The "Getting to know each other" experience page body
 * (app/play/dating-couples/getting-to-know-each-other-questions): intro and
 * Start, how it works, every real question, when and how to use them, FAQ,
 * and related experiences, built from the shared experience-page blocks.
 *
 * The question list renders GETTING_TO_KNOW_EACH_OTHER_QUESTIONS directly —
 * the exact array startReadyMadeGame seeds the game with — so the page can
 * never show a question, option, or order the game doesn't actually use.
 * Both Start buttons submit startReadyMadeGame with this game's id.
 */
const GAME_ID = "getting-to-know-you";
const QUESTIONS = GETTING_TO_KNOW_EACH_OTHER_QUESTIONS;
const QUESTION_COUNT = QUESTIONS.length;
const START_LABEL = "Start getting to know each other";

export function GettingToKnowContent() {
  return (
    <ExperienceArticle tone="blue">
      <ExperienceHero
        eyebrow="Questions for two"
        title="Getting to Know Each Other Questions"
        shapes={["blue", "mint"]}
        action={<StartGameForm gameId={GAME_ID} label={START_LABEL} />}
        note="Free · No sign-up · Answers stay private"
      >
        <p>
          {QUESTION_COUNT} getting to know you questions for couples, early dates, and anyone who
          wants to get past small talk. You each answer on your own, then see which answers you
          share and which ones surprised you.
        </p>
      </ExperienceHero>

      <ExperienceSection id="gtk-how" heading="How it works">
        <ExperienceSteps steps={HOW_IT_WORKS} />
      </ExperienceSection>

      <ExperienceSection id="gtk-questions" heading={`All ${QUESTION_COUNT} questions`}>
        <ExperienceText>
          These are the exact questions you&apos;ll both answer, in this order. Each one comes with
          a few answers to choose from.
        </ExperienceText>
        <ExperienceQuestionList
          questions={QUESTIONS.map((question) => ({
            text: question.text,
            category: question.category,
            detail: question.options && {
              summary: `See the ${question.options.length} answer choices`,
              items: question.options,
            },
          }))}
        />
      </ExperienceSection>

      <ExperienceSection id="gtk-when" heading="When to use them">
        <ExperiencePoints points={WHEN_TO_USE} />
        <ExperienceText>
          The questions work for any two people, close friends included. For games made for friends,
          see our <ExperienceLink href="/play/friends">Friends games</ExperienceLink>.
        </ExperienceText>
      </ExperienceSection>

      <ExperienceSection id="gtk-conversation" heading="Turning an answer into a conversation">
        <ExperiencePoints points={CONVERSATION_TIPS} pairs />
      </ExperienceSection>

      <ExperienceSection id="gtk-later" heading="What these questions leave for later">
        <ExperienceText>
          None of these {QUESTION_COUNT} questions ask about money, past relationships, kids, or
          where things are going. That&apos;s on purpose: they&apos;re for getting to know the
          person first. When you&apos;re ready for the bigger topics, the{" "}
          <ExperienceLink href="/play/dating-couples/couples-compatibility-test">
            couples compatibility test
          </ExperienceLink>{" "}
          covers how you handle disagreements, money, and plans like marriage and kids.
        </ExperienceText>
      </ExperienceSection>

      <ExperienceCta
        id="gtk-cta"
        heading="Start with the first question"
        text="Answer first, then send the link. You'll see each other's answers once you've both finished."
      >
        <StartGameForm gameId={GAME_ID} label={START_LABEL} />
      </ExperienceCta>

      <ExperienceFaq categoryId="gtk" items={FAQ} tint="blue" />

      <ExperienceRelated heading="More for the two of you" items={RELATED} />
    </ExperienceArticle>
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

const RELATED: RelatedExperience[] = [
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
    href: "/play/dating-couples/couples-compatibility-test",
    eyebrow: getReadyMadeGame("how-well-do-you-know-each-other")?.subtitle ?? "Compatibility Quiz",
    title: "Are we on the same page?",
    text: "A couples compatibility test for the bigger topics: conflict, money, and the future.",
    tone: "mint",
  },
];
