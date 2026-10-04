/**
 * Deterministic card-gradient assignment for Date Night's main question
 * card. Each question always gets the same gradient — a pure function of
 * its stable id, never `Math.random()` — so the same question looks the
 * same every time it's shown, whether it got there via Next, Shuffle,
 * Search, a mood filter, Favorites, or the Browse Questions list, and the
 * gradient only changes when `question.id` actually changes, never on an
 * unrelated re-render.
 *
 * The 10 combos below (see .dn-card--g1..g10 in app/globals.css) are drawn
 * from the approved Sameeeish palette (lavender/blue/pink/peach/mint,
 * plus white for a couple of airier combos) — the same soft-pastel
 * language as the existing .game-card--vivid cards, just more variations
 * since this card is shown one question at a time rather than side by
 * side with its siblings.
 */
const GRADIENT_CLASS_COUNT = 10;

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

export function getDateNightGradientClass(id: string): string {
  const variant = (hashString(id) % GRADIENT_CLASS_COUNT) + 1;
  return `dn-card--g${variant}`;
}
