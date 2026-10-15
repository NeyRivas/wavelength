/**
 * Keeps every private Sameeeish URL — /create and /w/[token]/* — out of
 * Google Analytics, independently of React.
 *
 * components/analytics/google-analytics.tsx already skips loading gtag.js
 * on a private route, but once gtag.js has loaded on a public page it stays
 * loaded across App Router navigations and sends hits on its own (GA4
 * Enhanced Measurement: history-change page_views, user_engagement,
 * scroll), each carrying the current URL — and a history-change page_view
 * for the *next* public page carries the previous, private URL as its
 * page_referrer. Nothing a React component does can be relied on for
 * that: the component can unmount (Next replaces the whole root layout
 * when a navigation throws without an error boundary above it), and a
 * render-time flag races gtag's history listener.
 *
 * So this runs as an inline <head> script, before hydration and before
 * gtag.js loads, with two independent layers:
 *
 * 1. URL-synced opt-out. Google's documented `window['ga-disable-<ID>']`
 *    flag is set from `location.pathname` immediately, after every
 *    pushState/replaceState (wrapped here first, so both Next's own patch
 *    and gtag's history listener end up calling through this wrapper) and
 *    on popstate (registered before anyone else's listener).
 * 2. Transport filter. sendBeacon, fetch, XMLHttpRequest and <img>.src
 *    requests to Google hosts are inspected before they leave the page:
 *    a referrer-type parameter pointing at a private route is replaced
 *    with the bare origin; any other parameter mentioning a private route
 *    — or a body that can't be inspected synchronously — drops the whole
 *    request. Requests to any other host (Supabase included) pass through
 *    untouched.
 *
 * `installGAPrivacyGuard` is serialized with Function#toString into that
 * inline script, so it must stay fully self-contained: no imports, no
 * references to anything outside its own body.
 */

/** Path prefixes that must never reach GA (same ones app/robots.ts disallows). */
export const PRIVATE_PATH_SOURCE = "/(?:w/|create)";

const PRIVATE_PATHNAME = new RegExp("^" + PRIVATE_PATH_SOURCE);

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATHNAME.test(pathname);
}

/** Minimal slice of `window` the guard touches — lets tests pass a fake. */
export interface GuardWindow {
  location: { pathname: string; origin: string; host: string };
  history: {
    pushState: (...args: unknown[]) => unknown;
    replaceState: (...args: unknown[]) => unknown;
  };
  addEventListener: (type: string, listener: () => void, capture?: boolean) => void;
  navigator?: { sendBeacon?: (url: string, data?: unknown) => boolean };
  fetch?: (input: unknown, init?: { body?: unknown; method?: string }) => Promise<unknown>;
  XMLHttpRequest?: { prototype: XMLHttpRequestLike };
  HTMLImageElement?: { prototype: object };
  Request?: new (input: string, init?: unknown) => { url: string; method: string };
  Response?: new (body: null, init: { status: number }) => unknown;
  [key: string]: unknown;
}

interface XMLHttpRequestLike {
  open: (...args: unknown[]) => unknown;
  send: (body?: unknown) => unknown;
}

export interface GuardApi {
  /**
   * Returns the URL/body to actually send, or `null` to drop the request.
   * Non-Google URLs are returned unchanged.
   */
  sanitize: (url: string, body?: unknown) => { url: string; body: unknown } | null;
}

export function installGAPrivacyGuard(
  win: GuardWindow,
  measurementId: string,
  privatePathSource: string,
): GuardApi {
  var loc = win.location;
  var origin = loc.origin;
  var escapedHost = loc.host.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var privatePathname = new RegExp("^" + privatePathSource);
  // A private path at the start of a value, or right after this site's
  // host anywhere inside it (absolute URLs, URLs embedded in other text).
  var privateMention = new RegExp("(?:^|//" + escapedHost + ")" + privatePathSource);
  var googleHost =
    /(^|\.)(google-analytics\.com|analytics\.google\.com|googletagmanager\.com|google\.com|doubleclick\.net)$/;
  var referrerKeys: Record<string, true> = { dr: true, "ep.page_referrer": true };
  var disableKey = "ga-disable-" + measurementId;

  function syncFlag() {
    win[disableKey] = privatePathname.test(loc.pathname);
  }

  function mentionsPrivate(value: string) {
    if (privateMention.test(value)) return true;
    try {
      return privateMention.test(decodeURIComponent(value));
    } catch (e) {
      return false;
    }
  }

  function isGoogleUrl(url: string) {
    try {
      return googleHost.test(new URL(url, origin).hostname);
    } catch (e) {
      return false;
    }
  }

  // Returns the cleaned query string, or null to drop the whole request.
  function cleanQuery(query: string): string | null {
    var params = new URLSearchParams(query);
    var out = new URLSearchParams();
    var drop = false;
    params.forEach(function (value, key) {
      if (!mentionsPrivate(value) && !mentionsPrivate(key)) {
        out.append(key, value);
      } else if (referrerKeys[key]) {
        out.append(key, origin + "/");
      } else {
        drop = true;
      }
    });
    return drop ? null : out.toString();
  }

  function sanitize(url: string, body?: unknown): { url: string; body: unknown } | null {
    if (!isGoogleUrl(url)) return { url: url, body: body };
    var parsed = new URL(url, origin);

    var query = cleanQuery(parsed.search.slice(1));
    if (query === null) return null;
    parsed.search = query;

    var cleanBody: unknown = body;
    if (body !== undefined && body !== null) {
      if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) {
        body = body.toString();
      }
      if (typeof body !== "string") return null; // Blob/FormData/stream: can't inspect, fail closed.
      var separator = body.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
      var lines = body.split(separator);
      for (var i = 0; i < lines.length; i++) {
        if (lines[i] === "") continue;
        var line = cleanQuery(lines[i] as string);
        if (line === null) return null;
        lines[i] = line;
      }
      cleanBody = lines.join(separator);
    }
    return { url: parsed.toString(), body: cleanBody };
  }

  // Layer 1: URL-synced opt-out flag.
  syncFlag();
  ["pushState", "replaceState"].forEach(function (method) {
    var history = win.history as unknown as Record<string, (...args: unknown[]) => unknown>;
    const original = history[method] as (...args: unknown[]) => unknown;
    history[method] = function (this: unknown) {
      var result = original.apply(this, arguments as unknown as unknown[]);
      syncFlag();
      return result;
    };
  });
  win.addEventListener("popstate", syncFlag, true);

  // Layer 2: transport filter.
  var nav = win.navigator;
  if (nav && typeof nav.sendBeacon === "function") {
    var sendBeacon = nav.sendBeacon;
    nav.sendBeacon = function (url: string, data?: unknown) {
      var clean = sanitize(String(url), data);
      if (!clean) return true; // Report "queued" so gtag doesn't retry another way.
      return sendBeacon.call(nav, clean.url, clean.body);
    };
  }

  if (typeof win.fetch === "function") {
    var fetchFn = win.fetch;
    win.fetch = function (input: unknown, init?: { body?: unknown; method?: string }) {
      var isRequest = typeof input === "object" && input !== null && "url" in input;
      var url = isRequest ? (input as { url: string }).url : String(input);
      if (!isGoogleUrl(url)) return fetchFn.call(win, input, init);
      var method = String(
        (init && init.method) || (isRequest ? (input as { method: string }).method : "GET"),
      ).toUpperCase();
      var hasInitBody = !!init && "body" in init;
      var clean =
        // A Request object's own body can't be read synchronously: fail closed.
        isRequest && !hasInitBody && method !== "GET" && method !== "HEAD"
          ? null
          : sanitize(url, hasInitBody ? init!.body : undefined);
      if (!clean) {
        return Promise.resolve(win.Response ? new win.Response(null, { status: 204 }) : undefined);
      }
      var nextInit: Record<string, unknown> = {};
      if (init) for (var k in init) nextInit[k] = (init as Record<string, unknown>)[k];
      if (hasInitBody) nextInit.body = clean.body;
      var nextInput = isRequest && win.Request ? new win.Request(clean.url, input) : clean.url;
      return fetchFn.call(win, nextInput, nextInit);
    };
  }

  var xhrProto = win.XMLHttpRequest && win.XMLHttpRequest.prototype;
  if (xhrProto) {
    var open = xhrProto.open;
    var send = xhrProto.send;
    xhrProto.open = function (this: Record<string, unknown>, method: unknown, url: unknown) {
      var args = Array.prototype.slice.call(arguments);
      var clean = sanitize(String(url));
      this.__gaGuardUrl = String(url);
      this.__gaGuardDrop = !clean;
      if (clean) args[1] = clean.url;
      return open.apply(this, args);
    };
    xhrProto.send = function (this: Record<string, unknown>, body?: unknown) {
      if (this.__gaGuardDrop) return;
      if (typeof this.__gaGuardUrl === "string" && body !== undefined && body !== null) {
        var clean = sanitize(this.__gaGuardUrl, body);
        if (!clean) return;
        body = clean.body;
      }
      return send.call(this, body);
    };
  }

  var imgProto = win.HTMLImageElement && win.HTMLImageElement.prototype;
  if (imgProto) {
    var srcDescriptor = Object.getOwnPropertyDescriptor(imgProto, "src");
    if (srcDescriptor && srcDescriptor.set) {
      var setSrc = srcDescriptor.set;
      Object.defineProperty(imgProto, "src", {
        configurable: true,
        enumerable: srcDescriptor.enumerable,
        get: srcDescriptor.get,
        set: function (value: unknown) {
          var clean = sanitize(String(value));
          if (clean) setSrc.call(this, clean.url);
        },
      });
    }
    var proto = imgProto as { setAttribute?: (name: string, value: string) => void };
    const setAttribute = proto.setAttribute;
    if (setAttribute) {
      proto.setAttribute = function (this: unknown, name: string, value: string) {
        if (String(name).toLowerCase() === "src") {
          var clean = sanitize(String(value));
          if (!clean) return;
          value = clean.url;
        }
        return setAttribute.call(this, name, value);
      };
    }
  }

  return { sanitize: sanitize };
}

/** The inline <head> script that installs the guard for this measurement ID. */
export function gaPrivacyGuardScript(measurementId: string): string {
  return (
    "(" +
    installGAPrivacyGuard.toString() +
    ")(window," +
    JSON.stringify(measurementId) +
    "," +
    JSON.stringify(PRIVATE_PATH_SOURCE) +
    ");"
  );
}
