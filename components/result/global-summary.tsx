import type { AlignmentLevel } from "@/lib/scoring/score";
import { ALIGNMENT_INTERPRETATION } from "@/lib/wavelength/result";

import { AlignmentBadge } from "./alignment-badge";
import { WavelengthIndicator } from "./wavelength-indicator";

/**
 * The percentage is secondary to the concept — the heading asks the
 * question the product is about, the wave visual and level badge carry
 * the answer, and the number confirms it. The interpretation copy
 * (lib/wavelength/result.ts) is deliberately never framed as scientific,
 * predictive, diagnostic, or statistically validated.
 */
export function GlobalSummary({ score, level }: { score: number; level: AlignmentLevel }) {
  return (
    <section className="global-summary" aria-labelledby="global-summary-heading">
      <h1 id="global-summary-heading">Are you on the same wavelength?</h1>
      <WavelengthIndicator score={score} level={level} />
      <p className="global-summary__score">{score}%</p>
      <AlignmentBadge level={level} />
      <p>{ALIGNMENT_INTERPRETATION[level]}</p>
    </section>
  );
}
