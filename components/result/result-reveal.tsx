"use client";

import { useEffect, useState } from "react";

const FINDING_PHASE_MS = 1000;
const READY_PHASE_MS = 550;

type Phase = "finding" | "ready" | "revealed";

const SAMEEEISH_LETTERS = "SAMEEEISH".split("");
const SAME_LETTERS = "SAME!".split("");

/**
 * The brand's own reveal moment → the already-fully-computed result.
 * `children` is the real result content, already rendered server-side
 * (scored via lib/scoring/score.ts, nothing computed here); this
 * component does nothing but hold off showing it for a short, two-beat
 * moment before revealing it. No AI, no recomputation, no data fetching
 * of its own — total delay (~1.55s) is unchanged from the original
 * two-phase timing, just re-themed. `children` is never rendered until
 * `phase === "revealed"`, so nothing about the result — including
 * whether either side even answered — is ever visible before that.
 *
 * Global QA/copy pass item #8: replaces "Finding your wavelength…" with
 * the word SAMEEEISH itself, its letters popping in one by one (a small
 * brand reaction, not a literal progress message) — then, only when
 * `celebrate` is true (a high-tier/high-alignment result — see the three
 * call sites in app/w/[token]/result/page.tsx, each deriving it from
 * their own already-computed tier/level, never a new calculation),
 * playfully collapses into "SAME!" for the second beat. Any other result
 * keeps showing SAMEEEISH throughout — never a lesser or sadder word, the
 * full brand name is already the warm, playful default. Letter pop-in is
 * wrapped in `@media (prefers-reduced-motion: no-preference)`
 * (app/globals.css) — reduced-motion users see the same two words, fully
 * formed, with no motion at all; the two-phase *timing* itself (unrelated
 * to motion) is unchanged for everyone, same as before this pass.
 */
export function ResultReveal({
  children,
  celebrate = false,
}: {
  children: React.ReactNode;
  celebrate?: boolean;
}) {
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

  const showSame = phase === "ready" && celebrate;
  const letters = showSame ? SAME_LETTERS : SAMEEEISH_LETTERS;

  return (
    <div
      className={`sameeeish-reveal${phase === "ready" ? " sameeeish-reveal--ready" : ""}${showSame ? " sameeeish-reveal--same" : ""}`}
    >
      <p className="sameeeish-reveal__word" aria-hidden="true">
        {letters.map((letter, i) => (
          <span
            key={`${showSame}-${i}`}
            className="sameeeish-reveal__letter"
            style={{ animationDelay: `${i * 45}ms` }}
          >
            {letter}
          </span>
        ))}
      </p>
      {/* The real accessible status — the big word above is purely
          decorative brand motion, aria-hidden, so this is the only thing
          a screen reader announces for the whole transition. */}
      <p className="sr-only" role="status" aria-live="polite">
        {phase === "finding" ? "Finding your result…" : "Here it is…"}
      </p>
    </div>
  );
}
