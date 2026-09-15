import { saveAnswerA } from "@/app/actions/answers";
import { deleteQuestion, moveQuestion } from "@/app/actions/questions";

import { AnswerControl } from "./answer-control";
import { tintForIndex } from "./category-visuals";
import { QuestionEditForm } from "./question-edit-form";
import { TypeChangeControl } from "./type-change-control";
import type { QuestionRow } from "./types";

/**
 * One question's full editing surface: move/delete, type change, the
 * always-editable text/category/options form, and A's answer control. A Server
 * Component itself (move/delete are plain server-action-bound forms, no
 * client JS needed for those) that composes the smaller Client Components
 * that do need local state (type selection, dynamic option rows).
 *
 * Presentation only (Figma reference): everything below is the same
 * composition as before — TypeChangeControl, QuestionEditForm, and
 * AnswerControl, unmodified in logic — now inside one bordered card with
 * a colored numbered badge ("index" picks the tint, cycling the same 5
 * pastel tones used across the site) instead of a bare <article>, and the
 * move/delete controls restyled as small icon buttons instead of raw
 * "↑"/"↓"/"Delete" text.
 */
export function QuestionCard({
  wavelengthId,
  question,
  index,
  answerValue,
  isFirst,
  isLast,
}: {
  wavelengthId: string;
  question: QuestionRow;
  index: number;
  answerValue: number | undefined;
  isFirst: boolean;
  isLast: boolean;
}) {
  const tint = tintForIndex(index);

  return (
    <article className="create-card" aria-label={`Question: ${question.text}`}>
      <header className="create-card__head">
        <div className="create-card__badge">
          <span className={`create-card__number create-card__number--${tint}`}>{index + 1}</span>
          <span className="create-card__title">Question {index + 1}</span>
        </div>

        <div className="create-card__actions">
          <form action={moveQuestion}>
            <input type="hidden" name="wavelengthId" value={wavelengthId} />
            <input type="hidden" name="questionId" value={question.id} />
            <input type="hidden" name="direction" value="up" />
            <button
              type="submit"
              className="create-card__icon-btn"
              disabled={isFirst}
              aria-label="Move question up"
            >
              ↑
            </button>
          </form>
          <form action={moveQuestion}>
            <input type="hidden" name="wavelengthId" value={wavelengthId} />
            <input type="hidden" name="questionId" value={question.id} />
            <input type="hidden" name="direction" value="down" />
            <button
              type="submit"
              className="create-card__icon-btn"
              disabled={isLast}
              aria-label="Move question down"
            >
              ↓
            </button>
          </form>
          <form action={deleteQuestion}>
            <input type="hidden" name="questionId" value={question.id} />
            <button type="submit" className="create-card__delete">
              Delete
            </button>
          </form>
        </div>
      </header>

      <TypeChangeControl questionId={question.id} currentType={question.type} />
      <QuestionEditForm wavelengthId={wavelengthId} question={question} />
      {/* QA fix: AnswerControl's radios are uncontrolled (`defaultChecked`),
          which React only applies once, at mount — re-rendering the same
          instance with a fresh `currentValue` (e.g. after the invalidation
          trigger clears the answer server-side) never touches an
          already-mounted radio's checked state. Keying it by the exact
          fields the DB trigger watches (`text`/`options`) forces a full
          remount — fresh `defaultChecked` values from the just-revalidated
          `currentValue` — precisely when, and only when, the question was
          actually edited. A plain re-answer never changes this key (it
          doesn't touch text/options), so the existing select-and-auto-save
          flow is untouched. */}
      <AnswerControl
        key={JSON.stringify([question.text, question.options])}
        action={saveAnswerA}
        wavelengthId={wavelengthId}
        question={question}
        currentValue={answerValue}
      />
    </article>
  );
}
