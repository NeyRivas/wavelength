"use client";

import { useEffect, useState } from "react";

const REVEAL_DELAY_MS = 1400;

/**
 * "Finding your wavelength…" — a short, purely presentational delay
 * before revealing an already-fully-computed result. `children` is the
 * real result content, already rendered server-side (scored via
 * lib/scoring/score.ts, nothing computed here); this component does
 * nothing but hold off showing it for a moment. No AI, no recomputation,
 * no data fetching of its own.
 */
export function ResultReveal({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), REVEAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!revealed) {
    return (
      <div className="wavelength-loading" role="status" aria-live="polite">
        <svg className="wavelength-pulse" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="20" />
          <circle cx="50" cy="50" r="20" />
          <circle cx="50" cy="50" r="20" />
        </svg>
        <p>Finding your wavelength…</p>
      </div>
    );
  }

  return <>{children}</>;
}
