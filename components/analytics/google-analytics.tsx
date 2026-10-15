"use client";

import { GoogleAnalytics as NextGoogleAnalytics, sendGAEvent } from "@next/third-parties/google";
import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

import { isGuardInstalled, isPrivatePath } from "@/lib/analytics/ga-privacy-guard";

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
 * /create and /w/[token]/* (see lib/analytics/ga-privacy-guard.ts) carry a
 * questionnaire share token or lead straight to one, and can hold personal
 * answers/aliases in the URL or page content. This component never loads
 * gtag.js or sends a page_view for them. What gtag does on its own once
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
  const excluded = isPrivatePath(pathname);
  // Fail closed: no GA in a document the <head> guard isn't protecting.
  // `false` on the server, so hydration matches and GA mounts right after.
  const guardReady = useSyncExternalStore(noSubscription, isGuardInstalled, () => false);

  useEffect(() => {
    if (!guardReady || excluded) return;
    // The first public route this document shows is reported by gtag's own
    // `config` call when <NextGoogleAnalytics> mounts — including when the
    // visit started on a private route, where GA wasn't loaded at all.
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
