import { getReadyMadeGame, type ReadyMadeGameGroup } from "./ready-made-games";

/**
 * The unified game catalog (/play, and each group's own section on
 * /play/dating-couples and /play/friends). Card copy lives here, separate
 * from READY_MADE_GAMES' own `title`/`subtitle` — those also feed /create's
 * builder heading, the invitation copy, and 36 Questions' related cards,
 * none of which this catalog changes. Each card's destination is read from
 * its game's `href`, so a catalog card can never point anywhere the game's
 * own experience page doesn't live.
 */

export interface CatalogCard {
  gameId: string;
  /** The recognizable name of the game. */
  title: string;
  /** A short label for the kind of experience. */
  subtitle: string;
  /** One or two sentences on what you'll actually do. */
  description: string;
}

export interface CatalogSection {
  group: ReadyMadeGameGroup;
  heading: string;
  intro: string;
  cards: CatalogCard[];
}

export const CATALOG_SECTIONS: CatalogSection[] = [
  {
    group: "dating-couples",
    heading: "Couples Games & Questions",
    intro:
      "Four ways to learn something new about each other. See where you're aligned on the big topics, get to know each other a little better, go deeper with 36 questions, or pick a date night question and see where it goes.",
    cards: [
      {
        gameId: "how-well-do-you-know-each-other",
        title: "Are we on the same page?",
        subtitle: "Compatibility Quiz",
        description:
          "Discover where you and your partner align and differ on the important topics in your relationship.",
      },
      {
        gameId: "getting-to-know-you",
        title: "Getting to Know Each Other",
        subtitle: "Discovery & Conversation",
        description:
          "Explore each other's values, lifestyle, preferences, and perspectives through 12 multiple-choice questions.",
      },
      {
        gameId: "36-questions-to-fall-in-love",
        title: "36 Questions to Fall in Love",
        subtitle: "Deeper Conversations",
        description:
          "Answer meaningful questions together and discover new things about each other, one conversation at a time.",
      },
      {
        gameId: "date-night",
        title: "Date Night Questions",
        subtitle: "Date Night & Conversation",
        description:
          "Choose a mood, pick a question, and see where the conversation takes you on your next date night.",
      },
    ],
  },
  {
    group: "friends",
    heading: "Friendship Quizzes & Games",
    intro:
      "Two guessing games for you and a friend. Find out how well they know you, or how well they remember the moments you've shared.",
    cards: [
      {
        gameId: "how-well-do-you-know-me",
        title: "How Well Do You Know Me?",
        subtitle: "Best Friend Quiz",
        description:
          "Find out how well your friend knows your personality, preferences, and the little details that make you you.",
      },
      {
        gameId: "friendship-check",
        title: "Friendship Test",
        subtitle: "Shared Memories",
        description:
          "See how well you and your friend remember the moments, stories, and experiences you've shared.",
      },
    ],
  },
];

/** Make Your Own — the existing questionnaire builder, entered at /create
 * with no ready-made game (app/create/page.tsx's Make Your Own path, the
 * same destination /play's "Make Your Own" card has always used). */
export const MAKE_YOUR_OWN = {
  heading: "Make Your Own",
  intro:
    "Make it personal. Choose the questions that matter to you, answer them first, and invite someone to see where you're on the same page.",
  title: "Your Questions, Your Rules",
  subtitle: "Create Your Own Game",
  description:
    "Build a personal questionnaire, choose your topics, answer the questions yourself, and share a private link with your partner or friend.",
  cta: "Create your game",
  href: "/create",
} as const;

export function catalogSection(group: ReadyMadeGameGroup): CatalogSection {
  const section = CATALOG_SECTIONS.find((s) => s.group === group);
  if (!section) throw new Error(`no catalog section for ${group}`);
  return section;
}

/** A card's destination: its game's own experience page. */
export function catalogHref(card: CatalogCard): string {
  const href = getReadyMadeGame(card.gameId)?.href;
  if (!href) throw new Error(`catalog card ${card.gameId} has no experience page`);
  return href;
}
