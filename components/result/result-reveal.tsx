"use client";

import { AnimatePresence, m, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { MotionRoot } from "@/components/overprint/motion-root";

const FINDING_PHASE_MS = 1000;
const READY_PHASE_MS = 550;
// Under prefers-reduced-motion nothing travels, so there's nothing to
// watch: keep a brief beat for the status text, then show the result.
const REDUCED_TOTAL_MS = 350;

type Phase = "finding" | "ready" | "revealed";

/**
 * The anticipation beat before a result: a "finding" phase, a shorter
 * "ready" phase, then the already-fully-computed result. `children` is
 * that real result content, already rendered server-side (scored via
 * lib/scoring/score.ts, nothing computed here); this component only holds
 * it back for those two beats, same ~1.55s as before. `children` is never
 * rendered until `phase === "revealed"`, so nothing about the result is
 * visible before that.
 *
 * Visual: the overprint motif (app/overprint.css). Two discs, one per
 * person, drift toward each other while searching, then settle into an
 * overlap and print their shared colour; the result then rises in. The
 * status text stays in one live region throughout, so screen readers
 * hear "Finding your result…" then "See your results" exactly as before.
 * The `.wavelength-loading*` class names are kept from the previous
 * implementation (legacy internal naming, never rendered as text).
 */
function Reveal({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("finding");
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) {
      const toRevealed = setTimeout(() => setPhase("revealed"), REDUCED_TOTAL_MS);
      return () => clearTimeout(toRevealed);
    }
    const toReady = setTimeout(() => setPhase("ready"), FINDING_PHASE_MS);
    const toRevealed = setTimeout(() => setPhase("revealed"), FINDING_PHASE_MS + READY_PHASE_MS);
    return () => {
      clearTimeout(toReady);
      clearTimeout(toRevealed);
    };
  }, [reduceMotion]);

  const ready = phase === "ready";

  return (
    <AnimatePresence mode="wait" initial={false}>
      {phase === "revealed" ? (
        <m.div
          key="result"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </m.div>
      ) : (
        <m.div
          key="loading"
          className={`wavelength-loading${ready ? " wavelength-loading--ready" : ""}`}
          role="status"
          aria-live="polite"
          exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
        >
          <div className="op-reveal" aria-hidden="true">
            <m.span
              className="op-disc op-disc--you op-reveal__disc"
              initial={{ x: "-70%" }}
              animate={
                ready
                  ? { x: "-22%", transition: { type: "spring", stiffness: 220, damping: 18 } }
                  : {
                      x: ["-70%", "-40%", "-62%", "-34%"],
                      transition: { duration: FINDING_PHASE_MS / 1000, ease: "easeInOut" },
                    }
              }
            />
            <m.span
              className="op-disc op-disc--them op-reveal__disc"
              initial={{ x: "70%" }}
              animate={
                ready
                  ? { x: "22%", transition: { type: "spring", stiffness: 220, damping: 18 } }
                  : {
                      x: ["70%", "44%", "58%", "36%"],
                      transition: { duration: FINDING_PHASE_MS / 1000, ease: "easeInOut" },
                    }
              }
            />
          </div>
          <p className="wavelength-loading__text">
            {ready ? "See your results" : "Finding your result…"}
          </p>
        </m.div>
      )}
    </AnimatePresence>
  );
}

export function ResultReveal({ children }: { children: React.ReactNode }) {
  return (
    <MotionRoot>
      <Reveal>{children}</Reveal>
    </MotionRoot>
  );
}
