"use client";

import { useEffect, useState } from "react";

const FINDING_PHASE_MS = 1000;
const READY_PHASE_MS = 550;

type Phase = "finding" | "ready" | "revealed";

/**
 * "Finding your wavelength…" → "See your results" → the already-fully-
 * computed result. `children` is the real result content, already
 * rendered server-side (scored via lib/scoring/score.ts, nothing computed
 * here); this component does nothing but hold off showing it for a short,
 * two-beat moment before revealing it. No AI, no recomputation, no data
 * fetching of its own — total delay (~1.55s) is close to the original
 * single-phase version's 1.4s, just split into a short "finding" beat and
 * a shorter "found it" beat, matching the approved two-line transition
 * copy. `children` is never rendered until `phase === "revealed"`, so
 * nothing about the result — including whether either side even
 * answered — is ever visible before that.
 */
export function ResultReveal({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("finding");

  useEffect(() => {
    const toReady = setTimeout(() => setPhase("ready"), FINDING_PHASE_MS);
    const toRevealed = setTimeout(() => setPhase("revealed"), FINDING_PHASE_MS + READY_PHASE_MS);
    return () => {
      clearTimeout(toReady);
      clearTimeout(toRevealed);
    };
  }, []);

  if (phase === "revealed") {
    return <>{children}</>;
  }

  return (
    <div
      className={`wavelength-loading${phase === "ready" ? " wavelength-loading--ready" : ""}`}
      role="status"
      aria-live="polite"
    >
      <svg
        className="wavelength-loading__motif"
        viewBox="0 0 200 80"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M20 40c30-24 60-24 80 0s50 24 80 0"
          stroke="var(--wl-muted)"
          strokeWidth="1.5"
          strokeDasharray="5 6"
        />
        <circle
          className="wavelength-loading__glow"
          cx="100"
          cy="40"
          r="16"
          fill="var(--wl-mint)"
        />
        <circle
          className="wavelength-loading__dot wavelength-loading__dot--a"
          cx="20"
          cy="40"
          r="9"
          fill="#ffffff"
          stroke="var(--wl-lavender)"
          strokeWidth="4"
        />
        <circle
          className="wavelength-loading__dot wavelength-loading__dot--b"
          cx="180"
          cy="40"
          r="9"
          fill="#ffffff"
          stroke="var(--wl-blue)"
          strokeWidth="4"
        />
      </svg>
      <p className="wavelength-loading__text">
        {phase === "finding" ? "Finding your wavelength…" : "See your results"}
      </p>
    </div>
  );
}
