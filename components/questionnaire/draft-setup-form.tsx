"use client";

import { useActionState, useState } from "react";

import { createDraft } from "@/app/actions/draft";
import { initialActionState } from "@/app/actions/shared";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  DEFAULT_QUESTION_COUNT,
  MAX_QUESTIONS,
  MIN_QUESTIONS,
  maxSelectableCategories,
  type Category,
} from "@/lib/wavelength/categories";

/**
 * Step 1 of the draft flow: question count + categories, collected
 * together because the database requires both atomically (categories.length
 * <= question_count is a table CHECK constraint — see ARCHITECTURE.md §13.A).
 * The category cap is enforced live here (disabling further checkboxes) so
 * A never has to hit the server round trip to discover it.
 */
export function DraftSetupForm() {
  const [state, formAction, pending] = useActionState(createDraft, initialActionState);
  const [questionCount, setQuestionCount] = useState(DEFAULT_QUESTION_COUNT);
  const [selected, setSelected] = useState<Category[]>([]);

  const maxCategories = maxSelectableCategories(questionCount);

  function handleQuestionCountChange(next: number) {
    setQuestionCount(next);
    // Lowering the count can leave more categories selected than the new
    // cap allows — trim rather than silently submit an invalid combination.
    setSelected((prev) => prev.slice(0, maxSelectableCategories(next)));
  }

  function toggleCategory(category: Category) {
    setSelected((prev) => {
      if (prev.includes(category)) return prev.filter((c) => c !== category);
      if (prev.length >= maxCategories) return prev;
      return [...prev, category];
    });
  }

  return (
    <form action={formAction}>
      <label htmlFor="questionCount">
        How many questions? ({MIN_QUESTIONS}–{MAX_QUESTIONS})
      </label>
      <input
        id="questionCount"
        type="number"
        name="questionCount"
        min={MIN_QUESTIONS}
        max={MAX_QUESTIONS}
        value={questionCount}
        onChange={(e) => handleQuestionCountChange(Number(e.target.value))}
      />

      <fieldset>
        <legend>
          Categories — up to {maxCategories} for {questionCount} questions
        </legend>
        {CATEGORIES.map((category) => {
          const checked = selected.includes(category);
          const disabled = !checked && selected.length >= maxCategories;
          return (
            <label key={category}>
              <input
                type="checkbox"
                name="categories"
                value={category}
                checked={checked}
                disabled={disabled}
                onChange={() => toggleCategory(category)}
              />
              {CATEGORY_LABELS[category]}
            </label>
          );
        })}
      </fieldset>

      {state.error && <p role="alert">{state.error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Starting…" : "Start building"}
      </button>
    </form>
  );
}
