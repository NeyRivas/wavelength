import type { FaqItem } from "@/components/landing/faq-data";
import {
  ExperienceArticle,
  ExperienceFaq,
  ExperienceLink,
  ExperiencePoints,
  ExperienceRelated,
  ExperienceSection,
  ExperienceSteps,
  ExperienceText,
  type RelatedExperience,
} from "@/components/play/experience-page";
import { DATE_NIGHT_QUESTIONS, MOOD_LABELS, MOODS, type Mood } from "@/lib/date-night/questions";
import { getReadyMadeGame } from "@/lib/wavelength/ready-made-games";

/**
 * Date Night's editorial section — a plain Server Component rendered below
 * the interactive deck (DateNightExperience) and its server-rendered sample
 * (DateNightPreview) on app/play/dating-couples/date-night. It explains how
 * to use the deck, what each mood is for, and how to set up the evening.
 *
 * It reads DATE_NIGHT_QUESTIONS and MOODS only to count and label them (a
 * mood's count uses the deck's own filter rule: every question tagged with
 * that mood), so it can't drift from the deck. It never changes the deck's
 * questions, filters, or behavior.
 */
const QUESTION_COUNT = DATE_NIGHT_QUESTIONS.length;

const countForMood = (mood: Mood) =>
  DATE_NIGHT_QUESTIONS.filter((question) => question.moods.includes(mood)).length;

/** What each mood is good for — editorial copy, keyed by the deck's moods. */
const MOOD_NOTES: Record<Mood, string> = {
  flirty:
    "For when you want a little spark. Good early in the evening, or early in the relationship.",
  funny: "Low stakes, lots of laughing. A good way to start if you're both tired.",
  romantic: "About what makes each of you feel loved, and the moments you'd like more of.",
  random: "Questions you'd never think to ask. Good for breaking a routine.",
  deep: "For later in the evening, when you've got time to actually talk something through.",
  hypothetical: "What-ifs and would-you-rathers. Easy to answer, often surprisingly revealing.",
};

export function DateNightGuide() {
  return (
    <ExperienceArticle tone="pink" embedded>
      <ExperienceSection id="dn-guide-how" heading="How to use these date night questions">
        <ExperienceSteps steps={HOW_TO_USE} />
      </ExperienceSection>

      <ExperienceSection id="dn-guide-moods" heading="The six moods">
        <ExperienceText>
          Every one of the {QUESTION_COUNT} questions is tagged with at least one mood, and some
          with more than one. Filter by the kind of evening you&apos;re having.
        </ExperienceText>
        <ExperiencePoints
          points={MOODS.map((mood) => ({
            title: `${MOOD_LABELS[mood]} · ${countForMood(mood)} questions`,
            text: MOOD_NOTES[mood],
          }))}
        />
      </ExperienceSection>

      <ExperienceSection id="dn-guide-evening" heading="Setting up the evening">
        <ExperiencePoints points={EVENING_TIPS} pairs />
      </ExperienceSection>

      <ExperienceSection id="dn-guide-distance" heading="Long-distance date nights">
        <ExperienceText>
          The deck works in any browser, so you can both open this page and talk it through on a
          call. One of you picks the question, you both answer out loud. If you&apos;d rather answer
          on your own first and compare, try the{" "}
          <ExperienceLink href="/play/dating-couples/getting-to-know-each-other-questions">
            getting to know each other questions
          </ExperienceLink>
          , which you each answer separately before seeing both sets of answers.
        </ExperienceText>
      </ExperienceSection>

      <ExperienceFaq categoryId="dn" items={FAQ} tint="peach" />

      <ExperienceRelated heading="More for the two of you" items={RELATED} />
    </ExperienceArticle>
  );
}

const HOW_TO_USE = [
  {
    title: "Pick a mood, or keep it on All",
    text: "Choose flirty, funny, romantic, random, deep, or hypothetical, depending on the night.",
  },
  {
    title: "Take turns with Next",
    text: "Read the question out loud and both answer it. When you're ready, hit Next or Shuffle for another.",
  },
  {
    title: "Search for a topic",
    text: "Looking for something specific? Search the deck for a word like “love” or “first”.",
  },
  {
    title: "Save the good ones",
    text: "Tap the heart to keep a question for another night. Favorites stay in this browser.",
  },
];

const EVENING_TIPS = [
  {
    title: "Start light",
    text: "Open with something funny or random. The deeper questions land better once you're both relaxed.",
  },
  {
    title: "Phones down, except for this one",
    text: "Keep one phone out for the deck and put the rest away. It's easier to listen when nothing's buzzing.",
  },
  {
    title: "Follow the tangents",
    text: "If one question turns into twenty minutes of stories, that's a good night. There's no list to finish.",
  },
  {
    title: "Save heavy topics for another time",
    text: "Date night is for connecting, not for sorting out disagreements. Note anything big and come back to it.",
  },
];

const FAQ: FaqItem[] = [
  {
    question: "How many date night questions are there?",
    answer: `${QUESTION_COUNT}, across six moods: flirty, funny, romantic, random, deep, and hypothetical. Some questions fit more than one mood.`,
  },
  {
    question: "Do we need an account?",
    answer: "No. Just open the page and start. There's nothing to sign up for, and it's free.",
  },
  {
    question: "Where are my favorites saved?",
    answer:
      "In this browser on this device. They're not sent anywhere, so they won't show up on another phone or computer.",
  },
  {
    question: "Are these good for a first date?",
    answer:
      "Yes, especially the funny, random, and hypothetical ones. Keep the deep questions for when you know each other a bit better.",
  },
  {
    question: "Can married couples use them?",
    answer:
      "Of course. Long-term couples often get the most out of the romantic and deep moods, because the answers have changed since you last asked.",
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
    href: "/play/dating-couples/getting-to-know-each-other-questions",
    eyebrow: getReadyMadeGame("getting-to-know-you")?.subtitle ?? "Discovery & Conversation",
    title: "Getting to know each other",
    text: "Answer the same questions on your own, then see where you match.",
    tone: "blue",
  },
  {
    href: "/play/dating-couples/couples-compatibility-test",
    eyebrow: getReadyMadeGame("how-well-do-you-know-each-other")?.subtitle ?? "Compatibility Quiz",
    title: "Are we on the same page?",
    text: "A couples compatibility test for the bigger topics.",
    tone: "mint",
  },
];
