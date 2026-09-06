"use client";

import { useActionState, useState } from "react";

import { updateQuestion } from "@/app/actions/questions";
import { initialActionState } from "@/app/actions/shared";
import { MAX_CHOICE_OPTIONS, MIN_CHOICE_OPTIONS } from "@/lib/wavelength/categories";

import type { QuestionRow } from "./types";

/**
 * Text and options are always-editable inline fields (no separate
 * view/edit-mode toggle) — simpler than syncing local "am I editing" state
 * against the page re-rendering after every save. Category is never
 * editable here (immutable after creation, DB-enforced); type changes are
 * TypeChangeControl's job.
 *
 * QA fix: no "Save changes" button. Text/option fields save on blur (the
 * natural "I'm done editing this one" moment) — auto-submitting on every
 * keystroke would spam requests and fight the user mid-typing. Removing an
 * option has no blur to hook into, so it submits right away; the submit is
 * deferred to the next tick (setTimeout 0) so it fires after React has
 * actually removed that option's input from the DOM, otherwise the
 * about-to-be-removed value would still be read into the submitted
 * FormData.
 */
export function QuestionEditForm({
  wavelengthId,
  question,
}: {
  wavelengthId: string;
  question: QuestionRow;
}) {
  const [state, formAction, pending] = useActionState(updateQuestion, initialActionState);
  const [optionCount, setOptionCount] = useState(
    Math.max(question.options?.length ?? MIN_CHOICE_OPTIONS, MIN_CHOICE_OPTIONS),
  );

  function submitOnBlur(event: React.FocusEvent<HTMLInputElement>) {
    event.currentTarget.form?.requestSubmit();
  }

  function addOption() {
    setOptionCount((n) => Math.min(MAX_CHOICE_OPTIONS, n + 1));
  }

  function removeOption(event: React.MouseEvent<HTMLButtonElement>) {
    const form = event.currentTarget.form;
    setOptionCount((n) => Math.max(MIN_CHOICE_OPTIONS, n - 1));
    setTimeout(() => form?.requestSubmit(), 0);
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="wavelengthId" value={wavelengthId} />
      <input type="hidden" name="questionId" value={question.id} />

      <label htmlFor={`text-${question.id}`}>Question text</label>
      <input
        id={`text-${question.id}`}
        type="text"
        name="text"
        defaultValue={question.text}
        onBlur={submitOnBlur}
        required
        minLength={3}
        maxLength={300}
        disabled={pending}
      />

      {question.type !== "scale" && (
        <fieldset disabled={pending}>
          <legend>
            Options ({MIN_CHOICE_OPTIONS}–{MAX_CHOICE_OPTIONS})
          </legend>
          {Array.from({ length: optionCount }, (_, i) => (
            <input
              key={i}
              type="text"
              name="options"
              defaultValue={question.options?.[i] ?? ""}
              placeholder={`Option ${i + 1}`}
              onBlur={submitOnBlur}
              required
            />
          ))}
          <button type="button" onClick={addOption} disabled={optionCount >= MAX_CHOICE_OPTIONS}>
            Add option
          </button>
          <button type="button" onClick={removeOption} disabled={optionCount <= MIN_CHOICE_OPTIONS}>
            Remove option
          </button>
        </fieldset>
      )}

      <p aria-live="polite">{pending ? "Saving…" : ""}</p>

      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
