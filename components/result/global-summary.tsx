import type { AlignmentLevel } from "@/lib/scoring/score";
import { ALIGNMENT_INTERPRETATION } from "@/lib/wavelength/result";

import { AlignmentBadge } from "./alignment-badge";
import { WavelengthIndicator } from "./wavelength-indicator";

/**
 * The percentage is secondary to the concept — the heading asks the
 * question the product is about, the wave visual and level badge carry
 * the answer first, and the number is a smaller supporting stat. The
 * interpretation sentence (lib/wavelength/result.ts) gets the more
 * emotive display treatment instead, since it's the actual human meaning
 * of the result — deliberately never framed as scientific, predictive,
 * diagnostic, or statistically validated.
 *
 * Presentation-only reordering of the exact same props/data this
 * component always received (`score`/`level` still come straight from
 * `view.global`, untouched) — badge now renders before the percentage
 * (previously after), and both gained their own classes for the reveal's
 * visual hierarchy. No new content, no computed value changed.
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
      <p className="global-summary__eyebrow">Your wavelength result</p>
      <h1 id="global-summary-heading" className="global-summary__heading">
        Are {aliasA} and {aliasB} on the same wavelength?
      </h1>
      <WavelengthIndicator score={score} level={level} />
      <AlignmentBadge level={level} />
      <p className="global-summary__score">{score}% aligned</p>
      <p className="global-summary__interpretation">{ALIGNMENT_INTERPRETATION[level]}</p>
    </section>
  );
}
