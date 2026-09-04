import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs on every matched request (see the root `proxy.ts`) and is what
 * makes participant identity reliable everywhere else in the app:
 *
 *  1. Revalidates the caller's session against Supabase Auth via
 *     `auth.getUser()` (never `getSession()` — see lib/supabase/identity.ts
 *     for why that distinction matters) and persists any token refresh it
 *     performs along the way, via the `setAll` cookie hook below.
 *  2. If there is no valid session at all — first visit, or one that could
 *     not be refreshed (expired/revoked refresh token) — establishes a
 *     fresh Anonymous Auth session right here, server-side, before any
 *     Server Component or Server Action runs.
 *
 * By the time a page renders, `auth.uid()` is guaranteed to exist. This
 * never decides — or even looks at — whether that identity is Participant
 * A or B on any Wavelength; that is exclusively an RLS/RPC question
 * (ARCHITECTURE.md §4-5). This step only guarantees *an* identity exists to
 * check against.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Misconfigured environment. Let the request through rather than break
    // every route from middleware; lib/supabase/identity.ts's requireUserId()
    // will raise a clear, specific error the first time server code actually
    // needs a session, instead of this failing silently either way.
    return response;
  }

  // No <Database> generic here: this client only ever calls `auth.*`, never
  // queries a table, so there is nothing for that typing to protect.
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        // Cookies set on `request` above are only visible to this middleware
        // run; they must also be copied onto a fresh `response` so the
        // browser actually receives them (the standard @supabase/ssr
        // middleware pattern — rebuilding `response` here, rather than
        // reusing the original, keeps the request cookies used to build it
        // in sync with what downstream Server Components will read).
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user || error) {
    await supabase.auth.signInAnonymously();
  }

  return response;
}
