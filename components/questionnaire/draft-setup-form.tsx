"use client";

import { useActionState } from "react";

import { createDraft } from "@/app/actions/draft";
import { initialActionState } from "@/app/actions/shared";

/**
 * The very first step of A's draft flow — and the only "setup" step at
 * all. There is no upfront question count or category selection
 * (progressive creation, resolved decision): A just starts, and adds
 * questions one at a time from the builder that follows. Each question
 * picks its own category as it's created; the count is only checked
 * (5-12) when A finalizes.
 *
 * Presentation only (Figma reference, Stage 1): a centered prompt with a
 * small two-circle motif — the same "two people" language used elsewhere
 * on the site (e.g. the hero's ringed dots) — a short heading/description,
 * and one primary CTA. `createDraft` (unchanged) is still the only thing
 * this form does; clicking the CTA creates the DRAFT row, and the page
 * re-renders into the QuestionnaireBuilder stage on its own.
 */
export function DraftSetupForm() {
  const [state, formAction, pending] = useActionState(createDraft, initialActionState);

  return (
    <form action={formAction} className="create-intro">
      <div className="create-intro__motif" aria-hidden="true">
        <span className="create-intro__circle create-intro__circle--lavender" />
        <span className="create-intro__circle create-intro__circle--blue" />
      </div>

      <h2 className="create-intro__heading">Start with your first question</h2>
      <p className="create-intro__text">
        Pick something you&apos;d genuinely want to know about each other.
      </p>

      {state.error && (
        <p role="alert" className="create-form-error">
          {state.error}
        </p>
      )}

      <button type="submit" className="create-button create-button--primary" disabled={pending}>
        {pending ? "Starting…" : "+ Add your first question"}
      </button>
    </form>
  );
}
