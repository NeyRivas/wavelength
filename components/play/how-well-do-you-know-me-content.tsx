import type { FaqItem } from "@/components/landing/faq-data";
import { GUESS_ACCURACY_MESSAGES } from "@/lib/wavelength/guess-accuracy";
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
 * The "How Well Do You Know Me?" experience page body
 * (app/play/friends/how-well-do-you-know-me). A friendship trivia game: A
 * writes the possible answers to 12 fixed questions about themself and
 * marks the true one; B guesses; the result counts B's correct guesses
 * (resultMode "guess-accuracy", lib/wavelength/guess-accuracy.ts).
 *
 * Questions render straight from this game's READY_MADE_GAMES entry, and the
 * result tiers straight from GUESS_ACCURACY_MESSAGES, so the page can't
 * drift from what the game actually asks or says. There are no answer
 * choices to show: each player writes their own.
 */
export const HOW_WELL_GAME_ID = "how-well-do-you-know-me";
const QUESTIONS = getReadyMadeGame(HOW_WELL_GAME_ID)?.questions ?? [];
const QUESTION_COUNT = QUESTIONS.length;
const START_LABEL = "Make your quiz";

export function HowWellDoYouKnowMeContent() {
  return (
    <ExperienceArticle tone="lavender">
      <ExperienceHero
        eyebrow="A quiz for friends"
        title="How Well Do You Know Me?"
        shapes={["lavender", "peach"]}
        action={<StartGameForm gameId={HOW_WELL_GAME_ID} label={START_LABEL} />}
        note="Free · No sign-up · One link, one friend"
      >
        <p>
          A how well do you know me quiz you actually play. The {QUESTION_COUNT} questions are
          ready; you write the answers about yourself, hide the real one among a few decoys, and
          send it to a friend. Then find out how many they get right.
        </p>
      </ExperienceHero>

      <ExperienceSection id="hw-how" heading="How it works">
        <ExperienceSteps steps={HOW_IT_WORKS} />
      </ExperienceSection>

      <ExperienceSection id="hw-questions" heading={`The ${QUESTION_COUNT} questions`}>
        <ExperienceText>
          Every quiz uses these questions, in this order. The answers are yours to write, so no two
          quizzes are the same.
        </ExperienceText>
        <ExperienceQuestionList
          questions={QUESTIONS.map((question) => ({
            text: question.text,
            category: question.category,
          }))}
        />
      </ExperienceSection>

      <ExperienceSection id="hw-answers" heading="Writing answers that are fair but tricky">
        <ExperienceText>
          The questions are fixed, so the fun is in the answers you write. A few things that make a
          quiz worth guessing:
        </ExperienceText>
        <ExperiencePoints points={WRITING_TIPS} pairs />
      </ExperienceSection>

      <ExperienceSection id="hw-score" heading="What the score means">
        <ExperienceText>
          Your friend&apos;s result counts how many of your {QUESTION_COUNT} answers they guessed
          right, then sums it up in one line. From the best result to the worst:
        </ExperienceText>
        <ul className="xp-tiers">
          {TIERS.map((message) => (
            <li key={message} className="xp-tier">
              {message}
            </li>
          ))}
        </ul>
        <ExperienceText>
          It&apos;s a game, not a friendship rating. A low score usually just means you have more
          stories to tell each other.
        </ExperienceText>
      </ExperienceSection>

      <ExperienceSection id="hw-who" heading="Who to send it to">
        <ExperiencePoints points={WHO_TO_SEND} />
        <ExperienceText>
          For a quiz about the memories you share rather than about you, try the{" "}
          <ExperienceLink href="/play/friends/friendship-test">Friendship Test</ExperienceLink>. For
          a partner, the{" "}
          <ExperienceLink href="/play/dating-couples/getting-to-know-each-other-questions">
            getting to know each other questions
          </ExperienceLink>{" "}
          compare your answers instead of testing guesses.
        </ExperienceText>
      </ExperienceSection>

      <ExperienceCta
        id="hw-cta"
        heading="Think they know you?"
        text="Write your answers first, then send the link. You'll both see the score once they've finished guessing."
      >
        <StartGameForm gameId={HOW_WELL_GAME_ID} label={START_LABEL} />
      </ExperienceCta>

      <ExperienceFaq categoryId="hw" items={FAQ} tint="lavender" />

      <ExperienceRelated heading="More for you and your friends" items={RELATED} />
    </ExperienceArticle>
  );
}

const TIERS = [
  GUESS_ACCURACY_MESSAGES.excellent,
  GUESS_ACCURACY_MESSAGES.good,
  GUESS_ACCURACY_MESSAGES.fair,
  GUESS_ACCURACY_MESSAGES.poor,
];

const HOW_IT_WORKS = [
  {
    title: "Start your quiz",
    text: `You'll get ${QUESTION_COUNT} questions about you: your music, your opinions, the things that annoy you. No account needed.`,
  },
  {
    title: "Write the possible answers",
    text: "For each question, write two to five answers your friend might pick. Only one of them is true.",
  },
  {
    title: "Mark the real one",
    text: "Pick the answer that's actually you. Once you share the quiz, your answers are locked in.",
  },
  {
    title: "Send your private link",
    text: "Add your name and send the link to one friend. They see your answer choices, not which one you picked.",
  },
  {
    title: "See how well they know you",
    text: `When they've finished guessing, you both see how many of the ${QUESTION_COUNT} they got right.`,
  },
];

const WRITING_TIPS = [
  {
    title: "Be specific",
    text: "“A 2009 pop-punk song” is harder to guess than “Music”, and a lot more fun to get right.",
  },
  {
    title: "Write believable decoys",
    text: "The best wrong answers are ones you could plausibly have picked. Your friend should have to think.",
  },
  {
    title: "Use the full five when you can",
    text: "Two choices give your friend a coin flip. Four or five make a right guess mean something.",
  },
  {
    title: "Keep it about you",
    text: "Write the answer you'd actually give today, not the one you think sounds best.",
  },
];

const WHO_TO_SEND = [
  {
    title: "Your best friend",
    text: "The obvious one. Find out if they really know your most irrational opinion.",
  },
  {
    title: "A newer friend",
    text: "A low score is fine. It's a quick way to learn the things that usually take months.",
  },
  {
    title: "A sibling or roommate",
    text: "People you see every day can be surprisingly wrong about what you love.",
  },
];

const FAQ: FaqItem[] = [
  {
    question: "How many questions are there?",
    answer: `${QUESTION_COUNT}. The questions are the same for everyone; the answers are the ones you write.`,
  },
  {
    question: "Can my friend see which answer is mine before they guess?",
    answer:
      "No. They see the choices you wrote, not which one you marked as true, so every answer is a real guess.",
  },
  {
    question: "Can I send it to more than one friend?",
    answer:
      "Each link is for one friend. To play with someone else, start a new quiz from this page and send them their own link.",
  },
  {
    question: "Can I change my answers after sharing?",
    answer:
      "No. Once you share the quiz, your answers are locked so the game stays fair. You can change anything before you share.",
  },
  {
    question: "Do we need an account?",
    answer: "No. There's nothing to sign up for, and it's free.",
  },
  {
    question: "Is the score a verdict on our friendship?",
    answer:
      "No. It counts correct guesses, nothing more. Some of the best friendships score low on trivia and high on everything else.",
  },
];

const RELATED: RelatedExperience[] = [
  {
    href: "/play/friends/friendship-test",
    eyebrow: "About the two of you",
    title: "Friendship Test",
    text: "Questions about the memories, inside jokes, and stories you share.",
    tone: "peach",
  },
  {
    href: "/play/dating-couples/getting-to-know-each-other-questions",
    eyebrow: getReadyMadeGame("getting-to-know-you")?.subtitle ?? "Discovery & Conversation",
    title: "Getting to know each other",
    text: "Answer the same questions on your own, then see where you match.",
    tone: "blue",
  },
];
