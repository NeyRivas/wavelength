"use client";

import { useRouter } from "next/navigation";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/**
 * The one "start a new, independent Wavelength" action still using the
 * generic ConfirmDialog — now only rendered by B's locked "Nice try!"
 * page (app/w/[token]/answer/page.tsx). The Result page has its own
 * bespoke equivalent (components/result/create-new-wavelength-cta.tsx)
 * with a Wavelength-branded confirmation instead of this plain one; this
 * component is unchanged and unrelated to that pass, kept exactly as it
 * was for the one surface that still needs it.
 *
 * "Continue" is a plain client-side navigation into the existing /create
 * flow (app/create/page.tsx) — the same one A always used. It takes no id
 * or reference to the wavelength being left: createDraft (app/actions/
 * draft.ts) only ever inserts a brand-new row scoped to the caller's own
 * id, so there is nothing here that could reopen, modify, or delete it.
 */
export function CreateNewWavelengthAction() {
  const router = useRouter();

  return (
    <ConfirmDialog
      triggerLabel="Create your own Wavelength"
      title="Start a new Wavelength?"
      description="Make sure you've saved or shared your current result first. You may lose access to this completed result when you start a new Wavelength."
      onConfirm={() => router.push("/create")}
    />
  );
}
