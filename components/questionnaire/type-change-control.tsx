"use client";

import { useActionState } from "react";

import { changeQuestionType } from "@/app/actions/questions";
import { initialActionState } from "@/app/actions/shared";
import {
  QUESTION_TYPE_LABELS,
  QUESTION_TYPES,
  type QuestionType,
} from "@/lib/wavelength/categories";

/**
 * Changing type preserves the question's text and replaces its options
 * appropriately for the new type (approved rule, handled server-side in
 * `changeQuestionType`): cleared for scale, given a fresh minimal
 * placeholder when coming from scale — visible right away in the
 * always-editable options field below, ready for A to customize.
 *
 * The type `<select>` is the only mechanism to switch (QA fix §8.2): there
 * is no separate "Change type" button — selecting a different type submits
 * immediately.
 */
export function TypeChangeControl({
  questionId,
  currentType,
}: {
  questionId: string;
  currentType: QuestionType;
}) {
  const [state, formAction, pending] = useActionState(changeQuestionType, initialActionState);

  function submitOnChange(event: React.ChangeEvent<HTMLSelectElement>) {
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="questionId" value={questionId} />
      <label>
        Type
        <select name="type" defaultValue={currentType} onChange={submitOnChange} disabled={pending}>
          {QUESTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {QUESTION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>
      {pending && <span aria-live="polite">Changing…</span>}
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
