"use client";

import { useState } from "react";

export function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
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
      {copied ? "Copied!" : "Copy link"}
    </button>
  );
}
