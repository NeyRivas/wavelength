/**
 * Keeps every non-public Sameeeish URL — /create, /w/[token]/*, and any
 * path that isn't one of the known public pages (a 404 for a mistyped
 * share link like /W/<token> included) — out of Google Analytics,
 * independently of React. "Private" below means exactly that: any path not
 * on the PUBLIC_PATHS allowlist.
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
 * 0. Isolation. Every document is either entirely public or entirely
 *    private, fixed by the URL it was loaded at: private unless its path
 *    is on PUBLIC_PATHS *and* its query string and fragment carry nothing
 *    that looks private (see `sensitive` below). A pushState/replaceState
 *    that would cross between the two is turned into a full navigation
 *    (location.assign/replace) *before* the URL changes, so a public
 *    document — the only kind that ever loads gtag.js — is never at a
 *    private URL and has no share-link (/w/…) URL in its history or
 *    performance timeline (Next.js may still prefetch /create's route data
 *    there, which carries no token or user data), and a private document
 *    never loads gtag.js at all, even after navigating to a public page.
 *    A Back/Forward that still crosses the boundary inside one document is
 *    caught on popstate and reloaded. This is what makes the protection independent
 *    of what gtag reads and which transport it uses (a <script>/<iframe>
 *    src, an attribute set via Element.prototype, innerHTML, …), none of
 *    which layer 2 can see.
 * 1. URL-synced opt-out. Google's documented `window['ga-disable-<ID>']`
 *    flag is set from the current URL immediately, after every
 *    pushState/replaceState (wrapped here first, so both Next's own patch
 *    and gtag's history listener end up calling through this wrapper) and
 *    on popstate/hashchange (registered before anyone else's listener).
 * 2. Transport filter. sendBeacon, fetch, XMLHttpRequest and <img>.src
 *    requests to Google hosts are inspected before they leave the page.
 *    Every parameter, at every level of percent-encoding, is checked for a
 *    private route; the ones that carry page content (page_location,
 *    page_referrer, title, event and user parameters) are also checked for
 *    anything shaped like a share token or record ID, and a URL in them is
 *    rebuilt from parts known to be safe: for this site, a public path plus
 *    campaign parameters (utm_*, fbclid, gclid, gbraid, wbraid) — any other
 *    query parameter and the fragment are dropped; for another site, its
 *    origin and path. A referrer that fails this becomes the bare origin;
 *    anything else that fails it — or a body that can't be inspected
 *    synchronously — drops the whole request, and so does every Google
 *    request made while the current URL is private. Requests to any other host (Supabase included) pass
 *    through untouched. Layers 1 and 2 only matter if layer 0 is bypassed
 *    (e.g. its full navigation fails, or a popstate reload is pending).
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

/**
 * The only pages Google Analytics may run on — an allowlist, not a
 * denylist, so an unknown path (a 404, e.g. a share link with a mistyped
 * /W/ or a missing slash) is treated as private rather than reported with
 * its token in page_location. tests/unit/analytics-routes.test.ts fails if
 * a page under app/ is neither listed here nor under a private prefix, so a
 * new public page has to be added here to be measured.
 */
export const PUBLIC_PATHS = [
  "/",
  "/about",
  "/contact",
  "/faq",
  "/for-couples",
  "/for-friends",
  "/how-it-works",
  "/play",
  "/play/dating-couples",
  "/play/dating-couples/36-questions-to-fall-in-love",
  "/play/dating-couples/couples-compatibility-test",
  "/play/dating-couples/date-night",
  "/play/dating-couples/getting-to-know-each-other-questions",
  "/play/friends",
  "/play/friends/friendship-test",
  "/play/friends/how-well-do-you-know-me",
  "/privacy",
  "/terms",
  "/ways-to-play",
] as const;

/** Exact match on one of PUBLIC_PATHS, optionally with a trailing slash. */
export const PUBLIC_PATH_SOURCE =
  "^(?:" +
  PUBLIC_PATHS.map((path) =>
    path === "/" ? "" : path.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
  ).join("|") +
  ")/?$";

/**
 * Known private prefixes (the ones app/robots.ts disallows). Not what
 * decides where GA runs — PUBLIC_PATHS does — but also matched, case-
 * insensitively, anywhere inside an outgoing Google request as an extra
 * signal.
 */
export const PRIVATE_PATH_SOURCE = "/(?:w/|create(?![\\w-]))";

const PUBLIC_PATHNAME = new RegExp(PUBLIC_PATH_SOURCE);

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHNAME.test(pathname);
}

/** Minimal slice of `window` the guard touches — lets tests pass a fake. */
export interface GuardWindow {
  location: {
    pathname: string;
    search?: string;
    hash?: string;
    origin: string;
    host: string;
    href?: string;
    reload?: () => void;
    assign?: (url: string) => void;
    replace?: (url: string) => void;
  };
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
  publicPathSource: string,
  privatePathSource: string,
): GuardApi {
  var GUARD_MARKER_KEY = "__sameeeishGAPrivacyGuard";
  // Off until the guard has fully installed (see syncFlag at the end).
  win["ga-disable-" + measurementId] = true;
  var loc = win.location;
  var origin = loc.origin;
  var escapedHost = loc.host.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  var publicPathname = new RegExp(publicPathSource);
  // A known private prefix anywhere in a value, as a path segment (not a
  // host: "//create.example.com" doesn't count), in any letter case.
  var privateMention = new RegExp("(?:^|[^/])" + privatePathSource, "i");
  // Every path on this site that a value names: absolute URLs anywhere in
  // it, or the whole value when it is itself a path.
  var ownUrl = new RegExp("//" + escapedHost + "(/[^?#&\\s\"'<>]*)?", "gi");
  var googleHost =
    /(^|\.)(google-analytics\.com|googletagmanager\.com|doubleclick\.net|googlesyndication\.com|googleadservices\.com|google\.(com|[a-z]{2}|co\.[a-z]{2}|com\.[a-z]{2}))$/;
  var referrerKeys: Record<string, true> = { dr: true, "ep.page_referrer": true };
  // Hit parameters that carry page content rather than gtag's own
  // technical values: page location/referrer/title/path, event name, and
  // event, user and item parameters.
  var contentKey = /^(?:dl|dr|dt|dp|en|ep\..+|up\..+|pr\d+)$/;
  // Something shaped like a share token (32+ hex digits) or a record ID
  // (UUID). Only looked for in content parameters.
  var idShape =
    /(?:^|[^0-9a-f])[0-9a-f]{32,}(?:[^0-9a-f]|$)|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  var urlLike = /^(?:https?:)?\/\/|^\//i;
  var campaignKey = /^(?:utm_[a-z0-9_]+|fbclid|gclid|gbraid|wbraid)$/i;
  var disableKey = "ga-disable-" + measurementId;

  // Set if any part of the guard failed to install: GA then stays off.
  var degraded = false;

  function isPrivatePathname(pathname: string) {
    return !publicPathname.test(pathname);
  }

  function isPrivateLocation(pathname: string, search: string, hash: string) {
    return isPrivatePathname(pathname) || sensitive(search, true) || sensitive(hash, true);
  }

  function isPrivateNow() {
    return isPrivateLocation(loc.pathname, loc.search || "", loc.hash || "");
  }

  // Layer 0: whether this document is a private one is fixed at load time.
  var privateDocument = isPrivateNow();

  function syncFlag() {
    win[disableKey] = degraded || privateDocument || isPrivateNow();
  }

  // Whether `url` (as passed to pushState/replaceState) is a private route;
  // null if it can't be resolved.
  function isPrivateUrl(url: unknown): boolean | null {
    if (url === undefined || url === null) return null;
    try {
      var target = new URL(String(url), loc.href || origin);
      return isPrivateLocation(target.pathname, target.search, target.hash);
    } catch (e) {
      return null;
    }
  }

  // Fallback for URL changes layer 0 couldn't intercept up front (Back/
  // Forward, or a failed assign): never stay in the wrong kind of document.
  function onUrlChange() {
    syncFlag();
    if (isPrivateNow() !== privateDocument) {
      try {
        if (loc.reload) loc.reload();
      } catch (e) {}
    }
  }

  // Backslashes as slashes, no "." / ".." segments, no repeated slashes
  // (except right after a scheme), so "\\W\\", "//w//" and "/x/../w/"
  // all read as "/w/".
  function normalize(text: string) {
    return text
      .replace(/\\/g, "/")
      .replace(/\/\.{1,2}(?=\/|$)/g, "")
      .replace(/(^|[^:])\/{2,}/g, "$1/");
  }

  function namesPrivatePath(text: string, ids: boolean) {
    if (privateMention.test(normalize(text))) return true;
    if (ids && idShape.test(text)) return true;
    if (text.charAt(0) === "/" && text.charAt(1) !== "/") {
      if (isPrivatePathname(normalize(text.split(/[?#]/)[0] as string))) return true;
    }
    var match;
    ownUrl.lastIndex = 0;
    while ((match = ownUrl.exec(text))) {
      if (isPrivatePathname(normalize(match[1] || "/"))) return true;
    }
    return false;
  }

  // Whether `value` names a private page (or, with `ids`, carries something
  // shaped like a token or ID) as sent or under any number of layers of
  // percent-encoding. Decoding is byte by byte, so malformed sequences
  // can't hide what follows them; a value still changing after 10 layers
  // counts as private.
  function sensitive(value: string, ids: boolean) {
    var text = value;
    for (var i = 0; i <= 10; i++) {
      if (namesPrivatePath(text, ids)) return true;
      var decoded = text.replace(/%([0-9a-f]{2})/gi, function (_m: string, hex: string) {
        return String.fromCharCode(parseInt(hex, 16));
      });
      if (decoded === text) return false;
      text = decoded;
    }
    return true;
  }

  // A URL in a content parameter, reduced to parts known to be safe: for
  // this site, a public path plus campaign parameters (fragment and any
  // other parameter dropped); for another site, its origin and path, and
  // only if nothing in the full URL looks private. null if it names a
  // private page of this site, looks private, or can't be parsed.
  function cleanUrl(value: string): string | null {
    try {
      var url = new URL(value, origin);
    } catch (e) {
      return null;
    }
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.host !== loc.host) return sensitive(value, true) ? null : url.origin + url.pathname;
    if (isPrivatePathname(url.pathname)) return null;
    var kept = new URLSearchParams();
    url.searchParams.forEach(function (v, k) {
      if (campaignKey.test(k) && !sensitive(v, true)) kept.append(k, v);
    });
    var query = kept.toString();
    // A bare path (page_path) stays a bare path.
    var relative = value.charAt(0) === "/" && value.charAt(1) !== "/";
    return (relative ? "" : url.origin) + url.pathname + (query ? "?" + query : "");
  }

  // The value to send for one hit parameter, or null to drop the request.
  function cleanParam(key: string, value: string): string | null {
    var content = contentKey.test(key);
    if (sensitive(key, content)) return null;
    var clean = content && urlLike.test(value) ? cleanUrl(value) : value;
    if (clean !== null && !sensitive(clean, content)) return clean;
    return referrerKeys[key] ? origin + "/" : null;
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
      var clean = cleanParam(key, value);
      if (clean === null) {
        drop = true;
      } else {
        out.append(key, clean);
        if (clean !== value) changed = true;
      }
    });
    if (drop) return null;
    // Re-serializing changes the encoding (e.g. %20 -> +), so only do it
    // when a value actually had to be changed.
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
      history[method] = function (this: unknown, state: unknown, unused: unknown, url?: unknown) {
        var targetPrivate = isPrivateUrl(url);
        if (targetPrivate !== null && targetPrivate !== privateDocument) {
          // Crossing the public/private boundary: leave this document
          // instead of letting its URL change.
          try {
            var next = new URL(String(url), loc.href || origin).toString();
            var navigate = method === "pushState" ? loc.assign : loc.replace;
            if (navigate) {
              navigate.call(loc, next);
              return;
            }
          } catch (e) {}
        }
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
    win.addEventListener("hashchange", onUrlChange, true);
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
  // (and so without this script) when a private route fails on the server
  // — nor in a private document.
  if (!degraded && !privateDocument) win[GUARD_MARKER_KEY] = true;

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
    JSON.stringify(PUBLIC_PATH_SOURCE) +
    "," +
    JSON.stringify(PRIVATE_PATH_SOURCE) +
    ")}catch(e){window['ga-disable-'+" +
    id +
    "]=true}"
  );
}
