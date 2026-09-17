"use client";

import { useActionState } from "react";

import { claimParticipantB } from "@/app/actions/join";
import { initialActionState } from "@/app/actions/shared";

/**
 * B's mandatory alias + claim. On submit, `claimParticipantB` attempts the
 * atomic claim server-side and redirects to the answering page on success;
 * a failure here (already claimed by someone else, invalid/expired token)
 * shows inline rather than a silent redirect, so a losing race is obvious
 * to the user instead of looking like nothing happened.
 *
 * Presentation only — same wiring as before (useActionState, hidden token
 * field, required alias input, pending/error handling). The invitation
 * context line now lives in InviteIntro alongside it, so this only asks
 * the one thing it needs to.
 */
export function JoinForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState(claimParticipantB, initialActionState);

  return (
    <section className="invite-card">
      <form action={formAction}>
        <input type="hidden" name="token" value={token} />

        <div className="create-field">
          <label htmlFor="join-alias" className="invite-card__label">
            What&apos;s your name?
          </label>
          <input
            id="join-alias"
            className="create-input"
            type="text"
            name="alias"
            placeholder="Your name"
            required
            maxLength={60}
          />
        </div>

        {state.error && (
          <p className="create-form-error" role="alert">
            {state.error}
          </p>
        )}

        <button type="submit" className="invite-button" disabled={pending}>
          {pending ? "Joining…" : "Start answering"}
        </button>
      </form>
    </section>
  );
}
