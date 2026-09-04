"use client";

import { useActionState } from "react";

import type { ActionState } from "@/app/actions/shared";
import { initialActionState } from "@/app/actions/shared";
import { SCALE_LABELS } from "@/lib/wavelength/categories";

import type { QuestionRow } from "./types";

type SaveAnswerAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Choice/situation: radio per option, value = its 0-based index (matches
 * the DB's stored answer shape). Scale: radio per fixed 1-5 label. Both A
 * (before finalization) and B (before final submission) can change a saved
 * answer at any time — this is a plain upsert either way, so the same
 * component works for both; `action` picks which participant it writes as
 * (`saveAnswerA` or `saveAnswerB` — see app/actions/answers.ts, where
 * `participant` is hardcoded server-side per action, never client-supplied).
 */
export function AnswerControl({
  action,
  wavelengthId,
  question,
  currentValue,
}: {
  action: SaveAnswerAction;
  wavelengthId: string;
  question: QuestionRow;
  currentValue: number | undefined;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

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
