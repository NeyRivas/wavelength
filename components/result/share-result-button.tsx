"use client";

import { useState } from "react";

import { buildShareSummaryText } from "@/lib/wavelength/export";
import type { WavelengthResultView } from "@/lib/wavelength/result";

/**
 * Privacy-safe sharing only (product requirement) — builds the
 * category-level-only summary (buildShareSummaryText; never individual
 * answers or question-level comparisons) and hands it to the native Web
 * Share API when available. No public result URL is ever created or
 * shared: only this plain text, and nothing is sent to a server to get it.
 *
 * Falls back to copying that same text to the clipboard — same
 * tolerant try/catch style as components/wavelength/copy-link-button.tsx —
 * when the Web Share API isn't available (most desktop browsers) or the
 * user dismisses the native share sheet.
 */
export function ShareResultButton({
  view,
  aliasA,
  aliasB,
}: {
  view: WavelengthResultView;
  aliasA: string;
  aliasB: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const text = buildShareSummaryText(view, aliasA, aliasB);

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: "Wavelength result", text });
        return;
      } catch {
        // User dismissed the native share sheet, or it otherwise failed —
        // fall through to the clipboard fallback below instead of erroring.
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable/blocked too (permissions,
      // non-HTTPS, etc.) — nothing more to do without a backend, which
      // this feature deliberately doesn't have.
    }
  }

  return (
    <button type="button" onClick={handleShare}>
      {copied ? "Copied!" : "Share result"}
    </button>
  );
}
