import type { WavelengthResultView } from "@/lib/wavelength/result";
import { computeGuessAccuracy } from "@/lib/wavelength/guess-accuracy";

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
 * Reuses the exact same `.global-summary*` glass-card CSS as every other
 * Result headline (app/globals.css) — same visual language, no new
 * styles — just with different content and no badge/wave indicator.
 */
export function GuessAccuracySummary({
  view,
  aliasA,
  aliasB,
}: {
  view: WavelengthResultView;
  aliasA: string;
  aliasB: string;
}) {
  const { correctCount, totalQuestions, message } = computeGuessAccuracy(
    view.allQuestions.map((question) => question.score),
  );

  return (
    <section className="global-summary" aria-labelledby="guess-accuracy-heading">
      <div className="global-summary__ambient" aria-hidden="true">
        <div className="global-summary__ambient-blob global-summary__ambient-blob--a" />
        <div className="global-summary__ambient-blob global-summary__ambient-blob--b" />
      </div>

      <div className="global-summary__glass">
        <p className="global-summary__eyebrow">How Well Do You Know Me?</p>
        <h1 id="guess-accuracy-heading" className="global-summary__heading">
          {message}
        </h1>
        <p className="global-summary__score">
          You got {correctCount} out of {totalQuestions} right.
        </p>
        <p className="global-summary__interpretation">
          {aliasB} guessed {correctCount} of {aliasA}&apos;s {totalQuestions} answers correctly.
        </p>
      </div>
    </section>
  );
}
