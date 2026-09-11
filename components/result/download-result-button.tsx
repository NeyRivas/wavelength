"use client";

import { buildResultText } from "@/lib/wavelength/export";
import type { WavelengthResultView } from "@/lib/wavelength/result";

const FILENAME = "wavelength-result.txt";

/**
 * Entirely client-side: no request, no new backend/storage (product
 * requirement — "MVP-simple"). `view`/`aliasA`/`aliasB` are the exact same,
 * already-authorized props the Result page passed to ResultView, so the
 * downloaded file can never contain anything that page didn't already show
 * this viewer. Blob + a temporary `<a download>` is the standard,
 * dependency-free way to save a generated file across current browsers.
 */
export function DownloadResultButton({
  view,
  aliasA,
  aliasB,
}: {
  view: WavelengthResultView;
  aliasA: string;
  aliasB: string;
}) {
  function handleDownload() {
    const text = buildResultText(view, aliasA, aliasB);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = FILENAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button type="button" onClick={handleDownload}>
      Download result
    </button>
  );
}
