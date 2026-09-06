"use client";

import { useActionState } from "react";

import { createDraft } from "@/app/actions/draft";
import { initialActionState } from "@/app/actions/shared";
import { MAX_QUESTIONS, MIN_QUESTIONS } from "@/lib/wavelength/categories";

/**
 * The very first step of A's draft flow — and now the only "setup" step at
 * all. There is no upfront question count or category selection (progressive
 * creation, resolved decision): A just starts, and adds questions one at a
 * time from the builder that follows. Each question picks its own category
 * as it's created; the count is only checked (5-12) when A finalizes.
 */
export function DraftSetupForm() {
  const [state, formAction, pending] = useActionState(createDraft, initialActionState);

  return (
    <form action={formAction}>
      <p>
        Add anywhere from {MIN_QUESTIONS} to {MAX_QUESTIONS} questions, at your own pace — you
        don&apos;t need to decide how many up front.
      </p>

      {state.error && <p role="alert">{state.error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? "Starting…" : "Start building your Wavelength"}
      </button>
    </form>
  );
}
