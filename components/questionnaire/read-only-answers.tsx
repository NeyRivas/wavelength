import { CATEGORY_LABELS, type Category, type QuestionType } from "@/lib/wavelength/categories";
import { formatAnswer } from "@/lib/wavelength/result";

/**
 * QA fix: A previously had no way to see their own questions/answers again
 * after finalizing (the questionnaire is locked at that point, and the
 * page only showed the share link + B's status). This is read-only by
 * construction — no form, no input, no Server Action — reusing
 * `formatAnswer` from the result module so a Choice/Scale answer renders
 * the same human-readable text here as it eventually will on the shared
 * result, rather than a raw index/number.
 *
 * Rendered by app/w/[token]/page.tsx alongside ShareView for A, in every
 * non-DRAFT, non-COMPLETED state (WAITING/IN_PROGRESS) — COMPLETED already
 * redirects to the real shared result before this ever renders, so this
 * view never competes with or duplicates that.
 */
export function ReadOnlyAnswers({
  questions,
  answers,
}: {
  questions: {
    id: string;
    category: Category;
    type: QuestionType;
    text: string;
    options: string[] | null;
    order_index: number;
  }[];
  answers: { question_id: string; value: number }[];
}) {
  const answerByQuestion = new Map(answers.map((a) => [a.question_id, a.value]));

  return (
    <section aria-labelledby="your-answers-heading">
      <h2 id="your-answers-heading">Your questions and answers</h2>
      <p>Read-only — your questionnaire is locked now that it&apos;s been shared.</p>
      <ol>
        {questions.map((question) => {
          const value = answerByQuestion.get(question.id);
          return (
            <li key={question.id}>
              <p>{CATEGORY_LABELS[question.category]}</p>
              <p>{question.text}</p>
              <p>{value !== undefined ? formatAnswer(question, value) : "Not answered"}</p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
