"use client";

import { useState } from "react";

/**
 * Presentation only — the copy logic (Clipboard API, 2s "copied" window,
 * silent fallback to the always-visible link text if the API is
 * unavailable/blocked) is completely unchanged from before this pass.
 * Default state: "Copy link" with a small inline link icon. Copied
 * state: a brief "✓ Link copied" label and a mint-tinted background
 * (the same tint used for positive/quiet-confirmation moments
 * elsewhere, e.g. the "align" motif) instead of a new color or a modal.
 */
export function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className={`share-copy-button${copied ? " share-copy-button--copied" : ""}`}
      onClick={() => {
        navigator.clipboard
          .writeText(link)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          })
          .catch(() => {
            // Clipboard API can be unavailable/blocked (permissions,
            // non-HTTPS, etc.) — the link text is still shown right next to
            // this button and selectable/copyable by hand.
          });
      }}
    >
      {copied ? (
        "✓ Link copied"
      ) : (
        <>
          <svg
            className="share-copy-button__icon"
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <rect x="7" y="7" width="9" height="9" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M13 7V5.5A1.5 1.5 0 0 0 11.5 4h-7A1.5 1.5 0 0 0 3 5.5v7A1.5 1.5 0 0 0 4.5 14H6"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          Copy link
        </>
      )}
    </button>
  );
}
