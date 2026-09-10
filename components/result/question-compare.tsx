import type { DisplayQuestion } from "@/lib/wavelength/result";

/** Both answers are already human-readable text (formatAnswer in
 * lib/wavelength/result.ts) — for a scale question that's the fixed 1-5
 * label, never the raw number. `aliasA`/`aliasB` are the real participant
 * names (bug-fix pass) — this never displays the bare "A"/"B" internal
 * labels to a user. */
export function QuestionCompare({
  question,
  aliasA,
  aliasB,
}: {
  question: DisplayQuestion;
  aliasA: string;
  aliasB: string;
}) {
  return (
    <article className="question-compare">
      <p>{question.text}</p>
      <div className="question-compare__answers">
        <div>
          <p className="question-compare__who">{aliasA}</p>
          <p>{question.answerA}</p>
        </div>
        <div>
          <p className="question-compare__who">{aliasB}</p>
          <p>{question.answerB}</p>
        </div>
      </div>
      <p>{question.score}% aligned</p>
    </article>
  );
}
