import { createSupabaseServerClient } from "./server";

/**
 * Thrown by `requireUserId()` when no participant session could be
 * established. Under normal operation this should never happen — the root
 * `proxy.ts` guarantees an Anonymous Auth session exists before any
 * Server Component or Server Action runs — so seeing this in practice means
 * either the environment is misconfigured (missing Supabase env vars) or
 * the request somehow bypassed middleware. Callers should let it propagate
 * as a clear 500-type failure rather than silently treating the caller as
 * "nobody" and letting RLS produce a confusing empty-result failure instead.
 */
export class UnauthenticatedError extends Error {
  constructor() {
    super("No authenticated participant session found.");
    this.name = "UnauthenticatedError";
  }
}

/**
 * The current request's participant id — Postgres's `auth.uid()`, the value
 * every RLS policy and RPC in supabase/migrations checks against
 * (ARCHITECTURE.md §4-5). Returns `null` if no session could be established,
 * rather than throwing; use this for reads/branches where "not signed in
 * yet" is a valid state to handle, and `requireUserId()` below for anything
 * that should fail loudly instead.
 *
 * Always calls `auth.getUser()`, never `auth.getSession()`. `getSession()`
 * only reads the JWT already sitting in the cookie, unverified; `getUser()`
 * revalidates it against Supabase Auth on every call, so a revoked or
 * expired session can never be mistaken for a valid one here. This
 * distinction is what "reliable access to auth.uid()" means for identity
 * that RLS is going to trust.
 */
export async function getUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user.id;
}

/**
 * Same as `getUserId()`, but throws `UnauthenticatedError` instead of
 * returning `null`. This is the one Server Actions and Server Components
 * from Phase 4 onward should call before doing anything participant-scoped
 * (creating a draft, saving an answer, etc.) — failing fast here is more
 * useful than letting a request with no identity fall through to Supabase
 * and produce an opaque RLS-denied error several layers down.
 */
export async function requireUserId(): Promise<string> {
  const userId = await getUserId();
  if (!userId) throw new UnauthenticatedError();
  return userId;
}
