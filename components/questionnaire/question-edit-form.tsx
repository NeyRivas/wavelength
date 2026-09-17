"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

import { updateQuestion } from "@/app/actions/questions";
import { initialActionState } from "@/app/actions/shared";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  MAX_CHOICE_OPTIONS,
  MIN_CHOICE_OPTIONS,
} from "@/lib/wavelength/categories";

import { answerInputId } from "./answer-control";
import { CATEGORY_TINTS } from "./category-visuals";
import type { QuestionRow } from "./types";

/**
 * Text, category, and options are always-editable inline fields (no
 * separate view/edit-mode toggle) — simpler than syncing local "am I
 * editing" state against the page re-rendering after every save. Category
 * editing before sharing is an intentional product requirement (bug-fix
 * pass) — it's freely editable here and locked, same as everything else,
 * once the wavelength is no longer DRAFT (`enforce_question_category_
 * immutable`, DB-enforced independently of this form). Type changes are
 * TypeChangeControl's job. Editing text or any option here invalidates an
 * existing answer for this question — enforced by a DB trigger
 * (`questions_invalidate_answers_on_edit`), not duplicated here; a category
 * change alone never does (the trigger only watches `text`/`options`).
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
 *
 * QA round 3 fix: explicitly calls `router.refresh()` once a save
 * succeeds. `updateQuestion`'s own `revalidatePath("/create")` should, per
 * Next's docs, bundle a fresh RSC payload into the same action response —
 * but real-browser QA showed AnswerControl (a sibling client-component
 * island, with its own independent `useActionState`, not this form's own
 * subtree) kept rendering the pre-edit `currentValue`/"Saved" after a
 * successful text/option edit. `router.refresh()` is Next's own documented
 * mechanism for exactly this — "re-fetching data requests, and re-rendering
 * Server Components... without losing unaffected client-side state" — not
 * a page reload: no navigation, no lost scroll position, no client state
 * wiped. This is what actually lets QuestionCard recompute AnswerControl's
 * invalidation `key` (see question-card.tsx) with the now-current
 * `question`/`currentValue` — the key alone cannot help if the props
 * feeding it never change.
 *
 * QA fix: the refresh (and the category field's own remount) now happen
 * after EVERY completed submission, not just successful ones. The
 * category selector is uncontrolled (each pill's `defaultChecked`) — if a
 * category change is ever rejected (e.g. the wavelength stopped being
 * DRAFT between render and submit), the browser still visually shows
 * whatever the user picked, since nothing tells it otherwise. Left alone,
 * that rejected value rides along on the FormData of the next, unrelated
 * edit (e.g. a text blur) — which resubmits the same bad category and gets
 * rejected again, silently blocking that edit too, since one `<form>` = one
 * bundled UPDATE. Keying the category group on `attempt` (incremented once
 * per completed submission) forces it to remount and re-read
 * `defaultChecked` from the just-refreshed, server-confirmed
 * `question.category` — reverting a rejected pick back to reality, or
 * confirming an accepted one — either way never leaving a stale value to
 * sabotage the next, separate edit.
 *
 * Presentation (Figma reference): the category `<select>` is now a row of
 * pill radios (one per CATEGORIES entry, tinted via CATEGORY_TINTS) and
 * each option row gets a small round remove button instead of a text
 * "Remove" button — same underlying <input type="radio"/"text"> elements,
 * same names, same submitOnChange/submitOnBlur wiring, so none of the
 * behavior documented above changed, only the markup/classes. Category
 * now renders above the question text (the reference's order) instead of
 * below it — a pure reorder of this form's own two field groups, nothing
 * about which form owns which field changed, so it's still one bundled
 * `updateQuestion` submission either way. Question Type stays a sibling
 * form rendered by QuestionCard (TypeChangeControl) rather than living
 * here, same as before — reordering fields *within* this form can't move
 * it between Category and Question without splitting category into its
 * own separate action call, which would be a real behavior change, not
 * just a reorder.
 *
 * `answerValue` picks which option row's indicator renders filled
 * (create-option-indicator) — mirroring whichever option is currently A's
 * saved answer, so "this is your answer" reads as part of the options
 * list itself. Undefined (unanswered) renders every indicator empty.
 *
 * Each option row is now a `<label htmlFor={answerInputId(...)}>`
 * targeting the *actual* radio AnswerControl renders for that same
 * option (a sibling form under the same QuestionCard) — not a second,
 * parallel answer-selection mechanism. A native label-for-a-foreign-
 * element click is real, standard HTML: clicking anywhere in the row
 * that isn't itself another interactive control (the text input, the
 * remove button — both already suppress label click-forwarding per the
 * HTML spec, so editing text or removing an option still works exactly
 * as before) fires a real click on AnswerControl's radio, which already
 * does everything selecting it should: update the shared
 * `optimisticAnswer` immediately (via its own `onSelect`) and persist
 * through the existing `saveAnswerA` action via its own form. This file
 * adds no new state, no new save path — only the `<label>` association.
 * Options are matched to AnswerControl's by index, so this stays correct
 * once a save round-trip confirms it; mid-edit (before a locally
 * added/removed option's own blur-save resolves) the row could
 * transiently point at the wrong index, the same pre-existing,
 * self-correcting caveat the decorative indicator already carried.
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
  answerValue,
}: {
  wavelengthId: string;
  question: QuestionRow;
  answerValue?: number;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateQuestion, initialActionState);
  const [slots, setSlots] = useState<OptionSlot[]>(() => initialSlots(question.options));
  // Bumped once per completed submission (success or failure) — see the
  // category pill group's key below for why the failure case matters too.
  const [attempt, setAttempt] = useState(0);

  // Fires exactly once per completed submission, on the pending -> !pending
  // transition (never on mount, where pending starts false) — see the QA
  // round 3 doc comment above for why this is needed on top of
  // updateQuestion's own revalidatePath. Now fires on failure too (not just
  // success) — see the doc comment above for why a rejected submission
  // still needs the category field to resync.
  const wasPending = useRef(false);
  useEffect(() => {
    if (wasPending.current && !pending) {
      router.refresh();
      setAttempt((n) => n + 1);
    }
    wasPending.current = pending;
  }, [pending, router]);

  function submitOnBlur(event: React.FocusEvent<HTMLInputElement>) {
    event.currentTarget.form?.requestSubmit();
  }

  function submitOnChange(event: React.ChangeEvent<HTMLInputElement>) {
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
    <form action={formAction} className="create-field-group">
      <input type="hidden" name="wavelengthId" value={wavelengthId} />
      <input type="hidden" name="questionId" value={question.id} />

      <div className="create-field" key={attempt}>
        <span className="create-field__label">Category</span>
        <div className="create-pill-group" role="radiogroup" aria-label="Category">
          {CATEGORIES.map((c) => (
            <label key={c} className="create-pill-option">
              <input
                type="radio"
                name="category"
                value={c}
                className="create-pill-input"
                defaultChecked={question.category === c}
                onChange={submitOnChange}
                disabled={pending}
              />
              <span className={`create-pill create-pill--${CATEGORY_TINTS[c]}`}>
                {CATEGORY_LABELS[c]}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="create-field">
        <label className="create-field__label" htmlFor={`text-${question.id}`}>
          Question
        </label>
        <input
          id={`text-${question.id}`}
          className="create-input"
          type="text"
          name="text"
          defaultValue={question.text}
          onBlur={submitOnBlur}
          required
          minLength={3}
          maxLength={300}
          disabled={pending}
        />
      </div>

      {question.type !== "scale" && (
        <fieldset className="create-field" disabled={pending}>
          <legend className="create-field__label">
            Answer options ({MIN_CHOICE_OPTIONS}–{MAX_CHOICE_OPTIONS})
          </legend>
          <div className="create-options">
            {slots.map((slot, i) => (
              <label
                className="create-option-row"
                htmlFor={answerInputId(question.id, i)}
                key={slot.key}
              >
                <span
                  className={`create-option-indicator${answerValue === i ? " create-option-indicator--selected" : ""}`}
                  aria-hidden="true"
                >
                  <span className="create-option-indicator__dot" />
                </span>
                <input
                  type="text"
                  name="options"
                  className="create-input"
                  defaultValue={slot.initialValue}
                  placeholder={`Option ${i + 1}`}
                  onBlur={submitOnBlur}
                  required
                />
                <button
                  type="button"
                  className="create-option-remove"
                  onClick={(event) => removeOption(event, slot.key)}
                  disabled={slots.length <= MIN_CHOICE_OPTIONS}
                  aria-label={`Remove option ${i + 1}`}
                >
                  ×
                </button>
              </label>
            ))}
          </div>
          <button
            type="button"
            className="create-add-option"
            onClick={addOption}
            disabled={slots.length >= MAX_CHOICE_OPTIONS}
          >
            + Add option
          </button>
        </fieldset>
      )}

      <p className="create-save-status" aria-live="polite">
        {pending ? "Saving…" : state.error ? "" : "Saved"}
      </p>

      {state.error && (
        <p role="alert" className="create-form-error">
          {state.error}
        </p>
      )}
    </form>
  );
}
