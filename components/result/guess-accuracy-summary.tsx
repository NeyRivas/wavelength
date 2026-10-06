import type { WavelengthResultView } from "@/lib/wavelength/result";
import { computeGuessAccuracy, guessAccuracyMessageForA } from "@/lib/wavelength/guess-accuracy";

import { SameeeishWordmark } from "./sameeeish-reveal";

/**
 * The Result page's headline for "How Well Do You Know Me?" — a
 * friendship trivia game, not a compatibility quiz. Replaces
 * components/result/global-summary.tsx for this one game only
 * (app/w/[token]/result/page.tsx branches on
 * resolvedGame?.resultMode === "guess-accuracy"). Deliberately does NOT
 * reuse GlobalSummary/AlignmentBadge/WavelengthIndicator: those measure
 * compatibility/alignment between two people (a percentage, High/Mixed/
 * Low), which is the wrong concept here — this measures how many of B's
 * guesses matched A's real answers, so it needs its own framing: a count
 * out of the total, never a percentage, never "aligned".
 *
 * QA follow-up pass: dropped the standalone "{aliasB} got X out of Y
 * right." line — `interpretation` just below it already states the exact
 * same count ("{aliasB} guessed X of {aliasA}'s Y answers correctly."),
 * so the two lines back to back said the same thing twice. Nothing about
 * what's *computed* changed (`correctCount`/`totalQuestions` still come
 * straight from computeGuessAccuracy, untouched) — only that one
 * redundant line is gone; `tier`/`headline` and the interpretation
 * sentence are still both there.
 *
 * Reuses the exact same `.global-summary*` glass-card CSS as every other
 * Result headline (app/globals.css) — same visual language, no new
 * styles — just with different content and no badge/wave indicator. The
 * reaction below the interpretation line is the shared SameeeishWordmark
 * (components/result/sameeeish-reveal.tsx) — the same brand moment the
 * result-reveal transition just showed, not a separate sparkle/confetti
 * system.
 */
export function GuessAccuracySummary({
  view,
  aliasA,
  aliasB,
  viewer,
}: {
  view: WavelengthResultView;
  aliasA: string;
  aliasB: string;
  /** Which participant is looking at this result right now — B (the
   * guesser) sees the original, first-person approved copy; A sees a
   * perspective-matched version of the same four tiers (global QA/copy
   * pass item #9), e.g. "You basically live in my head." (B) vs.
   * "{aliasB} basically lives in your head." (A). Neither the tier nor
   * the underlying score changes — computeGuessAccuracy is untouched. */
  viewer: "A" | "B";
}) {
  const { correctCount, totalQuestions, tier, message } = computeGuessAccuracy(
    view.allQuestions.map((question) => question.score),
  );
  const headline = viewer === "A" ? guessAccuracyMessageForA(tier, aliasB) : message;

  return (
    <section className="global-summary" aria-labelledby="guess-accuracy-heading">
      <div className="global-summary__ambient" aria-hidden="true">
        <div className="global-summary__ambient-blob global-summary__ambient-blob--a" />
        <div className="global-summary__ambient-blob global-summary__ambient-blob--b" />
      </div>

      <div className="global-summary__glass">
        <p className="global-summary__eyebrow">How Well Do You Know Me?</p>
        <h1 id="guess-accuracy-heading" className="global-summary__heading">
          {headline}
        </h1>
        <p className="global-summary__interpretation">
          {aliasB} guessed {correctCount} of {aliasA}&apos;s {totalQuestions} answers correctly.
        </p>
        <SameeeishWordmark celebrate={tier === "excellent"} size="inline" />
      </div>
    </section>
  );
}
