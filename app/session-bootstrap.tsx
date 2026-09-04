"use client";

import { useEffect } from "react";

import { createSupabaseBrowserClient, ensureAnonymousSession } from "@/lib/supabase/client";

/**
 * Renders nothing. Pure identity plumbing — the client-side backstop
 * described in lib/supabase/client.ts's `ensureAnonymousSession()` doc
 * comment. Mounted once in the root layout (app/layout.tsx).
 */
export function SessionBootstrap() {
  useEffect(() => {
    ensureAnonymousSession(createSupabaseBrowserClient()).catch(() => {
      // Best-effort only: middleware already established a session
      // server-side for the initial render. A later Server Action will
      // surface a clear error (UnauthenticatedError) if identity is somehow
      // still missing by the time one actually needs it.
    });
  }, []);

  return null;
}
