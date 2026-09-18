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
 * Visual-signature pass: this is the one "glass" moment on Results (the
 * brief's "global result card" / "wavelength visualization container" /
 * "result summary" — one cohesive panel rather than three separate
 * nested glass layers, to keep hierarchy clear: this is the only prolonged
 * glass surface on the page besides the secondary action buttons). The
 * ambient blobs behind it give the glass something living to show
 * through, mirroring the same technique the Hero and Experience sections
 * use — the same visual signature carried into Results.
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
      <div className="global-summary__ambient" aria-hidden="true">
        <div className="global-summary__ambient-blob global-summary__ambient-blob--a" />
        <div className="global-summary__ambient-blob global-summary__ambient-blob--b" />
      </div>

      <div className="global-summary__glass">
        <p className="global-summary__eyebrow">Your wavelength result</p>
        <h1 id="global-summary-heading" className="global-summary__heading">
          Are {aliasA} and {aliasB} on the same wavelength?
        </h1>
        <WavelengthIndicator score={score} level={level} />
        <AlignmentBadge level={level} />
        <p className="global-summary__score">{score}% aligned</p>
        <p className="global-summary__interpretation">{ALIGNMENT_INTERPRETATION[level]}</p>
      </div>
    </section>
  );
}
