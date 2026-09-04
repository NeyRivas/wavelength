import { CATEGORY_LABELS } from "@/lib/wavelength/categories";
import type { CategoryResult } from "@/lib/wavelength/result";

import { AlignmentBadge } from "./alignment-badge";

/** `categories` is already sorted highest-alignment-first with ties broken
 * by original question order (lib/wavelength/result.ts) — this component
 * only renders, it does no sorting of its own. Every category actually
 * used is shown, regardless of how low its score is. */
export function CategorySummary({ categories }: { categories: CategoryResult[] }) {
  return (
    <section className="result-section" aria-labelledby="categories-heading">
      <h2 id="categories-heading">Categories</h2>
      <div className="category-grid">
        {categories.map((c) => (
          <div className="category-card" key={c.category}>
            <p>{CATEGORY_LABELS[c.category]}</p>
            <p className="category-card__score">{c.score}%</p>
            <AlignmentBadge level={c.level} />
          </div>
        ))}
      </div>
    </section>
  );
}
