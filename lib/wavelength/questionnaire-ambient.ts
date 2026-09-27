export type AmbientShape = "glow" | "sparkle";

export interface AmbientPiece {
  key: string;
  side: "left" | "right";
  shape: AmbientShape;
  topPercent: number;
  sizeRem: number;
  edgeGapRem: number;
  colorVar: string;
  blurPx: number;
  opacity: number;
  durationS: number;
  delayS: number;
  driftXRem: number;
  driftYRem: number;
}

const PALETTE_VARS = [
  "--wl-lavender",
  "--wl-blue",
  "--wl-pink",
  "--wl-peach",
  "--wl-mint",
] as const;

/**
 * Deterministic, organic-looking ambient decoration alongside the full
 * question list — never Math.random() (this renders on the server, and a
 * fixed, reproducible layout is easier to reason about and verify), same
 * sine-based-jitter technique landing-hero.tsx uses for its wave shapes.
 *
 * Both the number of pieces and how far down the list they reach scale
 * with `questionCount`, so the decoration accompanies the whole
 * questionnaire — question 1 through the last one — rather than
 * clustering near the top regardless of how long the list is.
 */
export function buildQuestionnaireAmbient(questionCount: number): AmbientPiece[] {
  if (questionCount <= 0) return [];

  const bands = Math.max(3, Math.ceil(questionCount / 2));
  const count = Math.min(14, Math.max(8, bands * 2));

  const pieces: AmbientPiece[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / count;
    const side: "left" | "right" = i % 2 === 0 ? "left" : "right";
    // A few percent of vertical jitter per piece so the run down the page
    // doesn't read as a mechanical grid.
    const jitterPercent = Math.sin(i * 2.7) * (45 / count);
    const topPercent = Math.min(97, Math.max(1, t * 100 + jitterPercent));
    const isSparkle = i % 5 === 3;

    const colorVar = PALETTE_VARS[i % PALETTE_VARS.length]!;
    const durationS = 16 + ((i * 7) % 13); // 16–28s, staggered per piece
    const delayS = (i * 2.3) % 9; // avoids every piece breathing in sync
    const driftXRem = 0.35 + ((Math.sin(i * 3.1) + 1) / 2) * 0.45; // ~0.35–0.8rem
    const driftYRem = 0.35 + ((Math.cos(i * 2.6) + 1) / 2) * 0.55; // ~0.35–0.9rem
    const edgeGapRem = 2.25 + ((Math.sin(i * 1.6) + 1) / 2) * 1.5; // 2.25–3.75rem clear gap

    if (isSparkle) {
      pieces.push({
        key: `ambient-${i}`,
        side,
        shape: "sparkle",
        topPercent,
        sizeRem: 1.1 + ((Math.sin(i) + 1) / 2) * 0.6, // ~1.1–1.7rem
        edgeGapRem,
        colorVar,
        blurPx: 0,
        opacity: 0.7 + ((Math.sin(i * 2.1) + 1) / 2) * 0.15, // 0.70–0.85
        durationS,
        delayS,
        driftXRem,
        driftYRem,
      });
      continue;
    }

    pieces.push({
      key: `ambient-${i}`,
      side,
      shape: "glow",
      topPercent,
      sizeRem: 5 + ((Math.sin(i * 1.9) + 1) / 2) * 6, // ~5–11rem (~80–176px)
      edgeGapRem,
      colorVar,
      blurPx: 25 + ((Math.cos(i * 1.3) + 1) / 2) * 15, // 25–40px
      opacity: 0.6 + ((Math.sin(i * 2.1) + 1) / 2) * 0.15, // 0.60–0.75
      durationS,
      delayS,
      driftXRem,
      driftYRem,
    });
  }
  return pieces;
}
