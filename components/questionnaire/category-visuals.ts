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
 * Assigns each question in `/create`'s reorderable builder list a tint
 * that's both stable across reorders AND distinct from its siblings' while
 * there are 5 or fewer of them (bug fix, 2nd pass). The first attempt at
 * "stable across reorders" hashed each question's own `id` — stable, yes,
 * but a hash can (and with only 5 buckets, easily does) collide, so two
 * different questions could land on the same tint even with as few as 3
 * questions total. That's wrong: with N <= 5 questions, all N tints shown
 * must be distinct, and with N > 5 the cycle may legitimately repeat.
 *
 * The fix ranks questions by `created_at` (a real DB column, already
 * present on every row — see supabase/migrations/20260904120100_schema.sql
 * — just not previously selected by /create's query) rather than by `id`
 * or by list position. Unlike `order_index`/array position, `created_at`
 * never changes for a question no matter how many times it's reordered
 * relative to its siblings — so ranking by it gives a tint that (a) is
 * guaranteed distinct among the first 5 questions ever added (rank 0-4 map
 * 1:1 onto the 5 tints), (b) only repeats once a 6th question exists,
 * exactly like the approved category-tint cycle already works elsewhere in
 * this file, and (c) travels permanently with its question through any
 * number of reorders, since reordering never touches `created_at`.
 *
 * Purely presentational and computed fresh on every render from data
 * already being fetched for other reasons — nothing is stored, no schema
 * change, no new column. `QuestionnaireBuilder` calls this once per render
 * with the full sibling list and threads the result down as an explicit
 * `tint` prop, since a single `QuestionCard` has no way to know its own
 * siblings' creation order on its own. */
export function assignQuestionTints(
  questions: { id: string; created_at?: string }[],
): Map<string, CategoryTint> {
  const ordered = [...questions].sort((a, b) => {
    const aTime = a.created_at ?? "";
    const bTime = b.created_at ?? "";
    if (aTime !== bTime) return aTime < bTime ? -1 : 1;
    // Deterministic tie-break for identical (or missing) timestamps.
    return a.id < b.id ? -1 : 1;
  });

  const tints = new Map<string, CategoryTint>();
  ordered.forEach((question, rank) => {
    tints.set(question.id, TINT_CYCLE[rank % TINT_CYCLE.length]!);
  });
  return tints;
}
