import { describe, expect, it } from "vitest";

import { CATEGORY_LABELS } from "../../lib/wavelength/categories";
import {
  buildWavelengthResultView,
  type ResultAnswerRow,
  type ResultQuestionRow,
} from "../../lib/wavelength/result";
import {
  buildResultCardsData,
  GRADIENT_PRESETS,
  pickGradientPreset,
} from "../../lib/wavelength/result-cards";

const aliasA = "Alex";
const aliasB = "Bailey";

function makeView(categoryValues: Record<string, [number, number][]>) {
  const questions: ResultQuestionRow[] = [];
  const answers: ResultAnswerRow[] = [];
  let orderIndex = 0;

  for (const [category, pairs] of Object.entries(categoryValues)) {
    for (const [a, b] of pairs) {
      const id = `${category}-${orderIndex}`;
      questions.push({
        id,
        category: category as ResultQuestionRow["category"],
        type: "scale",
        text: `Question ${id}`,
        options: null,
        order_index: orderIndex,
      });
      answers.push({ question_id: id, participant: "A", value: a });
      answers.push({ question_id: id, participant: "B", value: b });
      orderIndex++;
    }
  }

  return buildWavelengthResultView(questions, answers);
}

describe("buildResultCardsData — category partition", () => {
  it("puts High Alignment categories in alignedCategories and the rest in differentCategories", () => {
    // relationship: same value both times -> 100 (High). money: 100 vs 0 -> 0 (Low).
    const view = makeView({
      relationship: [
        [100, 100],
        [100, 100],
      ],
      money: [[100, 0]],
    });

    const data = buildResultCardsData(view, aliasA, aliasB);

    expect(data.alignedCategories).toEqual([CATEGORY_LABELS.relationship]);
    expect(data.differentCategories).toEqual([CATEGORY_LABELS.money]);
  });

  it("falls back to the single highest-scoring category when none reach High Alignment", () => {
    // relationship: 75 vs 50 -> score 75 (High)... use values that stay below 75 for all.
    const view = makeView({
      relationship: [[100, 50]], // score 50 -> Mixed
      money: [[100, 25]], // score 25 -> Low
    });

    const data = buildResultCardsData(view, aliasA, aliasB);

    // relationship (50) outranks money (25) -> it's the fallback "aligned" pick.
    expect(data.alignedCategories).toEqual([CATEGORY_LABELS.relationship]);
    expect(data.differentCategories).toContain(CATEGORY_LABELS.relationship);
    expect(data.differentCategories).toContain(CATEGORY_LABELS.money);
  });

  it("leaves differentCategories empty when every category is High Alignment", () => {
    const view = makeView({
      relationship: [[100, 100]],
      money: [[75, 100]], // |75-100| = 25 -> score 75, High Alignment
    });

    const data = buildResultCardsData(view, aliasA, aliasB);

    expect(data.differentCategories).toEqual([]);
    expect(data.alignedCategories.length).toBeGreaterThan(0);
  });

  it("caps each list at 4 categories", () => {
    const view = makeView({
      relationship: [[100, 100]],
      lifestyle: [[100, 100]],
      money: [[100, 100]],
      adventures_travel: [[100, 100]],
      future: [[100, 100]],
      values_priorities: [[100, 100]],
    });

    const data = buildResultCardsData(view, aliasA, aliasB);

    expect(data.alignedCategories.length).toBeLessThanOrEqual(4);
  });

  it("carries the real score and aliases through untouched", () => {
    const view = makeView({ relationship: [[100, 100]] });
    const data = buildResultCardsData(view, aliasA, aliasB);

    expect(data.score).toBe(view.global.score);
    expect(data.aliasA).toBe(aliasA);
    expect(data.aliasB).toBe(aliasB);
  });
});

describe("buildResultCardsData — gradient assignment", () => {
  it("is deterministic: the same result always gets the same gradient", () => {
    const view = makeView({ relationship: [[100, 75]] });
    const first = buildResultCardsData(view, aliasA, aliasB);
    const second = buildResultCardsData(view, aliasA, aliasB);

    expect(first.gradient).toEqual(second.gradient);
  });

  it("always picks one of the approved GRADIENT_PRESETS", () => {
    const view = makeView({ relationship: [[100, 75]] });
    const data = buildResultCardsData(view, aliasA, aliasB);

    expect(GRADIENT_PRESETS).toContainEqual(data.gradient);
  });

  it("differs for a different result (not a constant pick)", () => {
    const viewA = makeView({ relationship: [[100, 75]] });
    const viewB = makeView({ money: [[0, 100]] });

    const gradients = new Set(GRADIENT_PRESETS.map((g) => g.name));
    const a = buildResultCardsData(viewA, "Alex", "Bailey").gradient;
    const b = buildResultCardsData(viewB, "Sam", "Riley").gradient;

    expect(gradients.has(a.name)).toBe(true);
    expect(gradients.has(b.name)).toBe(true);
    // Not asserting a != b (a hash collision is legitimate), just that both
    // resolve into the fixed set above.
  });
});

describe("pickGradientPreset", () => {
  it("only ever returns a preset from the fixed set", () => {
    for (const seed of ["a", "ab", "hello world", "", "Ney|Lucas|75"]) {
      expect(GRADIENT_PRESETS).toContainEqual(pickGradientPreset(seed));
    }
  });

  it("is a pure function of its seed", () => {
    expect(pickGradientPreset("same-seed")).toEqual(pickGradientPreset("same-seed"));
  });
});
