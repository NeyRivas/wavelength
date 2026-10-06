"use client";

import { useEffect, useState } from "react";

import { sameeeishRevealDurationMs, SameeeishWordmark } from "./sameeeish-reveal";

/**
 * The brand's own reveal moment → the already-fully-computed result.
 * `children` is the real result content, already rendered server-side
 * (scored via lib/scoring/score.ts, nothing computed here); this
 * component does nothing but hold off showing it for a short, deliberate
 * beat before revealing it. No AI, no recomputation, no data fetching of
 * its own. `children` is never rendered until the hold completes, so
 * nothing about the result — including whether either side even
 * answered — is ever visible before that.
 *
 * QA follow-up pass: now built entirely on the shared SameeeishWordmark
 * (components/result/sameeeish-reveal.tsx) — the same component the
 * result cards themselves use for their own small reaction, so the
 * transition and the result feel like one system, not two different
 * animations. `celebrate` is resolved upstream (the three call sites in
 * app/w/[token]/result/page.tsx, each from their own already-computed
 * tier/level) and decides whether the word stops at the shorter,
 * celebratory SAMEEE! or completes the full SAMEEEISH!.
 */
export function ResultReveal({
  children,
  celebrate = false,
}: {
  children: React.ReactNode;
  celebrate?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = setTimeout(
      () => setRevealed(true),
      sameeeishRevealDurationMs(celebrate, prefersReducedMotion),
    );
    return () => clearTimeout(timer);
  }, [celebrate]);

  if (revealed) {
    return <>{children}</>;
  }

  return (
    <div className="sameeeish-reveal" role="status" aria-live="polite">
      <SameeeishWordmark celebrate={celebrate} size="hero" />
      {/* The real accessible status — the big word above is purely
          decorative brand motion, aria-hidden, so this is the only thing
          a screen reader announces for the whole transition. */}
      <p className="sr-only">Finding your result…</p>
    </div>
  );
}
