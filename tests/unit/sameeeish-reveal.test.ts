import { describe, expect, it } from "vitest";

import {
  sameeeishRevealDurationMs,
  sameeeishWordFor,
} from "../../components/result/sameeeish-reveal";

describe("sameeeishWordFor", () => {
  it("builds the full word for a non-celebrate (most) result", () => {
    expect(sameeeishWordFor(false)).toBe("SAMEEEISH!");
  });

  it("stops short at the celebratory word for a high/excellent result", () => {
    expect(sameeeishWordFor(true)).toBe("SAMEEE!");
  });

  it("the celebratory word is a strict, in-order prefix of the full word's letters (never a different word)", () => {
    const full = sameeeishWordFor(false).replace("!", "");
    const celebrate = sameeeishWordFor(true).replace("!", "");
    expect(full.startsWith(celebrate)).toBe(true);
  });
});

describe("sameeeishRevealDurationMs", () => {
  it("reduced motion always gets the same short, fixed pause regardless of which word is shown", () => {
    const reducedFull = sameeeishRevealDurationMs(false, true);
    const reducedCelebrate = sameeeishRevealDurationMs(true, true);
    expect(reducedFull).toBe(reducedCelebrate);
    expect(reducedFull).toBeGreaterThan(0);
  });

  it("without reduced motion, the full SAMEEEISH! build takes longer than the shorter SAMEEE! build", () => {
    const full = sameeeishRevealDurationMs(false, false);
    const celebrate = sameeeishRevealDurationMs(true, false);
    expect(full).toBeGreaterThan(celebrate);
  });

  it("the reduced-motion pause is always shorter than letting the full letter-by-letter build play out", () => {
    const reduced = sameeeishRevealDurationMs(false, true);
    const full = sameeeishRevealDurationMs(false, false);
    expect(reduced).toBeLessThan(full);
  });
});
