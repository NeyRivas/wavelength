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
 * The pill itself updates the instant it's clicked regardless (native
 * `:checked` + a sibling CSS selector, not tied to any render cycle) —
 * `onSelect` exists only so *other* parts of the same question card
 * (QuestionCard's "Ready" banner, QuestionEditForm's decorative per-option
 * indicator) can mirror that same click immediately too, instead of
 * waiting for the server round trip this form's own submit still kicks
 * off unchanged.
 *
 * Presentation (Figma reference): each option/level is a tappable pill —
 * a visually-hidden radio plus a styled <span>, filled solid when checked —
 * instead of a plain radio+text-label row. Same inputs, same names/values,
 * same submitOnChange-triggers-immediate-submit behavior. Scale labels are
 * the existing SCALE_LABELS text (unchanged) — this reskins their
 * presentation, not their wording.
 */
export function AnswerControl({
  action,
  wavelengthId,
  question,
  currentValue,
  onSelect,
}: {
  action: SaveAnswerAction;
  wavelengthId: string;
  question: QuestionRow;
  currentValue: number | undefined;
  /** Optional: called with the clicked value the instant a pill is
   * selected, before the save request is even sent — purely so a parent
   * can mirror the selection elsewhere in the same card right away. Never
   * a substitute for the real save; `formAction`/`action` below is still
   * what actually persists the answer. */
  onSelect?: (value: number) => void;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);

  function submitOnChange(event: React.ChangeEvent<HTMLInputElement>) {
    onSelect?.(Number(event.currentTarget.value));
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <form action={formAction} className="create-answer">
      <input type="hidden" name="wavelengthId" value={wavelengthId} />
      <input type="hidden" name="questionId" value={question.id} />

      <fieldset className="create-answer__fieldset" disabled={pending}>
        <legend className="create-field__label">Your answer</legend>
        <div className="create-answer-options">
          {question.type === "scale"
            ? SCALE_VALUES.map((v) => (
                <label key={v} className="create-answer-pill-option">
                  <input
                    type="radio"
                    name="value"
                    value={v}
                    className="create-answer-pill-input"
                    defaultChecked={currentValue === v}
                    onChange={submitOnChange}
                    required
                  />
                  <span className="create-answer-pill">{SCALE_LABELS[v]}</span>
                </label>
              ))
            : question.options?.map((option, index) => (
                <label key={option} className="create-answer-pill-option">
                  <input
                    type="radio"
                    name="value"
                    value={index}
                    className="create-answer-pill-input"
                    defaultChecked={currentValue === index}
                    onChange={submitOnChange}
                    required
                  />
                  <span className="create-answer-pill">{option}</span>
                </label>
              ))}
        </div>
      </fieldset>

      <p className="create-save-status" aria-live="polite">
        {pending ? "Saving…" : currentValue !== undefined ? "Saved" : ""}
      </p>

      {state.error && (
        <p role="alert" className="create-form-error">
          {state.error}
        </p>
      )}
    </form>
  );
}
