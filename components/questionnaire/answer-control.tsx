"use client";

import { useActionState } from "react";

import { saveAnswerA } from "@/app/actions/answers";
import { initialActionState } from "@/app/actions/shared";
import { SCALE_LABELS } from "@/lib/wavelength/categories";

import type { QuestionRow } from "./types";

/** Choice/situation: radio per option, value = its 0-based index (matches
 * the DB's stored answer shape). Scale: radio per fixed 1-5 label. A can
 * change a saved answer any time before finalization (approved rule) — this
 * is a plain upsert either way. */
export function AnswerControl({
  wavelengthId,
  question,
  currentValue,
}: {
  wavelengthId: string;
  question: QuestionRow;
  currentValue: number | undefined;
}) {
  const [state, formAction, pending] = useActionState(saveAnswerA, initialActionState);

  return (
    <form action={formAction}>
      <input type="hidden" name="wavelengthId" value={wavelengthId} />
      <input type="hidden" name="questionId" value={question.id} />

      <fieldset>
        <legend>Your answer</legend>
        {question.type === "scale"
          ? ([1, 2, 3, 4, 5] as const).map((n) => (
              <label key={n}>
                <input
                  type="radio"
                  name="value"
                  value={n}
                  defaultChecked={currentValue === n}
                  required
                />
                {SCALE_LABELS[n]}
              </label>
            ))
          : question.options?.map((option, index) => (
              <label key={option}>
                <input
                  type="radio"
                  name="value"
                  value={index}
                  defaultChecked={currentValue === index}
                  required
                />
                {option}
              </label>
            ))}
      </fieldset>

      {state.error && <p role="alert">{state.error}</p>}

      <button type="submit" disabled={pending}>
        {currentValue === undefined ? "Save answer" : "Update answer"}
      </button>
    </form>
  );
}
