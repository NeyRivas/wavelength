"use client";

import { useId, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * The Result page's primary CTA — "Create your own quiz" (feedback pass:
 * this replaces the old top-right "Wavelength" home-nav link as the one
 * and only "start another questionnaire" affordance, and is now styled
 * as the page's strongest action).
 *
 * Confirms first via a bespoke dialog rather than the generic
 * ConfirmDialog (components/ui/confirm-dialog.tsx) — that component is
 * also used by B's locked "Nice try!" page, which this pass must not
 * visually change, so this screen gets its own small dialog instead of
 * restyling the shared one. Same reasoning as before: the current
 * participant session may be the only way back to this completed result,
 * so leaving always confirms first.
 *
 * Global QA/copy pass item #12: this now goes to `/play` (the game
 * picker), not straight into `/create` (Make Your Own's empty form) —
 * the result someone just saw could be any of the ready-made games, so
 * "create your own" should offer the same choice of experience they
 * started from, not assume Make Your Own. Confirming is still nothing
 * more than a plain client-side navigation; it takes no id or reference
 * to the wavelength being left — nothing here could reopen, modify, or
 * delete it. Choosing "Stay here" just closes the dialog — no
 * navigation, no state change.
 */
export function CreateNewWavelengthCta() {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();

  return (
    <>
      <button
        type="button"
        className="result-primary-button"
        onClick={() => dialogRef.current?.showModal()}
      >
        <span className="result-primary-button__label">Create your own quiz</span>
      </button>
      <dialog ref={dialogRef} className="wavelength-dialog" aria-labelledby={headingId}>
        <svg
          className="wavelength-dialog__motif"
          viewBox="0 0 200 60"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M14 32c26-20 52-20 72 0s46 20 72 0"
            stroke="var(--wl-muted)"
            strokeWidth="1.5"
            strokeDasharray="5 6"
          />
          <circle
            cx="14"
            cy="32"
            r="7"
            fill="#ffffff"
            stroke="var(--wl-lavender)"
            strokeWidth="3.5"
          />
          <circle cx="158" cy="32" r="7" fill="#ffffff" stroke="var(--wl-blue)" strokeWidth="3.5" />
        </svg>
        <h2 id={headingId} className="wavelength-dialog__heading">
          Leave this result?
        </h2>
        <p className="wavelength-dialog__text">
          This result lives here for now. Make sure you&apos;ve saved or shared what you want to
          keep — once you start a new one, you may not be able to come back to this result.
        </p>
        <div className="wavelength-dialog__actions">
          <button
            type="button"
            className="wavelength-dialog__button wavelength-dialog__button--secondary"
            onClick={() => dialogRef.current?.close()}
          >
            Stay here
          </button>
          <button
            type="button"
            className="wavelength-dialog__button wavelength-dialog__button--primary"
            onClick={() => {
              dialogRef.current?.close();
              router.push("/play");
            }}
          >
            Continue
          </button>
        </div>
      </dialog>
    </>
  );
}
