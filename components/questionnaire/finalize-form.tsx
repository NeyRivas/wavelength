"use client";

import { useActionState } from "react";

import { finalizeDraft } from "@/app/actions/draft";
import { initialActionState } from "@/app/actions/shared";

/**
 * The terminal step of A's draft flow: alias + "Create my Wavelength"
 * (finalize_draft, DRAFT -> WAITING). Only rendered by the page once every
 * question is answered and the planned count is reached — the RPC
 * re-validates both regardless, so this is a UX gate, not the real one.
 * `finalizeDraft` (unchanged) still redirects into the existing share
 * flow (`/w/[token]`) on success — this form still does nothing but call
 * it, just restyled to match the rest of the create flow.
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
    <form action={formAction} className="create-finalize">
      <h2 className="create-finalize__heading">Ready to share</h2>
      <p className="create-finalize__text">
        Once created, your questions and answers are locked — you&apos;ll get a link to share.
      </p>

      <input type="hidden" name="wavelengthId" value={wavelengthId} />
      <input type="hidden" name="shareToken" value={shareToken} />

      <div className="create-field">
        <label className="create-field__label" htmlFor="finalize-alias">
          Your name
        </label>
        <input
          id="finalize-alias"
          className="create-input"
          type="text"
          name="alias"
          required
          maxLength={60}
        />
      </div>

      {state.error && (
        <p role="alert" className="create-form-error">
          {state.error}
        </p>
      )}

      <button type="submit" className="create-button create-button--primary" disabled={pending}>
        {pending ? "Creating…" : "Create my Wavelength"}
      </button>
    </form>
  );
}
