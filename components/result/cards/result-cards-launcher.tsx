"use client";

import { useMemo, useState } from "react";

import { buildShareSummaryText } from "@/lib/wavelength/export";
import { buildResultCardsData } from "@/lib/wavelength/result-cards";
import type { WavelengthResultView } from "@/lib/wavelength/result";

import { ResultCardsExperience } from "./result-cards-experience";

/** Purely decorative — this file's own icon, independent of anything
 * inside the Result Cards experience itself (that experience is frozen;
 * this button lives on the Results page, before it ever opens). */
function ShareCtaIcon() {
  return (
    <svg className="result-share-cta__icon" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d="M8 1.5v8M8 1.5L5 4.5M8 1.5l3 3"
        stroke="#181820"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 8.5v4a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-4"
        stroke="#181820"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Replaces the old ShareResultButton/DownloadResultButton pair. "Share
 * result" now opens the approved Result Cards experience (4-card
 * Instagram-Stories-first sequence) instead of invoking the plain-text Web
 * Share sheet — Download moved inside that experience, since it now saves
 * an image of whichever card is currently showing, not a fixed one-shot
 * text file.
 *
 * Hierarchy pass: this button is the Results page's standout CTA
 * (.result-share-cta, app/globals.css) — sharing is a core part of the
 * product, so it now reads as clearly more prominent than any other
 * action on the page. Nothing about what it does changed, only its own
 * visual weight; the Result Cards experience it opens is untouched.
 */
export function ResultCardsLauncher({
  view,
  aliasA,
  aliasB,
}: {
  view: WavelengthResultView;
  aliasA: string;
  aliasB: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const data = useMemo(() => buildResultCardsData(view, aliasA, aliasB), [view, aliasA, aliasB]);
  const shareText = useMemo(
    () => buildShareSummaryText(view, aliasA, aliasB),
    [view, aliasA, aliasB],
  );

  return (
    <>
      <button type="button" className="result-share-cta" onClick={() => setIsOpen(true)}>
        <ShareCtaIcon />
        Share result
      </button>
      {isOpen && (
        <ResultCardsExperience data={data} shareText={shareText} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
