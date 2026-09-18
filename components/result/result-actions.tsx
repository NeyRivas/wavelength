import type { WavelengthResultView } from "@/lib/wavelength/result";

import { CreateNewWavelengthCta } from "./create-new-wavelength-cta";
import { DownloadResultButton } from "./download-result-button";
import { ShareResultButton } from "./share-result-button";

/**
 * The three actions the completed Result page offers, identically, to both
 * participants (product decision) — start an independent new Wavelength,
 * share a privacy-safe summary, and save/download. Clear hierarchy
 * (feedback pass): "Create your own Wavelength" is the one primary,
 * visually strongest action — the natural next step after seeing a
 * result — with Share and Download as a compact, quieter secondary row
 * underneath it. The percentage above still stays the dominant thing on
 * the page; this section is one clear step below it, not competing.
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
        <ShareResultButton view={view} aliasA={aliasA} aliasB={aliasB} />
        <DownloadResultButton view={view} aliasA={aliasA} aliasB={aliasB} />
      </div>
    </section>
  );
}
