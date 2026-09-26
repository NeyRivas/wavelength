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

const HOW_WELL_DO_YOU_KNOW_EACH_OTHER: ReadyMadeQuestion[] = [
  {
    type: "choice",
    category: "lifestyle",
    text: "What's your ideal way to spend a free Saturday?",
    options: [
      "Staying in and doing absolutely nothing",
      "Going out and exploring somewhere new",
      "Seeing friends or family",
      "Doing something active",
      "A bit of everything",
    ],
  },
  {
    type: "choice",
    category: "lifestyle",
    text: "What's something small that instantly makes your day better?",
    options: [
      "Good food",
      "A really good song",
      "A funny conversation",
      "A thoughtful message",
      "Having some time to myself",
    ],
  },
  {
    type: "scale",
    category: "values_priorities",
    text: "How important is having alone time to you?",
  },
  {
    type: "choice",
    category: "lifestyle",
    text: "If you suddenly had a completely free day tomorrow, what would you be most likely to do?",
    options: [
      "Make plans and go somewhere",
      "Stay home and recharge",
      "Call someone and make spontaneous plans",
      "Catch up on things I've been putting off",
      "Decide when I wake up",
    ],
  },
  {
    type: "choice",
    category: "lifestyle",
    text: "What's most like you when making plans?",
    options: [
      "I plan everything ahead",
      "I like a rough plan but keep things flexible",
      "I prefer to decide spontaneously",
      "I usually let someone else make the plans",
    ],
  },
  {
    type: "choice",
    category: "lifestyle",
    text: "How do you usually react when plans suddenly change?",
    options: [
      "I'm totally fine with it — I like being spontaneous",
      "I'm fine with it as long as there's a good reason",
      "I need a little time to adjust",
      "I get annoyed when things don't go as planned",
      "It depends on the situation",
    ],
  },
  {
    type: "choice",
    category: "lifestyle",
    text: "What's your ideal kind of night?",
    options: [
      "Dinner and a good conversation",
      "Drinks and going out",
      "Movie, snacks, and staying in",
      "Something spontaneous and unexpected",
      "Early night and a good sleep",
    ],
  },
  {
    type: "choice",
    category: "values_priorities",
    text: "What's a completely normal thing that people do that makes you irrationally angry?",
    options: [
      "Being late",
      "Chewing loudly",
      "Leaving things messy",
      "Taking forever to make a decision",
      "Being on their phone while you're talking",
    ],
  },
  {
    type: "choice",
    category: "values_priorities",
    text: "What's something you would not like to change about yourself?",
    options: [
      "My sense of humor",
      "My independence",
      "My curiosity",
      "My ability to care deeply",
      "My personality",
    ],
  },
  {
    type: "choice",
    category: "lifestyle",
    text: "What's most likely to make you cancel plans?",
    options: [
      "I'm too tired",
      "I need some alone time",
      "Something better came up",
      "I just don't feel like going anymore",
      "I have too much going on",
    ],
  },
  {
    type: "choice",
    category: "adventures_travel",
    text: "If you had a completely free weekend and enough money to do something fun, what would you choose?",
    options: [
      "Take a little getaway",
      "Go out and have a night to remember",
      "Stay home and make it cozy",
      "Try something I've never done before",
      "Spend it with friends",
    ],
  },
  {
    type: "choice",
    category: "relationship",
    text: "What's something you value most in the people you're closest to?",
    options: ["Honesty", "Loyalty", "Humor", "Understanding", "Being able to completely be myself"],
  },
];

export const READY_MADE_GAMES: ReadyMadeGame[] = [
  {
    id: "how-well-do-you-know-each-other",
    title: "How Well Do You Know Each Other?",
    group: "dating-couples",
    questions: HOW_WELL_DO_YOU_KNOW_EACH_OTHER,
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
