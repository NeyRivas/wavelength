import { CATEGORY_TINTS } from "@/components/questionnaire/category-visuals";
import { CATEGORY_LABELS } from "@/lib/wavelength/categories";
import type { CategoryResult } from "@/lib/wavelength/result";

import { AlignmentBadge } from "./alignment-badge";

/** `categories` is already sorted highest-alignment-first with ties broken
 * by original question order (lib/wavelength/result.ts) — this component
 * only renders, it does no sorting of its own. Every category actually
 * used is shown, regardless of how low its score is. `CATEGORY_TINTS` is
 * the same fixed, presentation-only category→pastel-tint mapping
 * ReadOnlyAnswers already uses for the very same categories — reused here
 * purely for a colored card background, no new tint logic. */
export function CategorySummary({ categories }: { categories: CategoryResult[] }) {
  return (
    <section className="result-section" aria-labelledby="categories-heading">
      <h2 id="categories-heading" className="result-section__heading">
        Categories
      </h2>
      <div className="category-grid">
        {categories.map((c) => (
          <div
            className={`category-card category-card--${CATEGORY_TINTS[c.category]}`}
            key={c.category}
          >
            <p className="category-card__label">{CATEGORY_LABELS[c.category]}</p>
            <p className="category-card__score">{c.score}%</p>
            <AlignmentBadge level={c.level} />
          </div>
        ))}
      </div>
    </section>
  );
}
