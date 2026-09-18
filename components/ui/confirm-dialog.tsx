"use client";

import { useId, useRef } from "react";

/**
 * A minimal, reusable confirm dialog — the app's first, built on the native
 * `<dialog>` element (`showModal()` / `close()`) rather than a UI library
 * or `window.confirm()`: no new dependency, works across current browsers,
 * and gets modal semantics (focus, backdrop, Escape-to-dismiss) for free.
 * Any future confirmation should reuse this rather than `window.confirm()`
 * or a parallel implementation — see components/wavelength/home-nav.tsx for
 * the one still-existing `window.confirm()` predating this component,
 * intentionally left as-is (unrelated to this change).
 */
export function ConfirmDialog({
  triggerLabel,
  triggerClassName,
  title,
  description,
  confirmLabel = "Continue",
  cancelLabel = "Cancel",
  onConfirm,
}: {
  triggerLabel: string;
  /** Optional class for the trigger button only — the dialog itself
   * (title/description/actions) is unaffected either way. Omitted by
   * every existing caller except the Result page's "Create your own
   * Wavelength" action, so every other trigger button renders exactly as
   * before. */
  triggerClassName?: string;
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
      <button
        type="button"
        className={triggerClassName}
        onClick={() => dialogRef.current?.showModal()}
      >
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
