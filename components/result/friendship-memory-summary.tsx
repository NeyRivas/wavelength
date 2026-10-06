import type { WavelengthResultView } from "@/lib/wavelength/result";
import {
  computeFriendshipMemory,
  friendshipMemoryMessageForA,
} from "@/lib/wavelength/friendship-memory";

import { SameeeishWordmark } from "./sameeeish-reveal";

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
 * QA follow-up pass: dropped the standalone "{aliasB} got X out of Y
 * right." line (the exact redundancy this pass was asked to fix) —
 * `interpretation` just below it already said the same count
 * ("{aliasB} got X of {aliasA}'s Y friendship moments right."), so two
 * consecutive lines were saying the same thing. `correctCount`/
 * `totalQuestions` still come straight from computeFriendshipMemory,
 * untouched — only the redundant line is gone.
 *
 * Reuses the exact same `.global-summary*` glass-card CSS as every other
 * Result headline (app/globals.css) — same visual language, no new
 * styles — just with different content and no badge/wave indicator. The
 * reaction below the interpretation line is the shared SameeeishWordmark
 * (components/result/sameeeish-reveal.tsx) — the same brand moment the
 * result-reveal transition just showed, not a separate sparkle/confetti
 * system.
 */
export function FriendshipMemorySummary({
  view,
  aliasA,
  aliasB,
  viewer,
}: {
  view: WavelengthResultView;
  aliasA: string;
  aliasB: string;
  /** Which participant is looking at this result right now — same
   * perspective split as GuessAccuracySummary (global QA/copy pass item
   * #10): B (the guesser) sees the original, first-person approved copy;
   * A sees a perspective-matched version of the same four tiers, e.g.
   * "We might need to make more memories." (B) vs. "{aliasB} might need
   * to make more memories." (A) — the approved example for this pair.
   * Neither the tier nor the score changes — computeFriendshipMemory is
   * untouched. */
  viewer: "A" | "B";
}) {
  const { correctCount, totalQuestions, tier, message } = computeFriendshipMemory(
    view.allQuestions.map((question) => question.score),
  );
  const headline = viewer === "A" ? friendshipMemoryMessageForA(tier, aliasB) : message;

  return (
    <section className="global-summary" aria-labelledby="friendship-memory-heading">
      <div className="global-summary__ambient" aria-hidden="true">
        <div className="global-summary__ambient-blob global-summary__ambient-blob--a" />
        <div className="global-summary__ambient-blob global-summary__ambient-blob--b" />
      </div>

      <div className="global-summary__glass">
        <p className="global-summary__eyebrow">Friendship Check</p>
        <h1 id="friendship-memory-heading" className="global-summary__heading">
          {headline}
        </h1>
        <p className="global-summary__interpretation">
          {aliasB} got {correctCount} of {aliasA}&apos;s {totalQuestions} friendship moments right.
        </p>
        <SameeeishWordmark celebrate={tier === "excellent"} size="inline" />
      </div>
    </section>
  );
}
