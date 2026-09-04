import type { DisplayQuestion } from "@/lib/wavelength/result";

import { QuestionCompare } from "./question-compare";

/** `questions` is already exactly the top 3 (or fewer, if there aren't 3)
 * — lib/wavelength/result.ts's job, not this component's. Framed
 * positively per the approved rule. */
export function AlignedSection({ questions }: { questions: DisplayQuestion[] }) {
  return (
    <section className="result-section" aria-labelledby="aligned-heading">
      <h2 id="aligned-heading">Where You&apos;re Aligned</h2>
      <p>The questions where you saw eye to eye the most.</p>
      {questions.map((q) => (
        <QuestionCompare key={q.id} question={q} />
      ))}
    </section>
  );
}
