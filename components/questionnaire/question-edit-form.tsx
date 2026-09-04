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
        required
        minLength={3}
        maxLength={300}
      />

      {question.type !== "scale" && (
        <fieldset>
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
              required
            />
          ))}
          <button
            type="button"
            onClick={() => setOptionCount((n) => Math.min(MAX_CHOICE_OPTIONS, n + 1))}
            disabled={optionCount >= MAX_CHOICE_OPTIONS}
          >
            Add option
          </button>
          <button
            type="button"
            onClick={() => setOptionCount((n) => Math.max(MIN_CHOICE_OPTIONS, n - 1))}
            disabled={optionCount <= MIN_CHOICE_OPTIONS}
          >
            Remove option
          </button>
        </fieldset>
      )}

      {state.error && <p role="alert">{state.error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
