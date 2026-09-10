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
 *
 * Bug-fix pass: the heading names both participants by their actual
 * aliases rather than the generic "you" framing — real names everywhere
 * identity is shown, never the bare "A"/"B" internal labels.
 */
export function GlobalSummary({
  score,
  level,
  aliasA,
  aliasB,
}: {
  score: number;
  level: AlignmentLevel;
  aliasA: string;
  aliasB: string;
}) {
  return (
    <section className="global-summary" aria-labelledby="global-summary-heading">
      <h1 id="global-summary-heading">
        Are {aliasA} and {aliasB} on the same wavelength?
      </h1>
      <WavelengthIndicator score={score} level={level} />
      <p className="global-summary__score">{score}%</p>
      <AlignmentBadge level={level} />
      <p>{ALIGNMENT_INTERPRETATION[level]}</p>
    </section>
  );
}
