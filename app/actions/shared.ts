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

/**
 * True for a Postgres unique_violation (23505) whose message/detail names
 * the given constraint. `questions` has two independent unique
 * constraints (`questions_wavelength_text_uidx` for duplicate text,
 * `questions_order_unique` for `order_index`) — a plain "is this a unique
 * violation at all" check can't tell them apart, and mapping every 23505
 * to the same "duplicate text" message mislabels the other one. Used to
 * map the DB's own duplicate-question backstop to the same friendly
 * message as the application-level pre-check, in case of a race — and
 * nothing else, so an unrelated unique violation still surfaces as
 * GENERIC_ERROR instead of a misleading claim about duplicate text.
 */
export function isUniqueViolationOn(
  error: { code?: string; message?: string; details?: string } | null,
  constraintName: string,
): boolean {
  if (error?.code !== "23505") return false;
  return Boolean(
    error.message?.includes(constraintName) || error.details?.includes(constraintName),
  );
}
