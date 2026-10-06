import { describe, expect, it } from "vitest";

import { optionDisplayValue, UNWRITTEN_OPTION } from "../../lib/wavelength/categories";

describe("optionDisplayValue", () => {
  it("maps the UNWRITTEN_OPTION sentinel to a genuinely blank display value", () => {
    expect(optionDisplayValue(UNWRITTEN_OPTION)).toBe("");
  });

  it("returns real, A-authored option text unchanged, verbatim", () => {
    expect(optionDisplayValue("Pizza")).toBe("Pizza");
    expect(optionDisplayValue("Sushi")).toBe("Sushi");
    expect(optionDisplayValue("Tacos")).toBe("Tacos");
  });

  it("never discards real text just because it happens to contain whitespace", () => {
    // Regression guard: the sentinel check must be an exact-value
    // comparison against UNWRITTEN_OPTION, not a generic "looks blank-ish"
    // heuristic (e.g. trimming) that could misfire on real content a user
    // actually typed with leading/trailing spaces.
    expect(optionDisplayValue(" Pizza ")).toBe(" Pizza ");
  });

  it("is distinct from an ordinary empty string, which is not the sentinel", () => {
    // UNWRITTEN_OPTION is a non-breaking space (U+00A0), not "" — the DB's
    // own questions_validate_options trigger rejects a literal empty
    // string for a choice option, so this case should never occur in
    // practice, but the function must not special-case it either way.
    expect(optionDisplayValue("")).toBe("");
  });
});
