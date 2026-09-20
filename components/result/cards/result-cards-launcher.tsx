"use client";

import { useMemo, useState } from "react";

import { buildShareSummaryText } from "@/lib/wavelength/export";
import { buildResultCardsData } from "@/lib/wavelength/result-cards";
import type { WavelengthResultView } from "@/lib/wavelength/result";

import { ResultCardsExperience } from "./result-cards-experience";

/**
 * Replaces the old ShareResultButton/DownloadResultButton pair. "Share
 * result" now opens the approved Result Cards experience (4-card
 * Instagram-Stories-first sequence) instead of invoking the plain-text Web
 * Share sheet — Download moved inside that experience, since it now saves
 * an image of whichever card is currently showing, not a fixed one-shot
 * text file.
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
      <button type="button" className="result-secondary-button" onClick={() => setIsOpen(true)}>
        Share result
      </button>
      {isOpen && (
        <ResultCardsExperience data={data} shareText={shareText} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}
