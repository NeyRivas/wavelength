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
 * TypeChangeControl's job. Editing text or any option here invalidates an
 * existing answer for this question — enforced by a DB trigger
 * (`questions_invalidate_answers_on_edit`), not duplicated here.
 *
 * QA fix: no "Save changes" button. Text/option fields save on blur (the
 * natural "I'm done editing this one" moment) — auto-submitting on every
 * keystroke would spam requests and fight the user mid-typing. Removing an
 * option has no blur to hook into, so it submits right away; that submit is
 * deferred to the next tick (setTimeout 0) so it fires after React has
 * actually applied the slot change to the DOM, otherwise a stale value
 * could still be read into the submitted FormData. Adding an option does
 * NOT auto-submit on click — the new field starts empty and is `required`,
 * so an immediate submit would always be silently blocked by the browser's
 * own HTML5 validation anyway (never reaching the server, occasionally
 * surfacing a confusing native validation popup right after clicking "Add
 * option"); the new field's own `onBlur` (same as every other option) is
 * what actually persists it once the user types something in.
 *
 * QA fix: each option has its own "Remove" button, targeting exactly that
 * option regardless of position (previously a single shared button always
 * dropped whichever option happened to be rendered last). Options are
 * tracked locally as slots with a stable, option-identity key — never the
 * array index — so removing slot N only ever unmounts that slot's own
 * input; every other slot's DOM node (and any live, not-yet-blurred edit
 * in it) is left completely untouched.
 *
 * QA fix: shows "Saved" once a submission completes without error — text
 * and options always mirror the last successfully-saved state (there's no
 * separate unsaved draft here, and no Save button), so that's a reliable
 * signal, the same "derive it from confirmed reality" approach already
 * used by AnswerControl's own "Saved" indicator.
 */

interface OptionSlot {
  key: string;
  initialValue: string;
}

let slotIdCounter = 0;
function newSlotKey(): string {
  slotIdCounter += 1;
  return `option-${slotIdCounter}`;
}

function initialSlots(options: string[] | null): OptionSlot[] {
  const values = options ?? [];
  const slots = values.map((initialValue) => ({ key: newSlotKey(), initialValue }));
  while (slots.length < MIN_CHOICE_OPTIONS) {
    slots.push({ key: newSlotKey(), initialValue: "" });
  }
  return slots;
}

export function QuestionEditForm({
  wavelengthId,
  question,
}: {
  wavelengthId: string;
  question: QuestionRow;
}) {
  const [state, formAction, pending] = useActionState(updateQuestion, initialActionState);
  const [slots, setSlots] = useState<OptionSlot[]>(() => initialSlots(question.options));

  function submitOnBlur(event: React.FocusEvent<HTMLInputElement>) {
    event.currentTarget.form?.requestSubmit();
  }

  function addOption() {
    // No auto-submit here — the new slot starts empty and `required`, so an
    // immediate submit would always be blocked by the browser's own
    // validation before it ever reaches the server. Its own `onBlur` (once
    // the user actually types something in) is what saves it.
    setSlots((prev) =>
      prev.length >= MAX_CHOICE_OPTIONS ? prev : [...prev, { key: newSlotKey(), initialValue: "" }],
    );
  }

  function removeOption(event: React.MouseEvent<HTMLButtonElement>, key: string) {
    const form = event.currentTarget.form;
    setSlots((prev) =>
      prev.length <= MIN_CHOICE_OPTIONS ? prev : prev.filter((slot) => slot.key !== key),
    );
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
          {slots.map((slot, i) => (
            <div key={slot.key}>
              <input
                type="text"
                name="options"
                defaultValue={slot.initialValue}
                placeholder={`Option ${i + 1}`}
                onBlur={submitOnBlur}
                required
              />
              <button
                type="button"
                onClick={(event) => removeOption(event, slot.key)}
                disabled={slots.length <= MIN_CHOICE_OPTIONS}
                aria-label={`Remove option ${i + 1}`}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={addOption} disabled={slots.length >= MAX_CHOICE_OPTIONS}>
            Add option
          </button>
        </fieldset>
      )}

      <p aria-live="polite">{pending ? "Saving…" : state.error ? "" : "Saved"}</p>

      {state.error && <p role="alert">{state.error}</p>}
    </form>
  );
}
