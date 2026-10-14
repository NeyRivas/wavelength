"use client";

import { GoogleAnalytics as NextGoogleAnalytics, sendGAEvent } from "@next/third-parties/google";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Same two private path prefixes app/robots.ts already disallows. Those
 * routes carry a questionnaire share token (or lead straight to one) and
 * can hold personal answers/aliases in the URL or page content — never
 * safe to turn into a GA hit (page_path/page_location/page_title), so this
 * component sends nothing at all for them: no script, no request, no
 * cookie, not even a redacted hit.
 */
function isExcludedPath(pathname: string): boolean {
  return pathname.startsWith("/create") || pathname.startsWith("/w/");
}

/**
 * Not rendering the script only covers a *fresh load* of a private route.
 * Once gtag.js has loaded on a public page it stays loaded across App
 * Router client-side navigations, and GA4's own Enhanced Measurement then
 * sends hits on its own — a history-change page_view, plus
 * user_engagement/scroll — each carrying the current page_location. Real
 * GA data showed exactly that: page_views for /create?game=… despite the
 * exclusion above. Google's documented opt-out flag
 * (`window['ga-disable-<ID>'] = true`) makes gtag drop every hit while
 * it's set, so it's flipped on for private routes and back off for public
 * ones. It's set during render rather than in an effect on purpose: render
 * of the new route happens before the App Router commits and pushes the
 * new URL into history, so the flag is already in place by the time GA's
 * history listener fires.
 */
function setGADisabled(disabled: boolean) {
  if (!GA_MEASUREMENT_ID || typeof window === "undefined") return;
  (window as unknown as Record<string, unknown>)[`ga-disable-${GA_MEASUREMENT_ID}`] = disabled;
}

/**
 * The official GoogleAnalytics component only fires its one automatic
 * `gtag('config', ...)` pageview on mount — it has no listener for
 * subsequent App Router client-side navigations (confirmed by reading
 * node_modules/@next/third-parties' own source). The effect below covers
 * those later navigations manually via the package's own sendGAEvent,
 * skipping the very first pathname so that initial automatic pageview
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
  const isFirstRender = useRef(true);
  const excluded = isExcludedPath(pathname);

  setGADisabled(excluded);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (excluded) return;
    sendGAEvent("event", "page_view", { page_path: pathname });
  }, [pathname, excluded]);

  if (!GA_MEASUREMENT_ID || excluded) {
    return null;
  }

  return <NextGoogleAnalytics gaId={GA_MEASUREMENT_ID} />;
}
