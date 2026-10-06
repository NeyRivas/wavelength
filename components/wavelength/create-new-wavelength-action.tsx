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
 * "Continue" is a plain client-side navigation. It takes no id or
 * reference to the wavelength being left: there is nothing here that could
 * reopen, modify, or delete it.
 *
 * QA follow-up pass: goes to `/play` (the game picker), not straight into
 * `/create` (Make Your Own's empty builder) — same reasoning and
 * destination as the Result page's own "Create your own quiz" (components/
 * result/create-new-wavelength-cta.tsx): B just finished whichever
 * ready-made game A picked, not necessarily Make Your Own, so "create your
 * own" here should offer that same choice of experience, not assume one.
 */
export function CreateNewWavelengthAction() {
  const router = useRouter();

  return (
    <ConfirmDialog
      triggerLabel="Create your own quiz"
      title="Start a new quiz?"
      description="Make sure you've saved or shared your current result first. You may lose access to this completed result when you start a new one."
      onConfirm={() => router.push("/play")}
    />
  );
}
