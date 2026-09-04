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
