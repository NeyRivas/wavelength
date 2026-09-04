"use client";

import { useActionState } from "react";

import { finalizeDraft } from "@/app/actions/draft";
import { initialActionState } from "@/app/actions/shared";

/**
 * The terminal step of A's draft flow: alias + "Create my Wavelength"
 * (finalize_draft, DRAFT -> WAITING). Only rendered by the page once every
 * question is answered and the planned count is reached — the RPC
 * re-validates both regardless, so this is a UX gate, not the real one.
 */
export function FinalizeForm({
  wavelengthId,
  shareToken,
}: {
  wavelengthId: string;
  shareToken: string;
}) {
  const [state, formAction, pending] = useActionState(finalizeDraft, initialActionState);

  return (
    <form action={formAction}>
      <h2>Ready to share</h2>
      <input type="hidden" name="wavelengthId" value={wavelengthId} />
      <input type="hidden" name="shareToken" value={shareToken} />

      <label htmlFor="finalize-alias">Your name</label>
      <input id="finalize-alias" type="text" name="alias" required maxLength={60} />

      {state.error && <p role="alert">{state.error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Creating…" : "Create my Wavelength"}
      </button>
      <p>Once created, your questions and answers are locked — you&apos;ll get a link to share.</p>
    </form>
  );
}
