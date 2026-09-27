import type { CSSProperties } from "react";

import { buildQuestionnaireAmbient } from "@/lib/wavelength/questionnaire-ambient";

type PieceStyle = CSSProperties & Record<"--op" | "--dx" | "--dy", string | number>;

/**
 * Ambient decoration that runs alongside the full question list — see
 * buildQuestionnaireAmbient (lib/wavelength/questionnaire-ambient.ts) for
 * how many pieces there are and where they land. Rendered as a sibling of
 * the `<ol>` inside `.create-card-list-wrap` (questionnaire-builder.tsx),
 * which is `position: relative` and exactly as tall as the `<ol>` itself
 * (its only in-flow child) — so `inset: 0` here spans the real, current
 * height of the card list, from the first question to the last, and
 * scrolls with it like any other page content (no `position: fixed`).
 *
 * Every piece is positioned with a negative offset from `.create-card-
 * list-wrap`'s own edge (the question column, not the viewport) — e.g. a
 * left-side piece sits at `-(edgeGap + size)`, so its near edge is always
 * `edgeGap` rem outside the column. That gap can never be crossed, so a
 * piece can never reach the column/cards regardless of viewport width;
 * the column-relative approach also means "near the questions" is always
 * true, not just "near the viewport's corners" the way a viewport-
 * anchored version would read.
 */
export function QuestionnaireAmbient({ questionCount }: { questionCount: number }) {
  const pieces = buildQuestionnaireAmbient(questionCount);
  if (pieces.length === 0) return null;

  return (
    <div className="quiz-ambient" aria-hidden="true">
      {pieces.map((piece) => {
        const edgeStyle =
          piece.side === "left"
            ? { left: `${-(piece.edgeGapRem + piece.sizeRem)}rem` }
            : { right: `${-(piece.edgeGapRem + piece.sizeRem)}rem` };

        const style: PieceStyle = {
          top: `${piece.topPercent}%`,
          width: `${piece.sizeRem}rem`,
          height: `${piece.sizeRem}rem`,
          animationDuration: `${piece.durationS}s`,
          animationDelay: `${piece.delayS}s`,
          "--op": piece.opacity,
          "--dx": `${piece.driftXRem}rem`,
          "--dy": `${piece.driftYRem}rem`,
          ...edgeStyle,
          ...(piece.shape === "glow"
            ? {
                filter: `blur(${piece.blurPx}px)`,
                background: `radial-gradient(circle at 45% 45%, var(${piece.colorVar}) 0%, var(${piece.colorVar}) 62%, transparent 100%)`,
              }
            : {}),
        };

        if (piece.shape === "sparkle") {
          return (
            <div
              key={piece.key}
              className="quiz-ambient-piece quiz-ambient-piece--sparkle"
              style={style}
            >
              <div
                className="quiz-ambient-sparkle-shape"
                style={{ background: `var(${piece.colorVar})` }}
              />
            </div>
          );
        }

        return <div key={piece.key} className="quiz-ambient-piece" style={style} />;
      })}
    </div>
  );
}
