"use client";

import { useActionState } from "react";

import { changeQuestionType } from "@/app/actions/questions";
import { initialActionState } from "@/app/actions/shared";
import {
  QUESTION_TYPE_LABELS,
  QUESTION_TYPES,
  type QuestionType,
} from "@/lib/wavelength/categories";

/** One line of guidance under each type option, matching the Figma
 * reference's "Pick one answer" / "Choose where you land" subtext.
 * Presentation only — QUESTION_TYPES itself (just "choice" and "scale",
 * "situation" already removed from the product) is untouched. */
const TYPE_HINTS: Record<QuestionType, string> = {
  choice: "Pick one answer",
  scale: "Choose where you land",
};

/**
 * Changing type preserves the question's text and replaces its options
 * appropriately for the new type (approved rule, handled server-side in
 * `changeQuestionType`): cleared for scale, given a fresh minimal
 * placeholder when coming from scale — visible right away in the
 * always-editable options field below, ready for A to customize.
 *
 * The type control is the only mechanism to switch (QA fix §8.2): there
 * is no separate "Change type" button — selecting a different type submits
 * immediately. Presentation only: this is now a 2-option pill/segmented
 * control (one radio per QUESTION_TYPES entry) instead of a <select>, same
 * submitOnChange-triggers-immediate-submit wiring as before.
 */
export function TypeChangeControl({
  questionId,
  currentType,
}: {
  questionId: string;
  currentType: QuestionType;
}) {
  const [state, formAction, pending] = useActionState(changeQuestionType, initialActionState);

  function submitOnChange(event: React.ChangeEvent<HTMLInputElement>) {
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <form action={formAction} className="create-field">
      <input type="hidden" name="questionId" value={questionId} />
      <span className="create-field__label">Question type</span>
      <div className="create-type-group" role="radiogroup" aria-label="Question type">
        {QUESTION_TYPES.map((t) => (
          <label key={t} className="create-type-option">
            <input
              type="radio"
              name="type"
              value={t}
              className="create-type-input"
              defaultChecked={currentType === t}
              onChange={submitOnChange}
              disabled={pending}
            />
            <span className="create-type-option__title">{QUESTION_TYPE_LABELS[t]}</span>
            <span className="create-type-option__sub">{TYPE_HINTS[t]}</span>
          </label>
        ))}
      </div>
      {pending && (
        <span className="create-save-status" aria-live="polite">
          Changing…
        </span>
      )}
      {state.error && (
        <p role="alert" className="create-form-error">
          {state.error}
        </p>
      )}
    </form>
  );
}
