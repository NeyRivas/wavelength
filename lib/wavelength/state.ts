/**
 * TS mirror of the `wavelength_state` Postgres enum and its allowed
 * transitions (ARCHITECTURE.md §6).
 *
 * NON-AUTHORITATIVE: this exists only to gate which screen/UI is rendered.
 * The actual rule is enforced in the database by the `wavelengths_state_transition`
 * trigger (supabase/migrations) regardless of what this module says — a
 * manipulated client cannot use this file to force a transition.
 */

export const WAVELENGTH_STATES = ["DRAFT", "WAITING", "IN_PROGRESS", "COMPLETED"] as const;

export type WavelengthState = (typeof WAVELENGTH_STATES)[number];

const ALLOWED_TRANSITIONS: Record<WavelengthState, WavelengthState[]> = {
  DRAFT: ["WAITING"],
  WAITING: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"], // IN_PROGRESS -> IN_PROGRESS (progress save) is a same-state no-op
  COMPLETED: [],
};

export function isValidTransition(from: WavelengthState, to: WavelengthState): boolean {
  return from === to || ALLOWED_TRANSITIONS[from].includes(to);
}
