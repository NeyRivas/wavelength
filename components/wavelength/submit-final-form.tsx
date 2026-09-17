"use client";

import { useActionState } from "react";

import { submitFinalB } from "@/app/actions/join";
import { initialActionState } from "@/app/actions/shared";

/**
 * B's final CTA — only rendered by the answer page once every question has
 * been answered (a UX gate; `submit_final_b` re-validates completeness
 * itself regardless). On success this redirects straight to the result
 * page, which shows the "Finding your wavelength…" transition itself.
 *
 * Presentation only — same wiring as before (useActionState(submitFinalB),
 * the same two hidden fields, the same pending/error handling). Reuses
 * the mint-tinted "you're at the finish line" card language from
 * .create-finalize (A's own "Ready to share" moment), with a soft-primary
 * lavender CTA (.answer-submit-button — the same recipe as the approved
 * Copy link/Start answering buttons) instead of a flat ink/white button.
 */
export function SubmitFinalForm({
  wavelengthId,
  shareToken,
}: {
  wavelengthId: string;
  shareToken: string;
}) {
  const [state, formAction, pending] = useActionState(submitFinalB, initialActionState);

  return (
    <form action={formAction} className="create-finalize">
      <h2 className="create-finalize__heading">All set!</h2>
      <p className="create-finalize__text">
        Every question is answered. Submit to see where your wavelengths meet.
      </p>

      <input type="hidden" name="wavelengthId" value={wavelengthId} />
      <input type="hidden" name="shareToken" value={shareToken} />

      {state.error && (
        <p role="alert" className="create-form-error">
          {state.error}
        </p>
      )}

      <button type="submit" className="answer-submit-button" disabled={pending}>
        {pending ? "Submitting…" : "See our results"}
      </button>
    </form>
  );
}
