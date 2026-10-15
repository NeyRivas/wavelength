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
 * gtag.js loads, with three independent layers:
 *
 * 0. Isolation. gtag.js never runs in a document whose URL is private: a
 *    direct load of a private route never loads it (the component skips
 *    it), and when an already-analytics-enabled document's URL turns
 *    private — pushState/replaceState or Back/Forward — the guard forces a
 *    full page load, so the private page renders in a fresh document with
 *    no gtag.js at all. This is what makes the guarantee independent of
 *    which transport gtag happens to use (a <script>/<iframe> src, an
 *    attribute set via Element.prototype, innerHTML, …), none of which
 *    layer 2 can see.
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
 *    request, and so does every Google request made while the current
 *    URL is private. Requests to any other host (Supabase included) pass
 *    through untouched. Layers 1 and 2 cover the moment between a private
 *    URL being pushed and layer 0's reload taking effect.
 *
 * Every wrapper fails closed for Google requests if it throws, and if the
 * guard can't install itself completely it leaves GA disabled for the
 * whole document rather than half-protected.
 *
 * `installGAPrivacyGuard` is serialized with Function#toString into that
 * inline script, so it must stay fully self-contained: no imports, no
 * references to anything outside its own body.
 */

/** Set on `window` once the guard has installed completely (see below). */
export const GUARD_MARKER_KEY = "__sameeeishGAPrivacyGuard";

export function isGuardInstalled(): boolean {
  return (
    typeof window !== "undefined" &&
    (window as unknown as Record<string, unknown>)[GUARD_MARKER_KEY] === true
  );
}

/** Path prefixes that must never reach GA (same ones app/robots.ts disallows). */
export const PRIVATE_PATH_SOURCE = "/(?:w/|create)";

const PRIVATE_PATHNAME = new RegExp("^" + PRIVATE_PATH_SOURCE);

export function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PATHNAME.test(pathname);
}

/** Minimal slice of `window` the guard touches — lets tests pass a fake. */
export interface GuardWindow {
  location: { pathname: string; origin: string; host: string; reload?: () => void };
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
  var GUARD_MARKER_KEY = "__sameeeishGAPrivacyGuard";
  // Off until the guard has fully installed (see syncFlag at the end).
  win["ga-disable-" + measurementId] = true;
  var loc = win.location;
  var origin = loc.origin;
  var escapedHost = loc.host.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var privatePathname = new RegExp("^" + privatePathSource);
  // A private path at the start of a value, or right after this site's
  // host anywhere inside it (absolute URLs, URLs embedded in other text).
  var privateMention = new RegExp("(?:^|//" + escapedHost + ")" + privatePathSource);
  var googleHost =
    /(^|\.)(google-analytics\.com|googletagmanager\.com|doubleclick\.net|googlesyndication\.com|googleadservices\.com|google\.(com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2}))$/;
  var referrerKeys: Record<string, true> = { dr: true, "ep.page_referrer": true };
  var disableKey = "ga-disable-" + measurementId;

  // Set if any part of the guard failed to install: GA then stays off.
  var degraded = false;

  function isPrivateNow() {
    return privatePathname.test(loc.pathname);
  }

  function syncFlag() {
    win[disableKey] = degraded || isPrivateNow();
  }

  // Layer 0: a document that initialized GA (the component creates
  // `dataLayer` only on public routes) must not stay alive on a private
  // URL — reload so the private page gets a fresh, analytics-free document.
  function isolate() {
    if (isPrivateNow() && win.dataLayer) {
      try {
        if (loc.reload) loc.reload();
      } catch (e) {}
    }
  }

  function onUrlChange() {
    syncFlag();
    isolate();
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
    var changed = false;
    params.forEach(function (value, key) {
      if (!mentionsPrivate(value) && !mentionsPrivate(key)) {
        out.append(key, value);
      } else if (referrerKeys[key]) {
        out.append(key, origin + "/");
        changed = true;
      } else {
        drop = true;
      }
    });
    if (drop) return null;
    // Re-serializing changes the encoding (e.g. %20 -> +), so only do it
    // when a value actually had to be replaced.
    return changed ? out.toString() : query;
  }

  function sanitize(url: string, body?: unknown): { url: string; body: unknown } | null {
    if (!isGoogleUrl(url)) return { url: url, body: body };
    if (isPrivateNow()) return null;
    var parsed = new URL(url, origin);

    var search = parsed.search.slice(1);
    var query = cleanQuery(search);
    if (query === null) return null;
    var cleanUrl = query === search ? url : ((parsed.search = query), parsed.toString());

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
    return { url: cleanUrl, body: cleanBody };
  }

  // Like sanitize, but never throws: a failure drops Google requests and
  // leaves everything else alone.
  function safeSanitize(url: string, body?: unknown): { url: string; body: unknown } | null {
    try {
      return sanitize(url, body);
    } catch (e) {
      return isGoogleUrl(url) ? null : { url: url, body: body };
    }
  }

  // Each piece installs independently; any failure leaves GA disabled for
  // this document instead of running half-protected.
  function install(step: () => void) {
    try {
      step();
    } catch (e) {
      degraded = true;
    }
  }

  // Layers 0 + 1: react to every URL change, before Next's own history patch
  // (which captures whatever pushState is installed when it hydrates — this
  // one) and before gtag's history listener.
  install(function () {
    ["pushState", "replaceState"].forEach(function (method) {
      var history = win.history as unknown as Record<string, (...args: unknown[]) => unknown>;
      const original = history[method] as (...args: unknown[]) => unknown;
      history[method] = function (this: unknown) {
        try {
          return original.apply(this, arguments as unknown as unknown[]);
        } finally {
          onUrlChange();
        }
      };
    });
  });
  install(function () {
    win.addEventListener("popstate", onUrlChange, true);
  });

  // Layer 2: transport filter.
  install(function () {
    var nav = win.navigator;
    if (!nav || typeof nav.sendBeacon !== "function") return;
    var sendBeacon = nav.sendBeacon;
    nav.sendBeacon = function (url: string, data?: unknown) {
      var clean = safeSanitize(String(url), data);
      if (!clean) return true; // Report "queued" so gtag doesn't retry another way.
      return sendBeacon.call(nav, clean.url, clean.body);
    };
  });

  install(function () {
    if (typeof win.fetch !== "function") return;
    var fetchFn = win.fetch;
    var dropped = function () {
      return Promise.resolve(win.Response ? new win.Response(null, { status: 204 }) : undefined);
    };
    win.fetch = function (input: unknown, init?: { body?: unknown; method?: string }) {
      var isRequest = typeof input === "object" && input !== null && "url" in input;
      var url = isRequest ? String((input as { url: string }).url) : String(input);
      if (!isGoogleUrl(url)) return fetchFn.call(win, input, init);
      try {
        var method = String(
          (init && init.method) || (isRequest ? (input as { method: string }).method : "GET"),
        ).toUpperCase();
        var hasInitBody = !!init && "body" in init;
        // A Request object's own body can't be read synchronously: fail closed.
        if (isRequest && !hasInitBody && method !== "GET" && method !== "HEAD") return dropped();
        var clean = sanitize(url, hasInitBody ? init!.body : undefined);
        if (!clean) return dropped();
        if (clean.url === url && (!hasInitBody || clean.body === init!.body)) {
          return fetchFn.call(win, input, init);
        }
        var nextInit: Record<string, unknown> = {};
        if (init) for (var k in init) nextInit[k] = (init as Record<string, unknown>)[k];
        if (hasInitBody) nextInit.body = clean.body;
        var nextInput = isRequest && win.Request ? new win.Request(clean.url, input) : clean.url;
        return fetchFn.call(win, nextInput, nextInit);
      } catch (e) {
        return dropped();
      }
    };
  });

  install(function () {
    var xhrProto = win.XMLHttpRequest && win.XMLHttpRequest.prototype;
    if (!xhrProto) return;
    var open = xhrProto.open;
    var send = xhrProto.send;
    xhrProto.open = function (this: Record<string, unknown>, method: unknown, url: unknown) {
      var args = Array.prototype.slice.call(arguments);
      var clean = safeSanitize(String(url));
      this.__gaGuardUrl = String(url);
      this.__gaGuardDrop = !clean;
      if (clean) args[1] = clean.url;
      return open.apply(this, args);
    };
    xhrProto.send = function (this: Record<string, unknown>, body?: unknown) {
      if (this.__gaGuardDrop) return;
      if (typeof this.__gaGuardUrl === "string" && body !== undefined && body !== null) {
        var clean = safeSanitize(this.__gaGuardUrl, body);
        if (!clean) return;
        body = clean.body;
      }
      return send.call(this, body);
    };
  });

  install(function () {
    var imgProto = win.HTMLImageElement && win.HTMLImageElement.prototype;
    if (!imgProto) return;
    var srcDescriptor = Object.getOwnPropertyDescriptor(imgProto, "src");
    if (srcDescriptor && srcDescriptor.set) {
      var setSrc = srcDescriptor.set;
      Object.defineProperty(imgProto, "src", {
        configurable: true,
        enumerable: srcDescriptor.enumerable,
        get: srcDescriptor.get,
        set: function (value: unknown) {
          var clean = safeSanitize(String(value));
          if (clean) setSrc.call(this, clean.url);
        },
      });
    }
    // setAttribute lives on Element.prototype; defining it on
    // HTMLImageElement.prototype shadows it for images only. It doesn't
    // cover Element.prototype.setAttribute.call(img, …), setAttributeNS or
    // innerHTML — layer 0 is what covers those.
    var proto = imgProto as { setAttribute?: (name: string, value: string) => void };
    const setAttribute = proto.setAttribute;
    if (!setAttribute) return;
    proto.setAttribute = function (this: unknown, name: string, value: string) {
      if (String(name).toLowerCase() === "src") {
        var clean = safeSanitize(String(value));
        if (!clean) return;
        value = clean.url;
      }
      return setAttribute.call(this, name, value);
    };
  });

  syncFlag();
  // components/analytics/google-analytics.tsx only loads gtag.js when this
  // is set, so GA can never run in a document the guard isn't protecting —
  // e.g. Next's default error document, served without the root layout
  // (and so without this script) when a private route fails on the server.
  if (!degraded) win[GUARD_MARKER_KEY] = true;

  return { sanitize: sanitize };
}

/** The inline <head> script that installs the guard for this measurement ID. */
export function gaPrivacyGuardScript(measurementId: string): string {
  var id = JSON.stringify(measurementId);
  // If the guard itself throws, GA stays disabled for this document.
  return (
    "try{(" +
    installGAPrivacyGuard.toString() +
    ")(window," +
    id +
    "," +
    JSON.stringify(PRIVATE_PATH_SOURCE) +
    ")}catch(e){window['ga-disable-'+" +
    id +
    "]=true}"
  );
}
