"use client";

import { GoogleAnalytics as NextGoogleAnalytics, sendGAEvent } from "@next/third-parties/google";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { isGuardInstalled, isPublicPath } from "@/lib/analytics/ga-privacy-guard";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Module-level rather than a ref so it survives this component unmounting
// and remounting (e.g. Next swapping the root layout for an error page
// after a failed navigation): only the first public pathname this document
// shows is covered by gtag's own `config` pageview, and a later remount must
// still report its route instead of skipping it.
let initialPageViewHandled = false;

// The guard installs once, before hydration, and never changes afterwards.
const noSubscription = () => () => {};

/**
 * GA only runs on the public pages listed in PUBLIC_PATHS
 * (lib/analytics/ga-privacy-guard.ts). /create and /w/[token]/* carry a
 * questionnaire share token or lead straight to one, and can hold personal
 * answers/aliases in the URL or page content; any other unlisted path (a
 * 404, e.g. a mistyped share link) could carry a token too. This component
 * never loads gtag.js or sends a page_view for any of them. What gtag does on its own once
 * it's loaded — and everything that must still hold if this component
 * unmounts — is handled by the guard script the root layout puts in
 * <head>, not here.
 *
 * The official GoogleAnalytics component only fires its one automatic
 * `gtag('config', ...)` pageview on mount — it has no listener for
 * subsequent App Router client-side navigations (confirmed by reading
 * node_modules/@next/third-parties' own source). The effect below covers
 * those later navigations manually via the package's own sendGAEvent,
 * skipping the first public pathname so that initial automatic pageview
 * isn't double-counted. It only ever sends `page_path`, never a title,
 * query string, or anything else that could carry a token.
 *
 * This assumes the GA4 data stream's Enhanced Measurement setting "Page
 * changes based on browser history events" is turned OFF — otherwise GA
 * sends its own page_view on every navigation too and each one is counted
 * twice.
 */
export function GoogleAnalytics() {
  const pathname = usePathname();
  // Anything not on the public allowlist — private routes and 404s alike.
  const excluded = !isPublicPath(pathname);
  // Fail closed: no GA in a document the <head> guard isn't protecting, or
  // in one that was loaded at a private URL (the guard never marks those).
  // `false` on the server, so hydration matches and GA mounts right after.
  const guardReady = useSyncExternalStore(noSubscription, isGuardInstalled, () => false);

  useEffect(() => {
    if (!guardReady || excluded) return;
    // The route this (public) document was loaded at is reported by gtag's
    // own `config` call when <NextGoogleAnalytics> mounts.
    if (!initialPageViewHandled) {
      initialPageViewHandled = true;
      return;
    }
    sendGAEvent("event", "page_view", { page_path: pathname });
  }, [pathname, excluded, guardReady]);

  if (!GA_MEASUREMENT_ID || excluded || !guardReady) {
    return null;
  }

  return <NextGoogleAnalytics gaId={GA_MEASUREMENT_ID} />;
}
