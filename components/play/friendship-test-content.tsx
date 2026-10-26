import type { FaqItem } from "@/components/landing/faq-data";
import { FRIENDSHIP_MEMORY_MESSAGES } from "@/lib/wavelength/friendship-memory";
import { getReadyMadeGame } from "@/lib/wavelength/ready-made-games";

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
 * The "Friendship Check" experience page body
 * (app/play/friends/friendship-test). A shared-memory game: A writes the
 * possible answers to 12 fixed questions about moments the two friends
 * share and marks the one they remember as true; B guesses; the result
 * counts B's correct guesses (resultMode "friendship-memory",
 * lib/wavelength/friendship-memory.ts).
 *
 * Questions render straight from this game's READY_MADE_GAMES entry, and the
 * result tiers straight from FRIENDSHIP_MEMORY_MESSAGES. Kept deliberately
 * distinct from How Well Do You Know Me? (questions about one person): this
 * page is about "us".
 */
export const FRIENDSHIP_GAME_ID = "friendship-check";
const QUESTIONS = getReadyMadeGame(FRIENDSHIP_GAME_ID)?.questions ?? [];
const QUESTION_COUNT = QUESTIONS.length;
const START_LABEL = "Make your friendship test";

export function FriendshipTestContent() {
  return (
    <ExperienceArticle tone="peach">
      <ExperienceHero
        eyebrow="How well do you remember us?"
        title="Friendship Test"
        shapes={["peach", "pink"]}
        action={<StartGameForm gameId={FRIENDSHIP_GAME_ID} label={START_LABEL} />}
        note="Free · No sign-up · One link, one friend"
      >
        <p>
          A friendship test built on the things only the two of you would know: where you met, the
          inside jokes, the stories you still tell. You write the answers, your friend guesses which
          one really happened.
        </p>
      </ExperienceHero>

      <ExperienceSection id="ft-how" heading="How it works">
        <ExperienceSteps steps={HOW_IT_WORKS} />
      </ExperienceSection>

      <ExperienceSection id="ft-questions" heading={`The ${QUESTION_COUNT} questions`}>
        <ExperienceText>
          Every friendship test uses these questions, in this order. They&apos;re all about moments
          you&apos;ve shared, so the answers can only come from the two of you.
        </ExperienceText>
        <ExperienceQuestionList
          questions={QUESTIONS.map((question) => ({
            text: question.text,
            category: question.category,
          }))}
        />
      </ExperienceSection>

      <ExperienceSection id="ft-answers" heading="Writing answer choices for a memory">
        <ExperiencePoints points={WRITING_TIPS} pairs />
      </ExperienceSection>

      <ExperienceSection id="ft-mismatch" heading="When your memories don't match">
        <ExperienceText>
          Two people can live through the same night and come away with different stories. One of
          you remembers where you were; the other remembers what was said. A wrong guess here
          isn&apos;t a failed test. It&apos;s usually the start of a “wait, that&apos;s not how it
          happened” conversation, and those tend to be the best part.
        </ExperienceText>
      </ExperienceSection>

      <ExperienceSection id="ft-score" heading="What the score means">
        <ExperienceText>
          Your friend&apos;s result counts how many of the {QUESTION_COUNT} memories they matched,
          then sums it up in one line. From the best result to the worst:
        </ExperienceText>
        <ul className="xp-tiers">
          {TIERS.map((message) => (
            <li key={message} className="xp-tier">
              {message}
            </li>
          ))}
        </ul>
      </ExperienceSection>

      <ExperienceSection id="ft-versus" heading="Friendship Test or How Well Do You Know Me?">
        <ExperienceText>
          Both are guessing games for two friends. This one is about your friendship: shared places,
          jokes, and moments. If you&apos;d rather be quizzed on your favorite songs and your
          strongest opinions, try{" "}
          <ExperienceLink href="/play/friends/how-well-do-you-know-me">
            How Well Do You Know Me?
          </ExperienceLink>{" "}
          instead.
        </ExperienceText>
      </ExperienceSection>

      <ExperienceCta
        id="ft-cta"
        heading="Put your friendship to the test"
        text="Write your answers first, then send the link. You'll both see the score once they've finished."
      >
        <StartGameForm gameId={FRIENDSHIP_GAME_ID} label={START_LABEL} />
      </ExperienceCta>

      <ExperienceFaq categoryId="ft" items={FAQ} tint="peach" />

      <ExperienceRelated heading="More for you and your friends" items={RELATED} />
    </ExperienceArticle>
  );
}

const TIERS = [
  FRIENDSHIP_MEMORY_MESSAGES.excellent,
  FRIENDSHIP_MEMORY_MESSAGES.good,
  FRIENDSHIP_MEMORY_MESSAGES.fair,
  FRIENDSHIP_MEMORY_MESSAGES.poor,
];

const HOW_IT_WORKS = [
  {
    title: "Start your test",
    text: `You'll get ${QUESTION_COUNT} questions about your friendship, from how you met to the story you'll still be telling years from now. No account needed.`,
  },
  {
    title: "Write what might have happened",
    text: "For each question, write two to five possible answers. One is the real memory; the rest are believable decoys.",
  },
  {
    title: "Mark the real one",
    text: "Pick the answer you remember. Once you share the test, your answers are locked in.",
  },
  {
    title: "Send your private link",
    text: "Add your name and send the link to the friend it's about. They see your choices, not which one you picked.",
  },
  {
    title: "See how much you both remember",
    text: `When they've finished, you both see how many of the ${QUESTION_COUNT} memories they matched.`,
  },
];

const WRITING_TIPS = [
  {
    title: "Use details only you two know",
    text: "The name of the bar, what you were wearing, who said it first. Details make the real answer recognizable.",
  },
  {
    title: "Build decoys from your real history",
    text: "Other trips you've taken, other jokes you share. Wrong answers that almost happened are the hardest to rule out.",
  },
  {
    title: "Go with your version",
    text: "If the memory is fuzzy, write down the one you'd swear by. Finding out they remember it differently is half the fun.",
  },
  {
    title: "Keep it kind",
    text: "Embarrassing is great when you'll both laugh about it. Skip anything your friend wouldn't want written down.",
  },
];

const FAQ: FaqItem[] = [
  {
    question: "What if we haven't known each other very long?",
    answer:
      "It works best with a bit of shared history, since every question is about a moment you've had together. For a newer friend, How Well Do You Know Me? is a better fit: it's about you, not your shared past.",
  },
  {
    question: "Is the score a judgment of our friendship?",
    answer:
      "No. It counts how many memories your friend matched, nothing more. People remember the same moments differently all the time.",
  },
  {
    question: "Can more than one friend take my test?",
    answer:
      "Each link is for one friend. To test a different friendship, start a new test from this page and send them their own link.",
  },
  {
    question: "Can my friend see my answers before guessing?",
    answer: "No. They see the answer choices you wrote, not which one you marked as true.",
  },
  {
    question: "Do we need an account?",
    answer: "No. There's nothing to sign up for, and it's free.",
  },
];

const RELATED: RelatedExperience[] = [
  {
    href: "/play/friends/how-well-do-you-know-me",
    eyebrow: "About you",
    title: "How Well Do You Know Me?",
    text: "Questions about your music, opinions, and pet peeves. Can they guess yours?",
    tone: "lavender",
  },
  {
    href: "/play/dating-couples/getting-to-know-each-other-questions",
    eyebrow: getReadyMadeGame("getting-to-know-you")?.subtitle ?? "Discovery & Conversation",
    title: "Getting to know each other",
    text: "Answer the same questions on your own, then see where you match.",
    tone: "blue",
  },
];
