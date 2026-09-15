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
 * AnswerControl, unmodified in logic — now inside one card with a
 * full-bleed colored head band (its own tint, cycling the same 5 pastel
 * tones every card badge already used) instead of a plain bordered
 * <article>. Once A has answered ("isReady"), the head band's title
 * switches to "Ready ✓" and the card gets a stronger mint-tinted border,
 * matching the reference's completed-question treatment — purely a
 * derived-from-existing-props visual state (`answerValue !== undefined`),
 * not a new completeness rule (finalize eligibility is still computed
 * exactly as before, in questionnaire-builder.tsx).
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
  const isReady = answerValue !== undefined;

  return (
    <article
      className={`create-card${isReady ? " create-card--ready" : ""}`}
      aria-label={`Question: ${question.text}`}
    >
      <header className={`create-card__head create-card__head--${tint}`}>
        <div className="create-card__badge">
          <span className={`create-card__number create-card__number--${tint}`}>{index + 1}</span>
          <span className={`create-card__title${isReady ? " create-card__title--ready" : ""}`}>
            {isReady ? "Ready ✓" : `Question ${index + 1}`}
          </span>
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

      <div className="create-card__body">
        <TypeChangeControl questionId={question.id} currentType={question.type} />
        <QuestionEditForm
          wavelengthId={wavelengthId}
          question={question}
          answerValue={answerValue}
        />
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
      </div>
    </article>
  );
}
