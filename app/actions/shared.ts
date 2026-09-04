/**
 * Shared shape for every mutating Server Action in this phase, designed
 * for React's `useActionState`: `{ error: null }` on success (a form can
 * also just check `!state.error`), `{ error: "..." }` with a message safe
 * to show the user otherwise. No action here ever throws for an
 * expected/validatable failure — only for something genuinely
 * unexpected (network/DB outage), which surfaces via Next's normal error
 * handling instead.
 */
export interface ActionState {
  error: string | null;
}

export const initialActionState: ActionState = { error: null };

/** A friendly fallback for Postgres errors we don't map to a specific
 * message — never leaks the raw DB error text to the client. */
export const GENERIC_ERROR = "Something went wrong. Please try again.";

/** True for a Postgres unique_violation (23505) — used to map the DB's own
 * duplicate-question backstop (questions_wavelength_text_uidx) to the same
 * friendly message as the application-level pre-check, in case of a race. */
export function isUniqueViolation(error: { code?: string } | null): boolean {
  return error?.code === "23505";
}
