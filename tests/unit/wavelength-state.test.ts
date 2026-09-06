import { describe, expect, it } from "vitest";

import { isValidTransition } from "../../lib/wavelength/state";

// Smoke tests for the Phase 0 scaffolding utilities (testing foundations).
// The authoritative rules live in the database (supabase/migrations) and are
// proven by tests/integration; these just confirm the non-authoritative TS
// mirrors used for UI gating agree with the state machine in ARCHITECTURE.md §6.

describe("isValidTransition", () => {
  it("allows the four approved edges", () => {
    expect(isValidTransition("DRAFT", "WAITING")).toBe(true);
    expect(isValidTransition("WAITING", "IN_PROGRESS")).toBe(true);
    expect(isValidTransition("IN_PROGRESS", "COMPLETED")).toBe(true);
  });

  it("allows same-state no-ops (e.g. B saving progress)", () => {
    expect(isValidTransition("IN_PROGRESS", "IN_PROGRESS")).toBe(true);
  });

  it("rejects skipped or backward transitions", () => {
    expect(isValidTransition("DRAFT", "IN_PROGRESS")).toBe(false);
    expect(isValidTransition("WAITING", "COMPLETED")).toBe(false);
    expect(isValidTransition("COMPLETED", "DRAFT")).toBe(false);
    expect(isValidTransition("IN_PROGRESS", "DRAFT")).toBe(false);
  });

  it("rejects any transition out of COMPLETED", () => {
    expect(isValidTransition("COMPLETED", "WAITING")).toBe(false);
    expect(isValidTransition("COMPLETED", "IN_PROGRESS")).toBe(false);
  });
});
