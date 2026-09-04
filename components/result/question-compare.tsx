import type { DisplayQuestion } from "@/lib/wavelength/result";

/** Both answers are already human-readable text (formatAnswer in
 * lib/wavelength/result.ts) — for a scale question that's the fixed 1-5
 * label, never the raw number. */
export function QuestionCompare({ question }: { question: DisplayQuestion }) {
  return (
    <article className="question-compare">
      <p>{question.text}</p>
      <div className="question-compare__answers">
        <div>
          <p className="question-compare__who">A</p>
          <p>{question.answerA}</p>
        </div>
        <div>
          <p className="question-compare__who">B</p>
          <p>{question.answerB}</p>
        </div>
      </div>
      <p>{question.score}% aligned</p>
    </article>
  );
}
