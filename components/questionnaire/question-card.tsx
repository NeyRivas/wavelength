import { saveAnswerA } from "@/app/actions/answers";
import { deleteQuestion, moveQuestion } from "@/app/actions/questions";
import { CATEGORY_LABELS } from "@/lib/wavelength/categories";

import { AnswerControl } from "./answer-control";
import { QuestionEditForm } from "./question-edit-form";
import { TypeChangeControl } from "./type-change-control";
import type { QuestionRow } from "./types";

/**
 * One question's full editing surface: move/delete, type change, the
 * always-editable text/options form, and A's answer control. A Server
 * Component itself (move/delete are plain server-action-bound forms, no
 * client JS needed for those) that composes the smaller Client Components
 * that do need local state (type selection, dynamic option rows).
 */
export function QuestionCard({
  wavelengthId,
  question,
  answerValue,
  isFirst,
  isLast,
}: {
  wavelengthId: string;
  question: QuestionRow;
  answerValue: number | undefined;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <article aria-label={`Question: ${question.text}`}>
      <header>
        <span>{CATEGORY_LABELS[question.category]}</span>

        <form action={moveQuestion} style={{ display: "inline" }}>
          <input type="hidden" name="wavelengthId" value={wavelengthId} />
          <input type="hidden" name="questionId" value={question.id} />
          <input type="hidden" name="direction" value="up" />
          <button type="submit" disabled={isFirst} aria-label="Move question up">
            ↑
          </button>
        </form>
        <form action={moveQuestion} style={{ display: "inline" }}>
          <input type="hidden" name="wavelengthId" value={wavelengthId} />
          <input type="hidden" name="questionId" value={question.id} />
          <input type="hidden" name="direction" value="down" />
          <button type="submit" disabled={isLast} aria-label="Move question down">
            ↓
          </button>
        </form>

        <form action={deleteQuestion} style={{ display: "inline" }}>
          <input type="hidden" name="questionId" value={question.id} />
          <button type="submit">Delete</button>
        </form>
      </header>

      <TypeChangeControl questionId={question.id} currentType={question.type} />
      <QuestionEditForm wavelengthId={wavelengthId} question={question} />
      <AnswerControl
        action={saveAnswerA}
        wavelengthId={wavelengthId}
        question={question}
        currentValue={answerValue}
      />
    </article>
  );
}
