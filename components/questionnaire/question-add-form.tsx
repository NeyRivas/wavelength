"use client";

import { useActionState, useState } from "react";

import { addQuestion } from "@/app/actions/questions";
import { initialActionState } from "@/app/actions/shared";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  MAX_CHOICE_OPTIONS,
  MIN_CHOICE_OPTIONS,
  QUESTION_TYPE_LABELS,
  QUESTION_TYPES,
  type QuestionType,
} from "@/lib/wavelength/categories";

export function QuestionAddForm({ wavelengthId }: { wavelengthId: string }) {
  const [state, formAction, pending] = useActionState(addQuestion, initialActionState);
  const [type, setType] = useState<QuestionType>("choice");
  const [optionCount, setOptionCount] = useState(MIN_CHOICE_OPTIONS);

  return (
    <form action={formAction}>
      <h3>Add a question</h3>
      <input type="hidden" name="wavelengthId" value={wavelengthId} />

      <label htmlFor="add-question-category">Category</label>
      {/* All 6 fixed categories are always offered — there is no upfront
          category selection to cap this list against (progressive creation). */}
      <select id="add-question-category" name="category" defaultValue={CATEGORIES[0]}>
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {CATEGORY_LABELS[c]}
          </option>
        ))}
      </select>

      <label htmlFor="add-question-type">Type</label>
      <select
        id="add-question-type"
        name="type"
        value={type}
        onChange={(e) => setType(e.target.value as QuestionType)}
      >
        {QUESTION_TYPES.map((t) => (
          <option key={t} value={t}>
            {QUESTION_TYPE_LABELS[t]}
          </option>
        ))}
      </select>

      <label htmlFor="add-question-text">Question text</label>
      <input
        id="add-question-text"
        type="text"
        name="text"
        required
        minLength={3}
        maxLength={300}
      />

      {type === "scale" ? (
        <p>
          Answered on a fixed 5-level scale (Nada importante → Extremadamente importante) — no
          options to set up.
        </p>
      ) : (
        <fieldset>
          <legend>
            Options ({MIN_CHOICE_OPTIONS}–{MAX_CHOICE_OPTIONS})
          </legend>
          {Array.from({ length: optionCount }, (_, i) => (
            <input key={i} type="text" name="options" placeholder={`Option ${i + 1}`} required />
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
        {pending ? "Adding…" : "Add question"}
      </button>
    </form>
  );
}
