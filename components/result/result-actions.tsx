import type { WavelengthResultView } from "@/lib/wavelength/result";

import { ResultCardsLauncher } from "./cards/result-cards-launcher";
import { CreateNewWavelengthCta } from "./create-new-wavelength-cta";

/**
 * The two actions the completed Result page offers, identically, to both
 * participants (product decision) — start an independent new Wavelength,
 * and share/save the result. "Create your own Wavelength" is the one
 * primary, visually strongest action — the natural next step after seeing
 * a result — with Share as a compact, quieter secondary action underneath
 * it. The percentage above still stays the dominant thing on the page;
 * this section is one clear step below it, not competing.
 *
 * Integration pass: "Share result" now opens the approved Result Cards
 * experience (components/result/cards/) instead of the old plain-text Web
 * Share sheet — Download moved inside that experience (it now saves an
 * image of whichever card is currently showing), so the standalone
 * "Download result" button that used to sit here is gone.
 */
export function ResultActions({
  view,
  aliasA,
  aliasB,
}: {
  view: WavelengthResultView;
  aliasA: string;
  aliasB: string;
}) {
  return (
    <section className="result-actions" aria-label="Result actions">
      <CreateNewWavelengthCta />
      <div className="result-actions__secondary">
        <ResultCardsLauncher view={view} aliasA={aliasA} aliasB={aliasB} />
      </div>
    </section>
  );
}
