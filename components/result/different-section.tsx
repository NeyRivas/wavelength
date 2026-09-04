import type { DisplayQuestion } from "@/lib/wavelength/result";

import { QuestionCompare } from "./question-compare";

/** `questions` is already every question with a difference, lowest
 * alignment first (lib/wavelength/result.ts). Deliberately neutral,
 * curiosity-oriented copy — never "failures", "incompatibilities", or
 * "red flags". An empty list is a genuinely positive outcome, not an
 * empty section. */
export function DifferentSection({ questions }: { questions: DisplayQuestion[] }) {
  return (
    <section className="result-section" aria-labelledby="different-heading">
      <h2 id="different-heading">Different Wavelengths</h2>
      {questions.length === 0 ? (
        <p>You matched on everything — no differences to explore this time.</p>
      ) : (
        <>
          <p>
            Not matching isn&apos;t a bad thing — it&apos;s just where you see things differently.
          </p>
          {questions.map((q) => (
            <QuestionCompare key={q.id} question={q} />
          ))}
        </>
      )}
    </section>
  );
}
