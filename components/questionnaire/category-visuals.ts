import { CATEGORIES, type Category } from "@/lib/wavelength/categories";

/**
 * Presentation-only: which of the 5 approved pastel tints highlights a
 * selected category pill in the Figma create-flow reference. Purely
 * visual — `lib/wavelength/categories.ts` (the DB-mirrored source of
 * truth for the 6 categories themselves) is untouched; this file adds no
 * new categories, colors, or business rules, just a fixed mapping from
 * each existing category to one of the existing --wl-* tints (cycling,
 * since there are 6 categories and 5 tints).
 */
export type CategoryTint = "lavender" | "blue" | "mint" | "pink" | "peach";

const TINT_CYCLE: CategoryTint[] = ["lavender", "blue", "mint", "pink", "peach"];

export const CATEGORY_TINTS: Record<Category, CategoryTint> = Object.fromEntries(
  CATEGORIES.map((category, index) => [category, TINT_CYCLE[index % TINT_CYCLE.length]]),
) as Record<Category, CategoryTint>;

/** Same 5-tint cycle, indexed by a question's position in the list — used
 * for each question card's numbered badge on screens where that order is
 * permanently fixed (read-only review, B's answer page — no reorder is
 * possible there once a wavelength is shared). */
export function tintForIndex(index: number): CategoryTint {
  return TINT_CYCLE[index % TINT_CYCLE.length]!;
}

/**
 * Same 5-tint cycle, but keyed by a question's own stable `id` rather than
 * its position in the list (bug fix). `/create`'s builder list is
 * reorderable (see moveQuestion, app/actions/questions.ts), and QuestionCard
 * used to derive its tint from `index` — so swapping two neighbors visually
 * looked like the *colors* swapped in place rather than the cards
 * themselves moving, since each position always resolved to the same tint
 * regardless of which question now sat there. A tint derived purely from
 * the question's own id never changes for that question no matter how many
 * times it's reordered relative to its siblings, so the color now travels
 * with the card exactly like its content does. A simple, non-cryptographic
 * string hash is enough — it only needs to spread ids evenly across the
 * same 5 approved tints, deterministically. */
export function tintForId(id: string): CategoryTint {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return TINT_CYCLE[Math.abs(hash) % TINT_CYCLE.length]!;
}
