"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

/**
 * Browser-side Supabase client.
 *
 * This is the ONLY Supabase client that should be constructed in Client
 * Components. It reads/writes the session via cookies (shared with the
 * server client below), always carries the caller's own Anonymous Auth
 * session, and is subject to RLS on every request — see
 * ARCHITECTURE.md §4-5. Never import the service-role key here.
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copy .env.example to .env.local and fill in your Supabase project values.",
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}

/**
 * The slice of the Supabase client's `auth` namespace `ensureAnonymousSession`
 * actually uses. Deliberately narrow (rather than the full `SupabaseClient`
 * type) so tests can inject a plain fake object instead of a real client —
 * see tests/unit/supabase-client-session.test.ts.
 */
export interface MinimalAuthClient {
  auth: {
    getUser: () => Promise<{
      data: { user: { id: string } | null };
      error: { message: string } | null;
    }>;
    signInAnonymously: () => Promise<unknown>;
  };
}

/**
 * Client-side backstop for identity bootstrap. The root `proxy.ts`
 * already establishes an Anonymous Auth session server-side before any page
 * renders (ARCHITECTURE.md §4), so this should normally be a no-op; it
 * exists for the rare case a Client Component runs without having gone
 * through middleware first (e.g. cookies blocked, or a session lost between
 * requests) — same "no automatic recovery" trade-off the product already
 * accepts, just re-established immediately rather than left broken.
 *
 * Takes the client as a parameter (defaulting to a real one) purely so
 * tests can inject a fake without constructing an actual browser client.
 */
export async function ensureAnonymousSession(
  client: MinimalAuthClient = createSupabaseBrowserClient(),
): Promise<void> {
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error || !user) {
    await client.auth.signInAnonymously();
  }
}
