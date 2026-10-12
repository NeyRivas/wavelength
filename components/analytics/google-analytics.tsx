"use client";

import { GoogleAnalytics as NextGoogleAnalytics, sendGAEvent } from "@next/third-parties/google";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Same two private path prefixes app/robots.ts already disallows. Those
 * routes carry a questionnaire share token (or lead straight to one) and
 * can hold personal answers/aliases in the URL or page content — never
 * safe to turn into a GA pageview (page_path/page_title), so this
 * component sends nothing at all for them: no script, no request, no
 * cookie, not even a redacted hit.
 */
function isExcludedPath(pathname: string): boolean {
  return pathname.startsWith("/create") || pathname.startsWith("/w/");
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
 */
export function GoogleAnalytics() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isExcludedPath(pathname)) return;
    sendGAEvent("event", "page_view", { page_path: pathname });
  }, [pathname]);

  if (!GA_MEASUREMENT_ID || isExcludedPath(pathname)) {
    return null;
  }

  return <NextGoogleAnalytics gaId={GA_MEASUREMENT_ID} />;
}
