import type { WavelengthResultView } from "@/lib/wavelength/result";

import { AlignedSection } from "./aligned-section";
import { AllQuestionsSection } from "./all-questions-section";
import { CategorySummary } from "./category-summary";
import { DifferentSection } from "./different-section";
import { GlobalSummary } from "./global-summary";
import { ResultActions } from "./result-actions";

/** Composes the approved section order: Global → Actions → Categories →
 * Where You're Aligned → Where You Differ → Questions. Purely
 * presentational — `view` already carries every number and every
 * sort/selection decision (lib/wavelength/result.ts). `aliasA`/`aliasB` are
 * presentation-only too (bug-fix pass: real names everywhere, never the
 * bare "A"/"B" internal labels) — threaded straight through to every
 * section that displays individual answers or identity, nothing here
 * recomputes or reshapes `view` itself.
 *
 * Product decision: this is the one Result page both A and B land on once
 * COMPLETED, so ResultActions (download/share/create-new) below is
 * identical for both — no participant-specific branching needed here, the
 * same way none of the sections above it need any either. */
export function ResultView({
  view,
  aliasA,
  aliasB,
  gameId,
}: {
  view: WavelengthResultView;
  aliasA: string;
  aliasB: string;
  /** Which ready-made game this is, if any (lib/wavelength/
   * ready-made-games.ts's own ids) — lets GlobalSummary's heading/eyebrow
   * say "compatibility" for "Are we on the same page?" and "discovery"
   * for "Getting to know each other" instead of one generic line for
   * both (global QA/copy pass item #2/#13). `undefined` for Make Your
   * Own, which keeps the original, fully generic copy. Nothing about
   * `view`'s own scoring/sections changes either way. */
  gameId?: string;
}) {
  return (
    <>
      <GlobalSummary
        score={view.global.score}
        level={view.global.level}
        aliasA={aliasA}
        aliasB={aliasB}
        gameId={gameId}
      />
      <ResultActions view={view} aliasA={aliasA} aliasB={aliasB} />
      <CategorySummary categories={view.categories} />
      <AlignedSection questions={view.whereAligned} aliasA={aliasA} aliasB={aliasB} />
      <DifferentSection questions={view.differentWavelengths} aliasA={aliasA} aliasB={aliasB} />
      <AllQuestionsSection categories={view.categories} aliasA={aliasA} aliasB={aliasB} />
    </>
  );
}
