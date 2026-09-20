/**
 * Client-facing text export of an already-computed `WavelengthResultView`
 * (ARCHITECTURE.md §12 Phase 6/product follow-up: "share" action on the
 * completed Result page). Pure string-building only — no DOM, no fetch, no
 * storage — so it's usable from a Client Component and unit-testable on
 * its own.
 *
 * `buildShareSummaryText` is for **sharing with someone else** who is not
 * necessarily a participant at all (privacy requirement): category-level
 * numbers only — no question text, no individual answers, no
 * question-by-question comparison. Never add a per-question loop to this
 * function. Reused as the `text` payload alongside the exported card image
 * in components/result/cards/result-cards-experience.tsx's Share action.
 *
 * The former `buildResultText` (full per-question download, one viewer's
 * own already-authorized data) was removed when Download changed from a
 * plain-text file to an image of the currently-selected Result Card
 * (components/result/cards/) — nothing else needs that shape of text
 * anymore.
 */

import { CATEGORY_LABELS } from "./categories";
import { ALIGNMENT_INTERPRETATION, type WavelengthResultView } from "./result";

/**
 * A privacy-safe summary suitable for sharing with someone who is not
 * necessarily a participant (product requirement). Deliberately limited to
 * `view.global` and `view.categories` (aggregate numbers only) — never
 * touches `view.allQuestions` / `whereAligned` / `differentWavelengths`, so
 * it structurally cannot leak a question's text, either participant's
 * individual answer, or any question-by-question comparison.
 */
export function buildShareSummaryText(
  view: WavelengthResultView,
  aliasA: string,
  aliasB: string,
): string {
  const lines: string[] = [
    `Wavelength — ${aliasA} & ${aliasB}`,
    `${view.global.score}% aligned (${view.global.level})`,
    ALIGNMENT_INTERPRETATION[view.global.level],
    "",
    "Category alignment:",
  ];

  for (const c of view.categories) {
    lines.push(`- ${CATEGORY_LABELS[c.category]}: ${c.score}%`);
  }

  const topCategories = [...view.categories]
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((c) => CATEGORY_LABELS[c.category]);
  if (topCategories.length > 0) {
    lines.push("", `Most aligned on: ${topCategories.join(", ")}`);
  }

  lines.push("", "Curious how aligned you are with someone? Make your own Wavelength.");

  return lines.join("\n");
}
