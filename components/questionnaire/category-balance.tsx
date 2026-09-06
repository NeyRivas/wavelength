import { CATEGORIES, CATEGORY_LABELS, type Category } from "@/lib/wavelength/categories";

/**
 * Soft guidance only, per the approved rule — a live tally, never a
 * validation error and never blocks adding a question. See §13.B in
 * ARCHITECTURE.md. Always shows all 6 fixed categories (there is no
 * pre-chosen subset any more — progressive creation, resolved decision), so
 * this doubles as a hint about categories not touched yet.
 */
export function CategoryBalance({ questions }: { questions: { category: Category }[] }) {
  const counts = new Map<Category, number>(CATEGORIES.map((c) => [c, 0]));
  for (const q of questions) {
    counts.set(q.category, (counts.get(q.category) ?? 0) + 1);
  }

  return (
    <section aria-labelledby="category-balance-heading">
      <h2 id="category-balance-heading">Category balance</h2>
      <p>A guide, not a rule — you don&apos;t need an even split.</p>
      <ul>
        {CATEGORIES.map((category) => (
          <li key={category}>
            {CATEGORY_LABELS[category]}: {counts.get(category) ?? 0}
          </li>
        ))}
      </ul>
    </section>
  );
}
