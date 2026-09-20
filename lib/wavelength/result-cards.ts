/**
 * Presentation layer for the "Result Cards" social-share experience
 * (Results → Share). Same spirit as lib/wavelength/result.ts: this module
 * only re-shapes an already-computed `WavelengthResultView` for a specific
 * screen — no rescoring, no DB access, nothing persisted. It never touches
 * `view.allQuestions` / `whereAligned` / `differentWavelengths` (question-
 * level, individual-answer data) — only `view.global` and `view.categories`
 * (aggregate numbers), the same privacy boundary `buildShareSummaryText`
 * already draws, since these cards are built to be shared outside the
 * couple.
 */

import { CATEGORY_LABELS } from "./categories";
import type { WavelengthResultView } from "./result";

export interface GradientPreset {
  name: string;
  c1: string;
  c2: string;
}

/** The approved palette only, paired into soft two-stop combinations — the
 * same fixed set explored visually before implementation (never an
 * arbitrary runtime color). */
export const GRADIENT_PRESETS: readonly GradientPreset[] = [
  { name: "Lavender → Blue", c1: "#C9C3F4", c2: "#B9DDF4" },
  { name: "Blue → Mint", c1: "#B9DDF4", c2: "#C5E8DD" },
  { name: "Pink → Peach", c1: "#F3C7DD", c2: "#F7D0B5" },
  { name: "Lavender → Pink", c1: "#C9C3F4", c2: "#F3C7DD" },
  { name: "Mint → Blue", c1: "#C5E8DD", c2: "#B9DDF4" },
  { name: "Peach → Pink", c1: "#F7D0B5", c2: "#F3C7DD" },
];

/** Cap on how many category chips/words a single card shows — keeps the
 * card glanceable regardless of how many categories a Wavelength used
 * (1-6, see lib/wavelength/categories.ts). */
const MAX_CATEGORIES_PER_CARD = 4;

/** Deterministic string hash (FNV-1a) — same input always produces the
 * same gradient, so a given result always looks the same across repeat
 * visits/renders, without needing to persist a chosen gradient anywhere. */
function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** "Controlled random": always one of GRADIENT_PRESETS, chosen
 * deterministically from a seed built out of the result's own content
 * (never a Math.random() — two different couples get an evenly-distributed
 * but stable pick, the same couple always gets the same one). */
export function pickGradientPreset(seed: string): GradientPreset {
  const index = hashString(seed) % GRADIENT_PRESETS.length;
  return GRADIENT_PRESETS[index] ?? GRADIENT_PRESETS[0]!;
}

export interface ResultCardsData {
  aliasA: string;
  aliasB: string;
  score: number;
  /** Display labels, highest alignment first. Always at least one entry
   * (falls back to the single highest-scoring category if none reach
   * "High Alignment") — Card 2 ("You really clicked") always has
   * something to show. */
  alignedCategories: string[];
  /** Display labels, lowest alignment first. Can be empty when every
   * category is "High Alignment" — Card 3 renders a positive fallback
   * message in that case rather than forcing a difference that isn't
   * there. Never framed as negative here or by any caller. */
  differentCategories: string[];
  gradient: GradientPreset;
}

export function buildResultCardsData(
  view: WavelengthResultView,
  aliasA: string,
  aliasB: string,
): ResultCardsData {
  // view.categories is already sorted highest alignment first
  // (lib/wavelength/result.ts) — reused as-is, never re-sorted here.
  const highAligned = view.categories.filter((c) => c.level === "High Alignment");
  const notHighAligned = view.categories.filter((c) => c.level !== "High Alignment");

  const alignedSource = highAligned.length > 0 ? highAligned : view.categories.slice(0, 1);
  const alignedCategories = alignedSource
    .slice(0, MAX_CATEGORIES_PER_CARD)
    .map((c) => CATEGORY_LABELS[c.category]);

  const differentCategories = notHighAligned
    .slice(0, MAX_CATEGORIES_PER_CARD)
    .map((c) => CATEGORY_LABELS[c.category]);

  const seed = [
    aliasA,
    aliasB,
    view.global.score,
    ...view.categories.map((c) => `${c.category}:${c.score}`),
  ].join("|");

  return {
    aliasA,
    aliasB,
    score: view.global.score,
    alignedCategories,
    differentCategories,
    gradient: pickGradientPreset(seed),
  };
}
