"use client";

import { useActionState, useState } from "react";

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
 * `changeQuestionType`): cleared for scale, kept as-is between
 * choice/situation, and given a fresh minimal placeholder when coming from
 * scale — visible right away in the always-editable options field below,
 * ready for A to customize.
 */
export function TypeChangeControl({
  questionId,
  currentType,
}: {
  questionId: string;
  currentType: QuestionType;
}) {
  const [state, formAction, pending] = useActionState(changeQuestionType, initialActionState);
  const [selected, setSelected] = useState<QuestionType>(currentType);

  return (
    <form action={formAction}>
      <input type="hidden" name="questionId" value={questionId} />
      <label>
        Type
        <select
          name="type"
          value={selected}
          onChange={(e) => setSelected(e.target.value as QuestionType)}
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {QUESTION_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={pending || selected === currentType}>
        {pending ? "Changing…" : "Change type"}
      </button>
      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
