import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "./database.types";

/**
 * Request-scoped Supabase client for Server Components and Server Actions.
 *
 * Built from the *incoming request's own cookies*, so every query it makes
 * runs as the calling participant's Anonymous Auth session and is subject
 * to RLS — see ARCHITECTURE.md §4-5. This is the only server-side client
 * the app ever constructs; the service-role key is never used in a request
 * path (ARCHITECTURE.md §9).
 *
 * `set`/`remove` can be called from a Server Component (not just a Server
 * Action or Route Handler), where writing cookies is disallowed. The
 * try/catch below matches Supabase's documented SSR pattern: token refreshes
 * from a Server Component are safely ignored there and simply re-applied on
 * the next request that *can* set cookies (a Server Action or middleware).
 */
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY. " +
        "Copy .env.example to .env.local and fill in your Supabase project values.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component render — cookies can't be set here.
          // Safe to ignore; see the doc comment above.
        }
      },
    },
  });
}
