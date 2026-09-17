import { CATEGORY_LABELS, type Category, type QuestionType } from "@/lib/wavelength/categories";
import { formatAnswer } from "@/lib/wavelength/result";

import { CATEGORY_TINTS, tintForIndex } from "./category-visuals";

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
 *
 * Presentation: reuses the exact card shell/badge/category-pill classes
 * and tint cycle the /create question builder already established
 * (.create-card, .create-card__head, category-visuals.ts) — same visual
 * object, just with no editable fields, no type/category controls, and
 * no move/delete affordances: every question here is locked, so nothing
 * on this card is interactive. The selected answer renders as a single
 * filled pill (.share-answer-pill--locked) rather than a row of
 * selectable options — there's nothing left to choose, only what A
 * already chose.
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
    <section className="share-answers" aria-labelledby="your-answers-heading">
      <h2 id="your-answers-heading" className="share-answers__heading">
        Your answers
      </h2>
      <p className="share-answers__text">Here&apos;s what you chose.</p>

      <ol className="create-card-list">
        {questions.map((question, index) => {
          const value = answerByQuestion.get(question.id);
          const tint = tintForIndex(index);
          return (
            <li key={question.id}>
              <article
                className="create-card"
                aria-label={`Question ${index + 1}: ${question.text}`}
              >
                <header className={`create-card__head create-card__head--${tint}`}>
                  <div className="create-card__badge">
                    <span className={`create-card__number create-card__number--${tint}`}>
                      {index + 1}
                    </span>
                    <span
                      className={`create-pill create-pill--${CATEGORY_TINTS[question.category]}`}
                    >
                      {CATEGORY_LABELS[question.category]}
                    </span>
                  </div>
                </header>

                <div className="create-card__body">
                  <p className="share-answer__question">{question.text}</p>
                  {value !== undefined ? (
                    <span className="share-answer-pill share-answer-pill--locked">
                      {formatAnswer(question, value)}
                    </span>
                  ) : (
                    <span className="share-answer-pill share-answer-pill--empty">Not answered</span>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
