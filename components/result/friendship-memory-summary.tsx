import type { WavelengthResultView } from "@/lib/wavelength/result";
import { computeFriendshipMemory } from "@/lib/wavelength/friendship-memory";

/**
 * The Result page's headline for "Friendship Check" — a shared-history
 * game, not a compatibility quiz. Replaces components/result/
 * global-summary.tsx for this one game only (app/w/[token]/result/page.tsx
 * branches on resolvedGame?.resultMode === "friendship-memory"). A
 * separate component from components/result/guess-accuracy-summary.tsx
 * ("How Well Do You Know Me?"'s own isolated headline) even though the
 * markup shape matches — each game's copy/eyebrow is its own, approved
 * text, not a shared/parameterized template. Deliberately does NOT reuse
 * GlobalSummary/AlignmentBadge/WavelengthIndicator: those measure
 * compatibility/alignment between two people (a percentage, High/Mixed/
 * Low), which is the wrong concept here — this measures how many of B's
 * guesses about the shared friendship matched A's, so it needs its own
 * framing: a count out of the total, never a percentage, never "aligned".
 *
 * Reuses the exact same `.global-summary*` glass-card CSS as every other
 * Result headline (app/globals.css) — same visual language, no new
 * styles — just with different content and no badge/wave indicator.
 */
export function FriendshipMemorySummary({
  view,
  aliasA,
  aliasB,
}: {
  view: WavelengthResultView;
  aliasA: string;
  aliasB: string;
}) {
  const { correctCount, totalQuestions, message } = computeFriendshipMemory(
    view.allQuestions.map((question) => question.score),
  );

  return (
    <section className="global-summary" aria-labelledby="friendship-memory-heading">
      <div className="global-summary__ambient" aria-hidden="true">
        <div className="global-summary__ambient-blob global-summary__ambient-blob--a" />
        <div className="global-summary__ambient-blob global-summary__ambient-blob--b" />
      </div>

      <div className="global-summary__glass">
        <p className="global-summary__eyebrow">Friendship Check</p>
        <h1 id="friendship-memory-heading" className="global-summary__heading">
          {message}
        </h1>
        <p className="global-summary__score">
          You got {correctCount} out of {totalQuestions} right.
        </p>
        <p className="global-summary__interpretation">
          {aliasB} got {correctCount} of {aliasA}&apos;s {totalQuestions} friendship moments right.
        </p>
      </div>
    </section>
  );
}
