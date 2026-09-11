import { CreateNewWavelengthAction } from "@/components/wavelength/create-new-wavelength-action";
import type { WavelengthResultView } from "@/lib/wavelength/result";

import { DownloadResultButton } from "./download-result-button";
import { ShareResultButton } from "./share-result-button";

/**
 * The three actions the completed Result page offers, identically, to both
 * participants (product decision) — save/download, share a privacy-safe
 * summary, and start an independent new Wavelength. A plain button row
 * using the existing global button styling only, deliberately placed right
 * under the headline rather than styled to compete with it — the
 * percentage above stays the dominant thing on the page.
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
      <DownloadResultButton view={view} aliasA={aliasA} aliasB={aliasB} />
      <ShareResultButton view={view} aliasA={aliasA} aliasB={aliasB} />
      <CreateNewWavelengthAction />
    </section>
  );
}
