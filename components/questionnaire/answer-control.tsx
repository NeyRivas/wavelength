"use client";

import { m } from "motion/react";
import { useActionState, useState } from "react";

import type { ActionState } from "@/app/actions/shared";
import { MotionRoot } from "@/components/overprint/motion-root";
import { initialActionState } from "@/app/actions/shared";
import { SCALE_LABELS, SCALE_VALUES } from "@/lib/wavelength/categories";

import type { CategoryTint } from "./category-visuals";
import type { QuestionRow } from "./types";

type SaveAnswerAction = (prevState: ActionState, formData: FormData) => Promise<ActionState>;

/** Stable id for a given question+value's radio, shared with
 * question-edit-form.tsx so its decorative per-option indicator can
 * target the exact same input via a native `<label htmlFor>` — see the
 * doc comment below for why that's the whole trick. */
export function answerInputId(questionId: string, value: number): string {
  return `answer-${questionId}-${value}`;
}

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
 *
 * Each radio gets a stable `id` (`answerInputId`) purely so
 * QuestionEditForm's decorative per-option indicator/row (a *different*
 * form, rendered by the same QuestionCard) can point a plain
 * `<label htmlFor>` at the exact same input instead of growing a second,
 * parallel selection mechanism — see that file's own doc comment.
 */
// The selected option's fill is one shared element (layoutId) that
// travels from the previous answer to the new one, so changing your mind
// visibly moves your answer rather than swapping two colours.
function Pill({
  questionId,
  selected,
  children,
}: {
  questionId: string;
  selected: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      <m.span className="create-answer-pill" whileTap={{ scale: 0.97 }}>
        {children}
      </m.span>
      {/* After the pill, so the existing `input:checked + .create-answer-pill`
          and focus-ring selectors still match; CSS layers it underneath. */}
      {selected && (
        <m.span
          layoutId={`answer-ink-${questionId}`}
          className="op-answer-ink"
          aria-hidden="true"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
    </>
  );
}

export function AnswerControl({
  action,
  wavelengthId,
  question,
  currentValue,
  onSelect,
  tint,
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
  /** Optional cosmetic hook: adds a `create-answer--{tint}` class
   * alongside the base `create-answer` class so a caller can recolor the
   * selected-pill state via CSS alone, without touching this component's
   * markup or save logic. QuestionCard (A's /create builder) never passes
   * this, so its existing ink-filled selected state is completely
   * unaffected; B's answering screen (app/w/[token]/answer) passes each
   * question's own badge tint so the selected pill picks up that same
   * color instead. */
  tint?: CategoryTint;
}) {
  const [state, formAction, pending] = useActionState(action, initialActionState);
  // Only drives the sliding highlight below; the radios themselves stay
  // uncontrolled and the saved value still comes from the form submit.
  const [selected, setSelected] = useState(currentValue);
  // Follow the saved value when the server sends a new one.
  const [savedValue, setSavedValue] = useState(currentValue);
  if (currentValue !== savedValue) {
    setSavedValue(currentValue);
    setSelected(currentValue);
  }

  function submitOnChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = Number(event.currentTarget.value);
    setSelected(value);
    onSelect?.(value);
    event.currentTarget.form?.requestSubmit();
  }

  return (
    <MotionRoot>
      <form
        action={formAction}
        // React resets this form after each submit, back to the last saved
        // answer (the new one once the page has revalidated, the old one if
        // the save failed); keep the highlight on whatever is checked.
        onReset={() => setSelected(currentValue)}
        className={`create-answer op-answer${tint ? ` create-answer--${tint}` : ""}`}
      >
        <input type="hidden" name="wavelengthId" value={wavelengthId} />
        <input type="hidden" name="questionId" value={question.id} />

        <fieldset className="create-answer__fieldset" disabled={pending}>
          <legend className="create-field__label">Your answer</legend>
          <div className="create-answer-options">
            {question.type === "scale"
              ? SCALE_VALUES.map((v) => (
                  <label key={v} className="create-answer-pill-option">
                    <input
                      id={answerInputId(question.id, v)}
                      type="radio"
                      name="value"
                      value={v}
                      className="create-answer-pill-input"
                      defaultChecked={currentValue === v}
                      onChange={submitOnChange}
                      required
                    />
                    <Pill questionId={question.id} selected={selected === v}>
                      {SCALE_LABELS[v]}
                    </Pill>
                  </label>
                ))
              : // Keyed by index, not option text: a brand-new ready-made
                // question (e.g. "How Well Do You Know Me?") can briefly have
                // two identical empty-string options before A has typed
                // anything in — a text-based key would collide there.
                question.options?.map((option, index) => (
                  <label key={index} className="create-answer-pill-option">
                    <input
                      id={answerInputId(question.id, index)}
                      type="radio"
                      name="value"
                      value={index}
                      className="create-answer-pill-input"
                      defaultChecked={currentValue === index}
                      onChange={submitOnChange}
                      required
                    />
                    <Pill questionId={question.id} selected={selected === index}>
                      {option}
                    </Pill>
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
    </MotionRoot>
  );
}
