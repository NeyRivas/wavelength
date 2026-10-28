"use client";

import { m } from "motion/react";

import { MotionRoot } from "@/components/overprint/motion-root";

/**
 * The result's headline visual: one disc per person, overlapping by the
 * alignment score itself. At 100% the discs sit exactly on top of each
 * other; at 0% they only touch. Where they overlap, the two colours
 * multiply into a deeper shared tone (app/overprint.css), which is the
 * same image the home page demo and the reveal before this use, so the
 * score reads as the end of one continuous story. The discs slide in
 * from apart to their real positions once, when the result appears.
 */
export function WavelengthIndicator({
  score,
  aliasA,
  aliasB,
}: {
  score: number;
  aliasA?: string;
  aliasB?: string;
}) {
  const clamped = Math.min(100, Math.max(0, score));
  // Each disc moves half the centre-to-centre distance, in percent of its
  // own width: 0% apart at a full score, one full width apart at zero.
  const offset = ((100 - clamped) / 100) * 50;

  return (
    <MotionRoot>
      <div
        className="op-score"
        role="img"
        aria-label={`Two circles overlapping ${clamped} percent, showing how closely your answers align`}
      >
        <m.span
          className="op-disc op-disc--you op-score__disc"
          initial={{ x: "-55%" }}
          animate={{ x: `${-offset}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.25 }}
        >
          {aliasA && <span className="op-score__name">{aliasA}</span>}
        </m.span>
        <m.span
          className="op-disc op-disc--them op-score__disc"
          initial={{ x: "55%" }}
          animate={{ x: `${offset}%` }}
          transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.25 }}
        >
          {aliasB && <span className="op-score__name">{aliasB}</span>}
        </m.span>
      </div>
    </MotionRoot>
  );
}
