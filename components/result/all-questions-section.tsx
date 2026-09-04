import { CATEGORY_LABELS } from "@/lib/wavelength/categories";
import type { CategoryResult } from "@/lib/wavelength/result";

import { AlignmentBadge } from "./alignment-badge";
import { QuestionCompare } from "./question-compare";

/** Reuses the same `categories` (already grouped and, within each group,
 * sorted highest-alignment-first with ties preserving original question
 * order) that CategorySummary renders a summary of — no separate grouping
 * logic here. */
export function AllQuestionsSection({ categories }: { categories: CategoryResult[] }) {
  return (
    <section className="result-section" aria-labelledby="all-questions-heading">
      <h2 id="all-questions-heading">All Questions</h2>
      {categories.map((c) => (
        <div key={c.category}>
          <h3>
            {CATEGORY_LABELS[c.category]} <AlignmentBadge level={c.level} />
          </h3>
          {c.questions.map((q) => (
            <QuestionCompare key={q.id} question={q} />
          ))}
        </div>
      ))}
    </section>
  );
}
