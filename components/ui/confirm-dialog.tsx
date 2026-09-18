"use client";

import { useId, useRef } from "react";

/**
 * A minimal, reusable confirm dialog — the app's first, built on the native
 * `<dialog>` element (`showModal()` / `close()`) rather than a UI library
 * or `window.confirm()`: no new dependency, works across current browsers,
 * and gets modal semantics (focus, backdrop, Escape-to-dismiss) for free.
 * Deliberately unstyled beyond the shared baseline (dialog/.dialog-actions
 * in app/globals.css) — its one remaining caller is B's locked "Nice
 * try!" page (components/wavelength/create-new-wavelength-action.tsx),
 * which stays out of scope for visual redesign passes. The Result page's
 * own "Create your own Wavelength" confirmation is a separate, bespoke
 * dialog (components/result/create-new-wavelength-cta.tsx) for exactly
 * that reason — restyling this shared component would have changed that
 * protected page too.
 */
export function ConfirmDialog({
  triggerLabel,
  title,
  description,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  onConfirm,
}: {
  triggerLabel: string;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingId = useId();

  return (
    <>
      <button type="button" onClick={() => dialogRef.current?.showModal()}>
        {triggerLabel}
      </button>
      <dialog ref={dialogRef} aria-labelledby={headingId}>
        <h2 id={headingId}>{title}</h2>
        <p>{description}</p>
        <div className="dialog-actions">
          <button type="button" onClick={() => dialogRef.current?.close()}>
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              dialogRef.current?.close();
              onConfirm();
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </dialog>
    </>
  );
}
