/**
 * Result interpretation for "Friendship Check" (lib/wavelength/
 * ready-made-games.ts's `resultMode: "friendship-memory"`) — a shared-
 * history game, not a compatibility quiz and not the same thing as "How
 * Well Do You Know Me?" (that one is about knowing *a person*; this one is
 * about knowing the *friendship* two people share — see that game's own
 * questions vs. this one's). A writes each question's own answer options
 * (their own memory of the shared moment) and marks the correct one; B is
 * scored on how many they guessed right. This re-reads the exact same
 * per-question 0/100 scores lib/scoring/score.ts already computes for a
 * `choice` question (same option chosen = 100, different = 0) as
 * "correct"/"incorrect" — no scoring rule is duplicated or changed here.
 *
 * Deliberately a separate module from lib/wavelength/guess-accuracy.ts
 * rather than a shared/parameterized one: that module and its exact
 * approved message text belong to "How Well Do You Know Me?" alone and are
 * not touched by this game — see this game's own isolated result mode and
 * message set below. The tier thresholds happen to match (10-12/7-9/4-6/
 * 0-3 out of 12, both approved separately), but the message text does not.
 */

export type FriendshipMemoryTier = "excellent" | "good" | "fair" | "poor";

/** The approved message per tier, keyed by the minimum correct count that
 * reaches it (10-12, 7-9, 4-6, 0-3 out of 12). */
export const FRIENDSHIP_MEMORY_MESSAGES: Record<FriendshipMemoryTier, string> = {
  excellent: "You basically know our friendship by heart.",
  good: "Okay, you know our friendship pretty well.",
  fair: "We might need to make more memories.",
  poor: "Were you even there? \u{1F602}",
};

export interface FriendshipMemoryResult {
  correctCount: number;
  totalQuestions: number;
  tier: FriendshipMemoryTier;
  message: string;
}

function tierForCorrectCount(correctCount: number): FriendshipMemoryTier {
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
export function computeFriendshipMemory(scores: number[]): FriendshipMemoryResult {
  const totalQuestions = scores.length;
  const correctCount = scores.filter((score) => score === 100).length;
  const tier = tierForCorrectCount(correctCount);

  return { correctCount, totalQuestions, tier, message: FRIENDSHIP_MEMORY_MESSAGES[tier] };
}
