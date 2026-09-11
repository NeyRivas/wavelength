/**
 * Client-facing exports of an already-computed `WavelengthResultView`
 * (ARCHITECTURE.md §12 Phase 6/product follow-up: "save/download" and
 * "share" actions on the completed Result page). Pure string-building only
 * — no DOM, no fetch, no storage — so it's usable from a Client Component
 * (components/result/download-result-button.tsx,
 * components/result/share-result-button.tsx) and unit-testable on its own.
 *
 * Two deliberately different privacy shapes:
 *
 *  - `buildResultText` is for **download only**: it's for the same,
 *    already-authorized viewer the Result page itself rendered `view` for
 *    (both A and B may read both sides' answers once COMPLETED — see
 *    answers_select in supabase/migrations), so it may repeat exactly what
 *    that page already shows them, individual answers included. It must
 *    never be reused for anything that could reach a third party.
 *  - `buildShareSummaryText` is for **sharing with someone else** who is
 *    not necessarily a participant at all (privacy requirement): category-
 *    level numbers only — no question text, no individual answers, no
 *    question-by-question comparison. Never add a per-question loop to
 *    this function.
 */

import { CATEGORY_LABELS } from "./categories";
import { ALIGNMENT_INTERPRETATION, type WavelengthResultView } from "./result";

/** A readable, plain-text version of exactly what the Result page shows
 * this viewer — safe to write to a file the participant downloads for
 * themselves. Deterministic (same `view` always produces the same text),
 * so nothing here needs a timestamp to be useful. */
export function buildResultText(
  view: WavelengthResultView,
  aliasA: string,
  aliasB: string,
): string {
  const title = `Wavelength result — ${aliasA} & ${aliasB}`;
  const lines: string[] = [title, "=".repeat(title.length), ""];

  lines.push(`Overall alignment: ${view.global.score}% (${view.global.level})`);
  lines.push(ALIGNMENT_INTERPRETATION[view.global.level]);
  lines.push("");

  lines.push("Categories");
  lines.push("----------");
  for (const c of view.categories) {
    lines.push(`- ${CATEGORY_LABELS[c.category]}: ${c.score}% (${c.level})`);
  }
  lines.push("");

  lines.push("Where You're Aligned");
  lines.push("---------------------");
  if (view.whereAligned.length === 0) {
    lines.push("(no questions to show)");
  } else {
    for (const q of view.whereAligned) {
      lines.push(`- ${q.text}`);
      lines.push(`  ${aliasA}: ${q.answerA}  |  ${aliasB}: ${q.answerB}  (${q.score}% match)`);
    }
  }
  lines.push("");

  lines.push("Different Wavelengths");
  lines.push("----------------------");
  if (view.differentWavelengths.length === 0) {
    lines.push("You matched on everything — no differences to explore this time.");
  } else {
    for (const q of view.differentWavelengths) {
      lines.push(`- ${q.text}`);
      lines.push(`  ${aliasA}: ${q.answerA}  |  ${aliasB}: ${q.answerB}  (${q.score}% match)`);
    }
  }
  lines.push("");
  lines.push("This file is yours to keep — Wavelength doesn't store it anywhere.");

  return lines.join("\n");
}

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
