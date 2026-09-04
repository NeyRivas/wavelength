import { headers } from "next/headers";

/**
 * Builds an absolute URL for the current request, using the incoming
 * `Host`/`X-Forwarded-*` headers rather than a hardcoded site-URL env var —
 * works correctly in any environment (local dev, preview deploys,
 * production) without extra configuration. Used only to render the share
 * link text; it grants no access itself (see ARCHITECTURE.md §4 — the
 * token is an invitation, not authorization).
 */
export async function absoluteUrl(path: string): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}${path}`;
}
