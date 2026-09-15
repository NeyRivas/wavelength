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
 * for each question card's numbered badge. */
export function tintForIndex(index: number): CategoryTint {
  return TINT_CYCLE[index % TINT_CYCLE.length]!;
}
