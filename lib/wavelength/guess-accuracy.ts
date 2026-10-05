/**
 * Result interpretation for "How Well Do You Know Me?" (lib/wavelength/
 * ready-made-games.ts's `resultMode: "guess-accuracy"`) — a friendship
 * trivia game, not a compatibility quiz. A answers each question about
 * themself (the "correct" answer); B is scored on how many they guessed
 * right. This re-reads the exact same per-question 0/100 scores
 * lib/scoring/score.ts already computes for a `choice` question (same
 * option chosen = 100, different = 0) as "correct"/"incorrect" instead of
 * "aligned"/"different wavelengths" — no scoring rule is duplicated or
 * changed here, and every other ready-made game keeps using the existing
 * compatibility framing (lib/wavelength/result.ts's
 * ALIGNMENT_INTERPRETATION) completely untouched.
 */

export type GuessAccuracyTier = "excellent" | "good" | "fair" | "poor";

/** The approved message per tier, keyed by the minimum correct count that
 * reaches it (10-12, 7-9, 4-6, 0-3 out of 12). */
export const GUESS_ACCURACY_MESSAGES: Record<GuessAccuracyTier, string> = {
  excellent: "You basically live in my head.",
  good: "Okay, you know me pretty well.",
  fair: "We might need to hang out more.",
  poor: "Do you even know me? \u{1F602}",
};

export interface GuessAccuracyResult {
  correctCount: number;
  totalQuestions: number;
  tier: GuessAccuracyTier;
  message: string;
}

function tierForCorrectCount(correctCount: number): GuessAccuracyTier {
  if (correctCount >= 10) return "excellent";
  if (correctCount >= 7) return "good";
  if (correctCount >= 4) return "fair";
  return "poor";
}

/**
 * `scores` is each question's already-computed score (0 or 100 for a
 * `choice` question — see lib/scoring/score.ts's `scoreQuestion`). Every
 * ready-made question in this game is `choice`, but this only ever treats
 * a 100 as "correct" regardless of question type, so it stays correct
 * even if that ever changed.
 */
export function computeGuessAccuracy(scores: number[]): GuessAccuracyResult {
  const totalQuestions = scores.length;
  const correctCount = scores.filter((score) => score === 100).length;
  const tier = tierForCorrectCount(correctCount);

  return { correctCount, totalQuestions, tier, message: GUESS_ACCURACY_MESSAGES[tier] };
}
