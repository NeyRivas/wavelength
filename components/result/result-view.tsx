import type { WavelengthResultView } from "@/lib/wavelength/result";

import { AlignedSection } from "./aligned-section";
import { AllQuestionsSection } from "./all-questions-section";
import { CategorySummary } from "./category-summary";
import { DifferentSection } from "./different-section";
import { GlobalSummary } from "./global-summary";

/** Composes the approved section order: Global → Categories → Where
 * You're Aligned → Different Wavelengths → Questions. Purely
 * presentational — `view` already carries every number and every
 * sort/selection decision (lib/wavelength/result.ts). */
export function ResultView({ view }: { view: WavelengthResultView }) {
  return (
    <>
      <GlobalSummary score={view.global.score} level={view.global.level} />
      <CategorySummary categories={view.categories} />
      <AlignedSection questions={view.whereAligned} />
      <DifferentSection questions={view.differentWavelengths} />
      <AllQuestionsSection categories={view.categories} />
    </>
  );
}
