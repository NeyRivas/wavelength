"use client";

import { useActionState } from "react";

import type { ActionState } from "@/app/actions/shared";
import { initialActionState } from "@/app/actions/shared";
import { SCALE_LABELS, SCALE_VALUES } from "@/lib/wavelength/categories";

import type { QuestionRow } from "./types";

type SaveAnswerAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Choice: radio per option, value = its 0-based index (matches the DB's
 * stored answer shape). Scale: radio per fixed 0/25/50/75/100 level. Both A
 * (before finalization) and B (before final submission) can change a saved
 * answer at any time — this is a plain upsert either way, so the same
 * component works for both; `action` picks which participant it writes as
 * (`saveAnswerA` or `saveAnswerB` — see app/actions/answers.ts, where
 * `participant` is hardcoded server-side per action, never client-supplied).
 *
 * There is no separate "Save"/"Update" button (QA fix §8.1): selecting a
 * radio immediately submits the form. Whatever was selected last is the
 * current answer — the visual selection and the persisted value never fall
 * out of sync, since there's no intermediate unsaved state to desync from.
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

  function submitOnChange(event: React.ChangeEvent<HTMLInputElement>) {
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="wavelengthId" value={wavelengthId} />
      <input type="hidden" name="questionId" value={question.id} />

      <fieldset disabled={pending}>
        <legend>Your answer</legend>
        {question.type === "scale"
          ? SCALE_VALUES.map((v) => (
              <label key={v}>
                <input
                  type="radio"
                  name="value"
                  value={v}
                  defaultChecked={currentValue === v}
                  onChange={submitOnChange}
                  required
                />
                {SCALE_LABELS[v]}
              </label>
            ))
          : question.options?.map((option, index) => (
              <label key={option}>
                <input
                  type="radio"
                  name="value"
                  value={index}
                  defaultChecked={currentValue === index}
                  onChange={submitOnChange}
                  required
                />
                {option}
              </label>
            ))}
      </fieldset>

      <p aria-live="polite">{pending ? "Saving…" : currentValue !== undefined ? "Saved" : ""}</p>

      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
