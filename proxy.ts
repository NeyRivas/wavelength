import type { NextRequest } from "next/server";

import { updateSession } from "./lib/supabase/proxy";

// Next.js's "proxy" file convention (the successor to the deprecated
// `middleware.ts`) — same request-interception mechanism, new file/export
// name. The actual logic lives in lib/supabase/proxy.ts.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Skip static assets and image optimization requests — establishing an
    // identity for those has no meaning and would just add latency.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
