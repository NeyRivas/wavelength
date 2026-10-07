"use client";

import { useEffect, useState } from "react";

const FINDING_PHASE_MS = 1000;
const READY_PHASE_MS = 550;

type Phase = "finding" | "ready" | "revealed";

/**
 * Restore pass: brings back the original two-phase anticipation screen
 * from commit 5ed9e3e ("Add the results transition and redesign the
 * final result screen") — a brief "finding" beat, a shorter "ready" beat,
 * then the already-fully-computed result. `children` is that real result
 * content, already rendered server-side (scored via lib/scoring/score.ts,
 * nothing computed here); this component does nothing but hold off
 * showing it for those two short beats. No AI, no recomputation, no data
 * fetching of its own — same ~1.55s total delay as the original.
 * `children` is never rendered until `phase === "revealed"`, so nothing
 * about the result — including whether either side even answered — is
 * ever visible before that.
 *
 * This had been replaced (QA follow-up pass) by a single-phase
 * SameeeishWordmark hero build; restoring the two-phase wave/dots motif
 * here does not touch that component (components/result/
 * sameeeish-reveal.tsx) — it's still the approved small flourish inside
 * each result card itself (GuessAccuracySummary/FriendshipMemorySummary/
 * GlobalSummary all still render it), since that's the Results card's own
 * visual design, not the transition. The two are independent: this is
 * only what shows *before* those cards reveal.
 *
 * Copy: the original's first-phase text was "Finding your wavelength…",
 * which would visibly reintroduce the retired "Wavelength" brand name.
 * "Finding your result…" is the brand-safe replacement already approved
 * and in use elsewhere in this exact spot (previously as this
 * component's sr-only status text) — same anticipatory meaning, no
 * visible rebrand. The second phase's "See your results" needed no
 * change; it never mentioned "wavelength" to begin with. The motif
 * itself — the dashed wave path, the two converging dots, the center
 * glow — and its CSS class names (`.wavelength-loading*`) are restored
 * verbatim from 5ed9e3e: internal identifiers only, never rendered as
 * text, same "legacy internal naming is fine" exception already applied
 * to `wavelengthId`/the `wavelengths` table elsewhere in this codebase.
 *
 * No `celebrate` prop anymore — the original transition never varied by
 * result tier (that was specific to the SameeeishWordmark hero build this
 * restores away from), so the three call sites in app/w/[token]/
 * result/page.tsx no longer pass one.
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
        {phase === "finding" ? "Finding your result…" : "See your results"}
      </p>
    </div>
  );
}
