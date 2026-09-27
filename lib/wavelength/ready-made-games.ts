import type { Category, QuestionType } from "./categories";

/**
 * "Pick a game" (landing page) data. A ready-made game is not a new game
 * mode or a new participant flow — it's exactly the same DRAFT Wavelength +
 * questions + answers + scoring the "Make Your Own" flow already uses. The
 * only difference is where the questions come from: typed in one at a time
 * by A (Make Your Own) vs. inserted all at once from this fixed list
 * (app/actions/ready-made-games.ts). Every question here uses the same
 * `choice`/`scale` types, the same category enum, and the same
 * MIN/MAX_CHOICE_OPTIONS bounds as a manually-created question — see
 * lib/validation/schemas.ts's questionInputSchema, which this data is
 * shaped to satisfy exactly.
 */

export interface ReadyMadeQuestion {
  type: QuestionType;
  category: Category;
  text: string;
  /** Omitted for `scale` questions — the app always renders the fixed
   * SCALE_LABELS for those (categories.ts), never per-question text, so a
   * scale question's own option wording here would never actually be
   * shown. */
  options?: string[];
}

export type ReadyMadeGameGroup = "dating-couples" | "friends";

export interface ReadyMadeGame {
  id: string;
  title: string;
  group: ReadyMadeGameGroup;
  /** `null` = card is shown on the landing page but not wired up yet. */
  questions: ReadyMadeQuestion[] | null;
}

/**
 * The "Are we on the same page? — Compatibility Quiz" question set.
 *
 * The quiz's own categories (Relationship, Communication, Lifestyle,
 * Money, Family & Future) don't map 1:1 onto the fixed `Category` enum
 * (categories.ts, mirrored by the DB) — there is no "communication" or
 * "family_future" value, and the schema isn't being changed for this.
 * Communication questions are stored as "relationship" (they're about the
 * relationship's dynamics) and Family & Future questions as "future".
 * This only affects the category-label grouping shown for these
 * questions elsewhere in the app — it has no effect on choice/scale
 * scoring (lib/scoring/score.ts), which is type-driven, not
 * category-driven.
 */
const COMPATIBILITY_QUIZ_QUESTIONS: ReadyMadeQuestion[] = [
  {
    type: "choice",
    category: "relationship",
    text: "What makes you feel most loved in a relationship?",
    options: [
      "Spending quality time together",
      "Words of affection and appreciation",
      "Physical affection",
      "Thoughtful gestures",
      "Feeling supported when I need it",
    ],
  },
  {
    type: "choice",
    category: "relationship",
    text: "What does commitment mean to you?",
    options: [
      "Choosing each other and building a life together",
      "Being loyal and emotionally dependable",
      "Making important decisions as a team",
      "Staying committed through difficult times",
    ],
  },
  {
    type: "choice",
    category: "relationship",
    text: "When something is bothering you, what are you most likely to do?",
    options: [
      "Talk about it right away",
      "Take some time before bringing it up",
      "Wait until the right moment",
      "Try to work through it on my own first",
      "Hope it passes on its own",
    ],
  },
  {
    type: "choice",
    category: "relationship",
    text: "When you disagree with your partner, what matters most to you?",
    options: [
      "Feeling understood",
      "Finding a solution",
      "Staying calm and avoiding unnecessary conflict",
      "Being honest, even when it's uncomfortable",
      "Reaching a compromise",
    ],
  },
  {
    type: "choice",
    category: "relationship",
    text: "After an argument, how much space do you usually need before talking things through?",
    options: [
      "I want to talk it out right away",
      "I need a little time first",
      "I need some space to process",
      "I prefer to wait until I feel completely calm",
      "I need quite a lot of time before talking",
    ],
  },
  {
    type: "choice",
    category: "lifestyle",
    text: "How much alone time do you need in a relationship?",
    options: [
      "Almost none — I love doing most things together",
      "A little — I like having some time to myself",
      "A fair amount — I need regular time on my own",
      "A lot — having my own time is very important to me",
    ],
  },
  {
    type: "choice",
    category: "lifestyle",
    text: "How would you feel about living together before marriage?",
    options: [
      "I'd definitely want to",
      "I'd probably want to",
      "I'm not sure",
      "I'd probably prefer not to",
      "I'd definitely prefer not to",
    ],
  },
  {
    type: "choice",
    category: "money",
    text: "How would you describe your approach to money?",
    options: [
      "I like to save as much as I can",
      "I like to enjoy my money while still saving",
      "I'm somewhere in the middle",
      "I tend to spend more than I save",
      "I don't think about it much",
    ],
  },
  {
    type: "choice",
    category: "money",
    text: "How comfortable would you be combining finances with a serious partner?",
    options: [
      "I'd want to combine most of our finances",
      "I'd prefer to combine some but keep some separate",
      "I'd rather keep our finances mostly separate",
      "I'd want to keep our finances completely separate",
      "I'm not sure yet",
    ],
  },
  {
    type: "choice",
    category: "future",
    text: "Do you want children someday?",
    options: ["Yes, definitely", "Probably", "I'm not sure", "Probably not", "No, definitely not"],
  },
  {
    type: "scale",
    category: "future",
    text: "How important is marriage to you?",
  },
  {
    type: "choice",
    category: "future",
    text: "How open would you be to moving somewhere new for your partner?",
    options: [
      "I'd be very open to it",
      "I'd consider it for the right reasons",
      "I'd prefer to stay where I am",
      "I'd strongly prefer not to move",
      "It would depend on where",
    ],
  },
];

export const READY_MADE_GAMES: ReadyMadeGame[] = [
  {
    id: "how-well-do-you-know-each-other",
    title: "Compatibility Quiz",
    group: "dating-couples",
    questions: COMPATIBILITY_QUIZ_QUESTIONS,
  },
  {
    id: "getting-to-know-you",
    title: "Getting to Know You",
    group: "dating-couples",
    questions: null,
  },
  {
    id: "date-night",
    title: "Date Night",
    group: "dating-couples",
    questions: null,
  },
  {
    id: "how-well-do-you-know-me",
    title: "How Well Do You Know Me?",
    group: "friends",
    questions: null,
  },
  {
    id: "friendship-check",
    title: "Friendship Check",
    group: "friends",
    questions: null,
  },
];

export function getReadyMadeGame(id: string): ReadyMadeGame | undefined {
  return READY_MADE_GAMES.find((game) => game.id === id);
}
