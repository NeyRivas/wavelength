import { UNWRITTEN_OPTION, type Category, type QuestionType } from "./categories";

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
  /** Opt-in: how app/w/[token]/result/page.tsx should interpret this
   * game's finished answers. Omitted (the default) = the existing
   * compatibility/alignment Result view, unchanged, for every current
   * game. `"guess-accuracy"` = a friendship trivia game, not a
   * compatibility quiz: A's answers are the "correct" ones (about
   * themself), B is scored on how many they guessed right — rendered by
   * components/result/guess-accuracy-summary.tsx instead of the normal
   * GlobalSummary/AlignmentBadge, reusing the exact same per-question
   * choice scores lib/scoring/score.ts already computes (same option =
   * correct), just interpreted differently. `"friendship-memory"` is the
   * same idea for "Friendship Check" — A's answers are their own memory of
   * a shared moment, B is scored on how many they guessed right — with its
   * own isolated tiers/message copy (lib/wavelength/friendship-memory.ts,
   * components/result/friendship-memory-summary.tsx), not shared with
   * `"guess-accuracy"`'s. */
  resultMode?: "guess-accuracy" | "friendship-memory";
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

/**
 * The "How Well Do You Know Me? — Friendship Trivia" question set
 * (Friends group). A friendship trivia game, NOT a compatibility quiz: A
 * answers each question about themself (the "correct" answer), and B
 * tries to guess it — see resultMode: "guess-accuracy" on this game's
 * READY_MADE_GAMES entry below, and components/result/
 * guess-accuracy-summary.tsx for how the result is framed (count correct,
 * never a compatibility percentage).
 *
 * Question wording below is approved, verbatim — do not reword it.
 *
 * Answer options are intentionally NOT pre-filled here — there is no
 * approved option content for this game, and there never will be any we
 * invent. Each question seeds with two UNWRITTEN_OPTION slots (see
 * lib/wavelength/categories.ts's doc comment: the DB's own
 * questions_validate_options trigger rejects a genuinely empty option
 * string, so this is the smallest valid stand-in that still reads and
 * behaves as empty everywhere the UI/validation looks at it). From here
 * it's the existing, unmodified builder flow: A types their own options
 * into these slots (components/questionnaire/question-edit-form.tsx,
 * reused as-is, already renders an UNWRITTEN_OPTION slot as a blank,
 * placeholder-hinted field) and picks the correct one (AnswerControl,
 * reused as-is, only shown once components/questionnaire/question-card.tsx
 * sees enough real options to pick from); B later sees exactly what A
 * wrote and guesses it — no invented or reused content from any other
 * experience ever appears here.
 */
const HOW_WELL_DO_YOU_KNOW_ME_QUESTIONS: ReadyMadeQuestion[] = [
  {
    type: "choice",
    category: "values_priorities",
    text: "What's a song that will instantly make me think of a specific memory?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "lifestyle",
    text: "Which artist or band could I listen to over and over?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "values_priorities",
    text: "What's a random thing I'm weirdly passionate about?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "lifestyle",
    text: "What's something I always say when I'm annoyed?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "values_priorities",
    text: "Which fictional character would I defend with my life?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "values_priorities",
    text: "What's something I would absolutely judge someone for?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "lifestyle",
    text: "Which celebrity would I probably have a crush on?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "lifestyle",
    text: "What's a celebrity or public figure we both agree is overrated?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "values_priorities",
    text: "What's the kind of person I instantly dislike?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "values_priorities",
    text: "What's my most irrational opinion?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "lifestyle",
    text: "If we made a playlist that represents me, what song would have to be on it?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "values_priorities",
    text: "What's something you could mention and immediately know I'd have an opinion about?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
];

/**
 * The "Friendship Check" question set (Friends group). NOT "how well do
 * you know your friend?" — that's "How Well Do You Know Me?" above. This
 * one is about how well two friends know the *friendship itself*: the
 * shared memories, stories, inside jokes, places, and moments that belong
 * to both of them. Same answer mechanic as "How Well Do You Know Me?": A
 * answers each question with their own memory (the "correct" answer), B
 * tries to guess it — see resultMode: "friendship-memory" on this game's
 * READY_MADE_GAMES entry below, and lib/wavelength/friendship-memory.ts /
 * components/result/friendship-memory-summary.tsx for how the result is
 * framed (count correct, never a compatibility percentage) — fully
 * isolated from "How Well Do You Know Me?"'s own result copy.
 *
 * Question wording below is approved, verbatim — do not reword it.
 *
 * Answer options are intentionally NOT pre-filled here, same reasoning as
 * "How Well Do You Know Me?" above: each question seeds with two
 * UNWRITTEN_OPTION slots (lib/wavelength/categories.ts) so the existing
 * builder has valid, editable slots to render, and A writes their own
 * options from scratch — no invented or reused content.
 */
const FRIENDSHIP_CHECK_QUESTIONS: ReadyMadeQuestion[] = [
  {
    type: "choice",
    category: "relationship",
    text: "Where did we first meet?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "relationship",
    text: "What was the first thing we ever did together?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "lifestyle",
    text: "What’s the dumbest thing we’ve ever laughed about together?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "adventures_travel",
    text: "What’s something we’ve done together that sounded like a good idea at the time?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "lifestyle",
    text: "What’s the most embarrassing thing we’ve experienced together?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "relationship",
    text: "What’s an inside joke between us that would make absolutely no sense to anyone else?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "relationship",
    text: "What’s something that happened between us that we still randomly bring up?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "adventures_travel",
    text: "What’s a place, trip, or night out that instantly makes me think of you?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "relationship",
    text: "What’s the most “us” thing we’ve ever done?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "lifestyle",
    text: "What’s a phrase, song, place, or random thing that will always remind us of each other?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "relationship",
    text: "What’s a moment between us that I would happily relive?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
  },
  {
    type: "choice",
    category: "relationship",
    text: "What’s one story about us that we’ll probably still be telling years from now?",
    options: [UNWRITTEN_OPTION, UNWRITTEN_OPTION],
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
    builderSubtitle: "Think you know me? Let's find out.",
    group: "friends",
    questions: HOW_WELL_DO_YOU_KNOW_ME_QUESTIONS,
    resultMode: "guess-accuracy",
  },
  {
    id: "friendship-check",
    title: "Friendship Check",
    builderSubtitle: "The ultimate friendship test.",
    group: "friends",
    questions: FRIENDSHIP_CHECK_QUESTIONS,
    resultMode: "friendship-memory",
  },
];

export function getReadyMadeGame(id: string): ReadyMadeGame | undefined {
  return READY_MADE_GAMES.find((game) => game.id === id);
}
