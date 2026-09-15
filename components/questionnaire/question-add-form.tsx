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
  SCALE_LABELS,
  SCALE_VALUES,
  type QuestionType,
} from "@/lib/wavelength/categories";

import { CATEGORY_TINTS, tintForIndex } from "./category-visuals";

const TYPE_HINTS: Record<QuestionType, string> = {
  choice: "Pick one answer",
  scale: "Choose where you land",
};

const TEXT_PLACEHOLDER = "e.g. What does your ideal weekend look like?";

/**
 * Adds a question to A's draft. `addQuestion` (unchanged) still requires a
 * valid category/type/text/options up front — this form still collects
 * all of that before submitting, exactly as before; nothing about
 * `addQuestion`'s contract or validation changed.
 *
 * Presentation (Figma reference): styled as the next numbered card in the
 * list (index/tint come from `nextIndex`, the same 5-tint cycle every
 * other card badge uses, and the same head/body split QuestionCard uses)
 * — the reference draws a not-yet-submitted question exactly like an
 * already-saved one, just with everything still unset. A live "Your
 * answer" preview mirrors the same pill language AnswerControl uses on an
 * already-saved question, so filling this form in already feels like
 * "answering," not just administering a form, per the brief. That
 * preview answers nothing for real — there's no question row to attach a
 * real answer to until this form is actually submitted.
 *
 * Nothing here is preselected (bug fix): category and type both start
 * with no radio checked — neither `defaultChecked` on any category pill
 * nor an initial `type` value that would visually check one of the two
 * type options. Both groups carry `required`, so the browser's own HTML5
 * validation blocks a submit before either is chosen (the same mechanism
 * already used for text length and option count) — `addQuestion`'s own
 * server-side validation is the real backstop either way, unchanged.
 * `options` is tracked as real text (not just a count) purely so the
 * preview can reflect what's actually been typed; the submitted FormData
 * is unaffected — still one `options` field per non-empty row, read by
 * `addQuestion` exactly as before.
 */
export function QuestionAddForm({
  wavelengthId,
  nextIndex,
}: {
  wavelengthId: string;
  nextIndex: number;
}) {
  const [state, formAction, pending] = useActionState(addQuestion, initialActionState);
  const [type, setType] = useState<QuestionType | null>(null);
  const [options, setOptions] = useState<string[]>(["", ""]);

  const tint = tintForIndex(nextIndex);
  const validOptions = options.map((o) => o.trim()).filter(Boolean);

  function updateOption(index: number, value: string) {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  }

  function addOption() {
    setOptions((prev) => (prev.length >= MAX_CHOICE_OPTIONS ? prev : [...prev, ""]));
  }

  function removeOption(index: number) {
    setOptions((prev) =>
      prev.length <= MIN_CHOICE_OPTIONS ? prev : prev.filter((_, i) => i !== index),
    );
  }

  return (
    <article className="create-card">
      <header className={`create-card__head create-card__head--${tint}`}>
        <div className="create-card__badge">
          <span className={`create-card__number create-card__number--${tint}`}>
            {nextIndex + 1}
          </span>
          <span className="create-card__title">Question {nextIndex + 1}</span>
        </div>
      </header>

      <div className="create-card__body">
        <form action={formAction} className="create-field-group">
          <input type="hidden" name="wavelengthId" value={wavelengthId} />

          <div className="create-field">
            <span className="create-field__label">Category</span>
            <div className="create-pill-group" role="radiogroup" aria-label="Category">
              {CATEGORIES.map((c) => (
                <label key={c} className="create-pill-option">
                  <input
                    type="radio"
                    name="category"
                    value={c}
                    className="create-pill-input"
                    required
                  />
                  <span className={`create-pill create-pill--${CATEGORY_TINTS[c]}`}>
                    {CATEGORY_LABELS[c]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="create-field">
            <span className="create-field__label">Question type</span>
            <div className="create-type-group" role="radiogroup" aria-label="Question type">
              {QUESTION_TYPES.map((t) => (
                <label key={t} className="create-type-option">
                  <input
                    type="radio"
                    name="type"
                    value={t}
                    className="create-type-input"
                    checked={type === t}
                    onChange={() => setType(t)}
                    required
                  />
                  <span className="create-type-option__title">{QUESTION_TYPE_LABELS[t]}</span>
                  <span className="create-type-option__sub">{TYPE_HINTS[t]}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="create-field">
            <label className="create-field__label" htmlFor="add-question-text">
              Question
            </label>
            <input
              id="add-question-text"
              className="create-input"
              type="text"
              name="text"
              placeholder={TEXT_PLACEHOLDER}
              required
              minLength={3}
              maxLength={300}
            />
          </div>

          {type === "choice" && (
            <fieldset className="create-field">
              <legend className="create-field__label">
                Answer options ({MIN_CHOICE_OPTIONS}–{MAX_CHOICE_OPTIONS})
              </legend>
              <div className="create-options">
                {options.map((value, i) => (
                  <div className="create-option-row" key={i}>
                    <span className="create-option-indicator" aria-hidden="true">
                      <span className="create-option-indicator__dot" />
                    </span>
                    <input
                      type="text"
                      name="options"
                      className="create-input"
                      value={value}
                      onChange={(e) => updateOption(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      required
                    />
                    <button
                      type="button"
                      className="create-option-remove"
                      onClick={() => removeOption(i)}
                      disabled={options.length <= MIN_CHOICE_OPTIONS}
                      aria-label={`Remove option ${i + 1}`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="create-add-option"
                onClick={addOption}
                disabled={options.length >= MAX_CHOICE_OPTIONS}
              >
                + Add option
              </button>
            </fieldset>
          )}

          <div className="create-answer">
            <span className="create-field__label">Your answer</span>
            {type === null ? (
              <p className="create-answer__hint">Choose a question type first.</p>
            ) : type === "scale" ? (
              <>
                <p className="create-answer__hint">Answer once this question is added.</p>
                <div className="create-answer-options" aria-hidden="true">
                  {SCALE_VALUES.map((v) => (
                    <span key={v} className="create-answer-pill create-answer-pill--preview">
                      {SCALE_LABELS[v]}
                    </span>
                  ))}
                </div>
              </>
            ) : validOptions.length < MIN_CHOICE_OPTIONS ? (
              <p className="create-answer__hint">Add your options above first.</p>
            ) : (
              <>
                <p className="create-answer__hint">
                  You&apos;ll pick your answer once this question is added.
                </p>
                <div className="create-answer-options" aria-hidden="true">
                  {validOptions.map((option) => (
                    <span key={option} className="create-answer-pill create-answer-pill--preview">
                      {option}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {state.error && (
            <p role="alert" className="create-form-error">
              {state.error}
            </p>
          )}

          <button type="submit" className="create-button create-button--primary" disabled={pending}>
            {pending ? "Adding…" : "+ Add question"}
          </button>
        </form>
      </div>
    </article>
  );
}
