"use client";

import { useActionState } from "react";

import { submitFinalB } from "@/app/actions/join";
import { initialActionState } from "@/app/actions/shared";

/**
 * B's final CTA — only rendered by the answer page once every question has
 * been answered (a UX gate; `submit_final_b` re-validates completeness
 * itself regardless). On success this redirects straight to the result
 * page, which shows the "Finding your wavelength…" transition itself.
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
    <form action={formAction}>
      <input type="hidden" name="wavelengthId" value={wavelengthId} />
      <input type="hidden" name="shareToken" value={shareToken} />

      {state.error && <p role="alert">{state.error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Submitting…" : "See our results"}
      </button>
    </form>
  );
}
