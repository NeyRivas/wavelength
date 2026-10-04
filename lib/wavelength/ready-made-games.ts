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
  /** Optional descriptive/SEO line shown under `title` on the game card
   * (GameCard) — e.g. the experience name "Are we on the same page?" with
   * "Compatibility Quiz" as its subtitle. Omitted for every other game. */
  subtitle?: string;
  /** Optional longer line shown under the heading on /create's builder
   * screen specifically (app/create/page.tsx's CreateShellIntro) —
   * distinct from `subtitle` above (the short GameCard label): this one
   * describes the experience itself once A is actually answering it.
   * Omitted for games with no builder (e.g. Date Night, which never
   * reaches /create) or no ready-made questions yet. */
  builderSubtitle?: string;
  group: ReadyMadeGameGroup;
  /** `null` = card is shown on the landing page but not wired up yet
   * (unless `href` is set — see below). */
  questions: ReadyMadeQuestion[] | null;
  /** Optional: when set, this card is plain navigation to a standalone
   * experience (e.g. Date Night's conversation-starter library,
   * app/play/dating-couples/date-night) instead of seeding a
   * questionnaire draft via startReadyMadeGame. Takes priority over
   * `questions`/`playable` in GameCard. */
  href?: string;
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

/**
 * The "Getting to know each other" question set — discovery and
 * conversation, not compatibility. There's no scoring or interpretation
 * specific to this experience; it uses the exact same choice/scale
 * mechanics and per-question category as every other questionnaire, so
 * category here is just a grouping label (never surfaced as "this is a
 * compatibility dimension") — chosen per question from the existing
 * enum, favoring `values_priorities` (self/identity), `lifestyle`
 * (everyday moments), `relationship` (shared/social experiences), and
 * `adventures_travel` (things to try or revisit).
 */
const GETTING_TO_KNOW_EACH_OTHER_QUESTIONS: ReadyMadeQuestion[] = [
  {
    type: "choice",
    category: "values_priorities",
    text: "What's a childhood memory you still think about sometimes?",
    options: [
      "A family tradition or holiday memory",
      "A funny or embarrassing moment",
      "A moment with a close friend",
      "A trip or adventure I went on",
      "A quiet, ordinary moment that just stuck with me",
    ],
  },
  {
    type: "choice",
    category: "lifestyle",
    text: "What's something small that can instantly make your day better?",
    options: [
      "Good music",
      "A good meal",
      "A message from someone I care about",
      "Sunshine and being outside",
      "A few minutes of quiet",
    ],
  },
  {
    type: "choice",
    category: "lifestyle",
    text: "If you had a completely free day with no responsibilities, how would you spend it?",
    options: [
      "Exploring somewhere new",
      "Relaxing at home, no plans at all",
      "Spending it with people I love",
      "Doing something active outdoors",
      "Working on a personal project or hobby",
    ],
  },
  {
    type: "choice",
    category: "values_priorities",
    text: "What's something you're really into that you could happily talk about for hours?",
    options: [
      "Music",
      "Movies or shows",
      "Food and cooking",
      "Sports",
      "A hobby or creative project",
    ],
  },
  {
    type: "choice",
    category: "adventures_travel",
    text: "What's something you've always wanted to try at least once?",
    options: [
      "Traveling somewhere far away",
      "Learning a new skill",
      "An adrenaline-filled adventure",
      "Trying a creative pursuit like art or music",
      "Something completely outside my comfort zone",
    ],
  },
  {
    type: "choice",
    category: "relationship",
    text: "What kind of memories do you love making with other people?",
    options: [
      "Spontaneous adventures",
      "Deep, meaningful conversations",
      "Laughing until it hurts",
      "Trying new things together",
      "Simple, cozy time together",
    ],
  },
  {
    type: "choice",
    category: "values_priorities",
    text: "Who has had a big influence on the person you are today?",
    options: [
      "A family member",
      "A close friend",
      "A teacher or mentor",
      "Someone I admired from a distance",
      "A person who challenged me",
    ],
  },
  {
    type: "choice",
    category: "adventures_travel",
    text: "What's a place you've been that you'd love to experience again?",
    options: [
      "Because of the people I was with",
      "Because of how peaceful it felt",
      "Because there was more to explore",
      "Because of a specific memory tied to it",
      "Because I'd see it differently now",
    ],
  },
  {
    type: "choice",
    category: "values_priorities",
    text: "What's something people tend to notice about you once they get to know you?",
    options: [
      "That I'm more thoughtful than I first seem",
      "That I have a great sense of humor",
      "That I care a lot about the people close to me",
      "That I'm more adventurous than expected",
      "That I notice small details others miss",
    ],
  },
  {
    type: "choice",
    category: "lifestyle",
    text: "If you could instantly become really good at something, what would you choose?",
    options: [
      "Playing an instrument",
      "Cooking like a professional chef",
      "Speaking another language fluently",
      "A sport I've never mastered",
      "A creative skill like painting or writing",
    ],
  },
  {
    type: "choice",
    category: "values_priorities",
    text: "What's something you've changed your mind about as you've gotten older?",
    options: [
      "What actually makes me happy",
      "How I handle stress or setbacks",
      "What I look for in relationships",
      "How I spend my free time",
      "What success means to me",
    ],
  },
  {
    type: "choice",
    category: "relationship",
    text: "What's something about you that you'd love for someone you're dating to discover?",
    options: [
      "A hidden talent I don't often show",
      "How loyal I am to the people I love",
      "A quirky passion of mine",
      "How much I care once I let someone in",
      "A dream I'm quietly working toward",
    ],
  },
];

export const READY_MADE_GAMES: ReadyMadeGame[] = [
  {
    id: "how-well-do-you-know-each-other",
    title: "Are we on the same page?",
    subtitle: "Compatibility Quiz",
    builderSubtitle: "A relationship compatibility quiz to see where you align.",
    group: "dating-couples",
    questions: COMPATIBILITY_QUIZ_QUESTIONS,
  },
  {
    id: "getting-to-know-you",
    title: "Getting to know each other",
    subtitle: "Discovery & Conversation",
    builderSubtitle: "A conversation quiz to discover more about each other.",
    group: "dating-couples",
    questions: GETTING_TO_KNOW_EACH_OTHER_QUESTIONS,
  },
  {
    id: "date-night",
    title: "Date Night",
    subtitle: "Conversation Starters",
    group: "dating-couples",
    questions: null,
    href: "/play/dating-couples/date-night",
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
