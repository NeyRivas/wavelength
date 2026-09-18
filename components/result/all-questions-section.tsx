import { CATEGORY_LABELS } from "@/lib/wavelength/categories";
import type { CategoryResult } from "@/lib/wavelength/result";

import { AlignmentBadge } from "./alignment-badge";
import { QuestionCompare } from "./question-compare";

/** Reuses the same `categories` (already grouped and, within each group,
 * sorted highest-alignment-first with ties preserving original question
 * order) that CategorySummary renders a summary of — no separate grouping
 * logic here. Each category is a native `<details>` disclosure (collapsed
 * by default, zero JS) rather than always-expanded — "Where You're
 * Aligned" and "Different Wavelengths" above already surface the
 * questions that matter most; this exhaustive, already-shown-elsewhere
 * list stays out of the way of mobile scrolling until someone asks for
 * it, without changing what data it shows or how it's grouped. */
export function AllQuestionsSection({
  categories,
  aliasA,
  aliasB,
}: {
  categories: CategoryResult[];
  aliasA: string;
  aliasB: string;
}) {
  return (
    <section className="result-section" aria-labelledby="all-questions-heading">
      <h2 id="all-questions-heading" className="result-section__heading">
        All Questions
      </h2>
      <p className="result-section__intro">Every question, grouped by category.</p>
      {categories.map((c) => (
        <details className="category-detail" key={c.category}>
          <summary className="category-detail__summary">
            <span>{CATEGORY_LABELS[c.category]}</span>
            <AlignmentBadge level={c.level} />
          </summary>
          <div className="category-detail__body">
            {c.questions.map((q) => (
              <QuestionCompare key={q.id} question={q} aliasA={aliasA} aliasB={aliasB} />
            ))}
          </div>
        </details>
      ))}
    </section>
  );
}
