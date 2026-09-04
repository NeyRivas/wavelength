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
 */
export function JoinForm({ token, aAlias }: { token: string; aAlias: string | null }) {
  const [state, formAction, pending] = useActionState(claimParticipantB, initialActionState);

  return (
    <form action={formAction}>
      <input type="hidden" name="token" value={token} />
      <p>{aAlias ?? "Someone"} invited you to find out if you&apos;re on the same wavelength.</p>

      <label htmlFor="join-alias">Your name</label>
      <input id="join-alias" type="text" name="alias" required maxLength={60} />

      {state.error && <p role="alert">{state.error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Joining…" : "Start answering"}
      </button>
    </form>
  );
}
