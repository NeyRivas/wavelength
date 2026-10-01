/**
 * Date Night — Conversation Starters: a static local question library.
 * Not a questionnaire, not scored, not stored in Supabase — just a fixed
 * list a Client Component (components/date-night/date-night-experience.tsx)
 * filters/shuffles entirely in the browser. Deliberately plain data (no
 * database, no API route) so it can grow from 60 questions to hundreds
 * later by just appending entries here.
 */

export const MOODS = ["flirty", "funny", "romantic", "random", "deep", "hypothetical"] as const;

export type Mood = (typeof MOODS)[number];

export const MOOD_LABELS: Record<Mood, string> = {
  flirty: "Flirty",
  funny: "Funny",
  romantic: "Romantic",
  random: "Random",
  deep: "Deep",
  hypothetical: "Hypothetical",
};

export interface DateNightQuestion {
  id: string;
  text: string;
  /** A question can belong to more than one mood — moods are just tags
   * for filtering, not a single fixed category. */
  moods: Mood[];
}

export const DATE_NIGHT_QUESTIONS: DateNightQuestion[] = [
  // Romantic
  {
    id: "dn-01",
    text: "What's something that instantly makes a moment feel romantic to you?",
    moods: ["romantic"],
  },
  {
    id: "dn-02",
    text: "What's a small gesture that would make you feel really loved?",
    moods: ["romantic", "deep"],
  },
  { id: "dn-03", text: "What's your idea of a genuinely perfect date?", moods: ["romantic"] },
  {
    id: "dn-04",
    text: "What's a song that feels a little romantic to you?",
    moods: ["romantic", "random"],
  },
  {
    id: "dn-05",
    text: "What's something you'd love to experience with someone you're dating?",
    moods: ["romantic", "hypothetical"],
  },
  { id: "dn-06", text: "What's your favorite kind of affection?", moods: ["romantic", "deep"] },
  {
    id: "dn-07",
    text: "What's a moment between two people that you find unexpectedly romantic?",
    moods: ["romantic"],
  },
  {
    id: "dn-08",
    text: "What's something you'd love someone to remember about you?",
    moods: ["romantic", "deep"],
  },
  {
    id: "dn-09",
    text: "If we could relive one moment together, which one would you choose?",
    moods: ["romantic", "hypothetical"],
  },
  {
    id: "dn-10",
    text: "What's something about falling for someone that you secretly love?",
    moods: ["romantic", "deep"],
  },
  // Flirty
  {
    id: "dn-11",
    text: "What's the first thing you actually noticed about me?",
    moods: ["flirty", "romantic"],
  },
  {
    id: "dn-12",
    text: "What's a trait you find attractive that you have absolutely no business finding attractive?",
    moods: ["flirty", "funny", "random"],
  },
  {
    id: "dn-13",
    text: "What's something someone can do that instantly makes them more attractive to you?",
    moods: ["flirty"],
  },
  { id: "dn-14", text: "What's your favorite kind of flirting?", moods: ["flirty"] },
  {
    id: "dn-15",
    text: "What's something you find ridiculously charming?",
    moods: ["flirty", "funny"],
  },
  {
    id: "dn-16",
    text: "What's the most attractive thing someone can do without realizing it?",
    moods: ["flirty"],
  },
  {
    id: "dn-17",
    text: "What's a compliment that would actually make you blush?",
    moods: ["flirty", "romantic"],
  },
  {
    id: "dn-18",
    text: "What's your biggest weakness when you're attracted to someone?",
    moods: ["flirty", "funny"],
  },
  {
    id: "dn-19",
    text: "What's something you'd consider dangerously good chemistry?",
    moods: ["flirty", "romantic"],
  },
  {
    id: "dn-20",
    text: "What's the most obvious sign that you're into someone?",
    moods: ["flirty"],
  },
  // Funny
  {
    id: "dn-21",
    text: "What's a completely normal thing that people do that irrationally annoys you?",
    moods: ["funny", "random"],
  },
  {
    id: "dn-22",
    text: "What's the worst text you've ever sent to the wrong person?",
    moods: ["funny", "random"],
  },
  {
    id: "dn-23",
    text: "If I got arrested, what would you assume I had done?",
    moods: ["funny", "hypothetical"],
  },
  {
    id: "dn-24",
    text: "What's something you do that your 18-year-old self would be embarrassed about?",
    moods: ["funny", "deep"],
  },
  {
    id: "dn-25",
    text: "What's the weirdest thing you believed as a kid?",
    moods: ["funny", "random"],
  },
  {
    id: "dn-26",
    text: "If we had to compete on a reality show together, which one would we absolutely fail at?",
    moods: ["funny", "hypothetical"],
  },
  {
    id: "dn-27",
    text: 'What\'s your most embarrassing "I thought nobody saw that" moment?',
    moods: ["funny"],
  },
  {
    id: "dn-28",
    text: "If your personality came with a warning label, what would it say?",
    moods: ["funny", "random"],
  },
  {
    id: "dn-29",
    text: "What's the most ridiculous thing you've ever done because you were trying to impress someone?",
    moods: ["funny", "flirty"],
  },
  {
    id: "dn-30",
    text: "If I gave you $1,000 to spend on something completely useless tonight, what would you buy?",
    moods: ["funny", "hypothetical", "random"],
  },
  // Random
  {
    id: "dn-31",
    text: "What's something you could talk about for way longer than anyone expects?",
    moods: ["random", "deep"],
  },
  {
    id: "dn-32",
    text: "What's a completely random opinion you feel surprisingly strongly about?",
    moods: ["random", "funny"],
  },
  {
    id: "dn-33",
    text: "If you could instantly become amazing at one completely random skill, what would you choose?",
    moods: ["random", "hypothetical"],
  },
  {
    id: "dn-34",
    text: "What's something you've always wanted to try just because it looks fun?",
    moods: ["random", "hypothetical"],
  },
  {
    id: "dn-35",
    text: "If you could have dinner with any fictional character, who would you pick?",
    moods: ["random", "hypothetical"],
  },
  {
    id: "dn-36",
    text: "What's a place you'd go back to tomorrow if you could?",
    moods: ["random", "romantic"],
  },
  {
    id: "dn-37",
    text: "If you had to live in one movie or TV show for a week, which one would you choose?",
    moods: ["random", "hypothetical"],
  },
  {
    id: "dn-38",
    text: "What's something small that can instantly make your day better?",
    moods: ["random", "romantic"],
  },
  {
    id: "dn-39",
    text: "If you could wake up tomorrow anywhere in the world, where would you want to be?",
    moods: ["random", "hypothetical", "romantic"],
  },
  {
    id: "dn-40",
    text: "What's a totally unnecessary thing you would still hate to live without?",
    moods: ["random", "funny"],
  },
  // Deep
  {
    id: "dn-41",
    text: "What's something you've changed your mind about as you've gotten older?",
    moods: ["deep"],
  },
  {
    id: "dn-42",
    text: "What's something you're proud of that nobody ever asks you about?",
    moods: ["deep"],
  },
  {
    id: "dn-43",
    text: "What's something you understand about yourself now that you didn't a few years ago?",
    moods: ["deep"],
  },
  {
    id: "dn-44",
    text: "What's something you're still figuring out about yourself?",
    moods: ["deep"],
  },
  {
    id: "dn-45",
    text: "What's a part of your life that feels really good right now?",
    moods: ["deep"],
  },
  {
    id: "dn-46",
    text: "What's something you wish people understood about you sooner?",
    moods: ["deep", "romantic"],
  },
  {
    id: "dn-47",
    text: "What's something you wouldn't want to change about yourself?",
    moods: ["deep"],
  },
  {
    id: "dn-48",
    text: "What's something that has had a bigger influence on who you are than people might realize?",
    moods: ["deep"],
  },
  {
    id: "dn-49",
    text: "What's something you've learned from a relationship that stayed with you?",
    moods: ["deep", "romantic"],
  },
  {
    id: "dn-50",
    text: "What's something you hope your future self never forgets about who you are today?",
    moods: ["deep", "hypothetical"],
  },
  // Hypothetical
  {
    id: "dn-51",
    text: "If we could disappear for 24 hours and go anywhere, where would we go?",
    moods: ["hypothetical", "romantic", "random"],
  },
  {
    id: "dn-52",
    text: 'If I gave you a plane ticket and said "pack one bag," where are we going?',
    moods: ["hypothetical", "random"],
  },
  {
    id: "dn-53",
    text: "If we had to open a business together tomorrow, what would we sell?",
    moods: ["hypothetical", "funny"],
  },
  {
    id: "dn-54",
    text: "If we could swap lives for one day, what would you be most curious to experience?",
    moods: ["hypothetical", "random", "deep"],
  },
  {
    id: "dn-55",
    text: "If we won $10 million tomorrow, what's the first thing you think we'd do?",
    moods: ["hypothetical", "funny", "romantic"],
  },
  {
    id: "dn-56",
    text: "If we could instantly become experts at one thing together, what would you choose?",
    moods: ["hypothetical", "random"],
  },
  {
    id: "dn-57",
    text: "If we had to spend a month living somewhere completely new, where would you pick?",
    moods: ["hypothetical", "romantic"],
  },
  {
    id: "dn-58",
    text: "If tonight could turn into one completely unexpected adventure, what would you want it to be?",
    moods: ["hypothetical", "romantic", "random"],
  },
  {
    id: "dn-59",
    text: "If we could recreate one fictional date from a movie or show, which one would you choose?",
    moods: ["hypothetical", "romantic", "random"],
  },
  {
    id: "dn-60",
    text: "If you could know one thing about our future together, what would you want to know?",
    moods: ["hypothetical", "romantic", "deep"],
  },
];

export const DATE_NIGHT_QUESTIONS_BY_ID = new Map<string, DateNightQuestion>(
  DATE_NIGHT_QUESTIONS.map((question) => [question.id, question]),
);
