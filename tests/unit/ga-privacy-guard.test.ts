import { describe, expect, it } from "vitest";

import {
  GUARD_MARKER_KEY,
  type GuardWindow,
  PRIVATE_PATH_SOURCE,
  PUBLIC_PATH_SOURCE,
  gaPrivacyGuardScript,
  installGAPrivacyGuard,
  isPublicPath,
} from "../../lib/analytics/ga-privacy-guard";

const ID = "G-TEST123";
const ORIGIN = "https://sameeeish.com";
const COLLECT = "https://region1.google-analytics.com/g/collect";

function fakeWindow(pathname: string) {
  const listeners: Record<string, Array<() => void>> = {};
  const beacons: Array<{ url: string; data: unknown }> = [];
  const win: GuardWindow = {
    location: { pathname, origin: ORIGIN, host: "sameeeish.com" },
    history: {
      pushState: (_state: unknown, _title: unknown, url: unknown) => {
        win.location.pathname = new URL(String(url), ORIGIN).pathname;
      },
      replaceState: (_state: unknown, _title: unknown, url: unknown) => {
        win.location.pathname = new URL(String(url), ORIGIN).pathname;
      },
    },
    addEventListener: (type, listener) => {
      (listeners[type] ??= []).push(listener);
    },
    navigator: {
      sendBeacon: (url: string, data?: unknown) => {
        beacons.push({ url, data });
        return true;
      },
    },
  };
  return { win, listeners, beacons };
}

function hit(params: Record<string, string>) {
  return COLLECT + "?" + new URLSearchParams({ v: "2", tid: ID, ...params }).toString();
}

describe("isPublicPath", () => {
  it("allows the known public pages, with or without a trailing slash", () => {
    for (const path of ["/", "/faq", "/faq/", "/ways-to-play", "/play/dating-couples/date-night"]) {
      expect(isPublicPath(path)).toBe(true);
    }
  });

  it("treats private routes and every unknown path (404s) as not public", () => {
    for (const path of [
      "/create",
      "/w/abc",
      "/w/abc/result",
      "/W/abc", // mistyped share link
      "/wabc0123456789", // share link that lost its slash
      "/%77/abc",
      "/play/unknown",
      "/faq/extra",
      "//faq",
      "/FAQ",
    ]) {
      expect(isPublicPath(path)).toBe(false);
    }
  });
});

describe("installGAPrivacyGuard: opt-out flag", () => {
  it("follows the URL through pushState, replaceState and popstate", () => {
    const { win, listeners } = fakeWindow("/");
    installGAPrivacyGuard(win, ID, PUBLIC_PATH_SOURCE, PRIVATE_PATH_SOURCE);
    expect(win[`ga-disable-${ID}`]).toBe(false);

    win.history.pushState({}, "", "/w/secret-token/answer");
    expect(win[`ga-disable-${ID}`]).toBe(true);

    win.history.replaceState({}, "", "/faq");
    expect(win[`ga-disable-${ID}`]).toBe(false);

    win.location.pathname = "/create";
    listeners.popstate?.forEach((listener) => listener());
    expect(win[`ga-disable-${ID}`]).toBe(true);
  });

  it("is set immediately on a private first load", () => {
    const { win } = fakeWindow("/w/secret-token");
    installGAPrivacyGuard(win, ID, PUBLIC_PATH_SOURCE, PRIVATE_PATH_SOURCE);
    expect(win[`ga-disable-${ID}`]).toBe(true);
  });
});

describe("installGAPrivacyGuard: transport filter", () => {
  const { win, beacons } = fakeWindow("/");
  const { sanitize } = installGAPrivacyGuard(win, ID, PUBLIC_PATH_SOURCE, PRIVATE_PATH_SOURCE);

  it("passes public hits through unchanged in content", () => {
    const url = hit({ en: "page_view", dl: `${ORIGIN}/faq`, dr: "https://facebook.com/" });
    const clean = sanitize(url);
    expect(clean).not.toBeNull();
    const params = new URL(clean!.url).searchParams;
    expect(params.get("dl")).toBe(`${ORIGIN}/faq`);
    expect(params.get("dr")).toBe("https://facebook.com/");
  });

  it("drops any hit whose location is a private route", () => {
    expect(sanitize(hit({ en: "user_engagement", dl: `${ORIGIN}/w/secret-token/answer` }))).toBe(
      null,
    );
    expect(sanitize(hit({ en: "page_view", dl: `${ORIGIN}/create?game=x` }))).toBe(null);
    expect(sanitize(hit({ en: "page_view", "ep.page_path": "/w/secret-token" }))).toBe(null);
  });

  it("replaces a private referrer with the bare origin and keeps the hit", () => {
    const clean = sanitize(
      hit({ en: "page_view", dl: `${ORIGIN}/faq`, dr: `${ORIGIN}/w/secret-token/result` }),
    );
    expect(clean).not.toBeNull();
    expect(new URL(clean!.url).searchParams.get("dr")).toBe(`${ORIGIN}/`);
    expect(clean!.url).not.toContain("secret-token");
  });

  it("inspects every line of a batched POST body", () => {
    const publicLine = new URLSearchParams({ en: "scroll", dl: `${ORIGIN}/faq` }).toString();
    const privateLine = new URLSearchParams({
      en: "user_engagement",
      dl: `${ORIGIN}/w/secret-token`,
    }).toString();
    expect(sanitize(COLLECT + "?v=2", `${publicLine}\r\n${privateLine}`)).toBe(null);
    expect(sanitize(COLLECT + "?v=2", `${publicLine}\r\n${publicLine}`)).not.toBeNull();
  });

  it("catches a private URL that is encoded a second time", () => {
    const doubleEncoded = encodeURIComponent(`${ORIGIN}/w/secret-token`);
    expect(sanitize(hit({ en: "click", "ep.link_url": doubleEncoded }))).toBe(null);
  });

  it("fails closed on a body it can't read synchronously", () => {
    expect(sanitize(hit({ en: "page_view", dl: `${ORIGIN}/faq` }), new Blob(["x"]))).toBe(null);
  });

  it("never touches non-Google requests", () => {
    const supabase = "https://xyz.supabase.co/rest/v1/rpc/join?token=/w/secret-token";
    expect(sanitize(supabase, "/w/secret-token")).toEqual({
      url: supabase,
      body: "/w/secret-token",
    });
  });

  it("drops private beacons without sending and forwards public ones", () => {
    beacons.length = 0;
    win.navigator!.sendBeacon!(hit({ en: "scroll", dl: `${ORIGIN}/w/secret-token` }));
    expect(beacons).toHaveLength(0);
    win.navigator!.sendBeacon!(hit({ en: "scroll", dl: `${ORIGIN}/faq` }));
    expect(beacons).toHaveLength(1);
  });
});

describe("gaPrivacyGuardScript", () => {
  it("serializes into a self-contained script that installs the guard", () => {
    const { win } = fakeWindow("/w/secret-token");
    const run = new Function("window", gaPrivacyGuardScript(ID));
    run(win);
    expect(win[`ga-disable-${ID}`]).toBe(true);
  });
});

describe("installGAPrivacyGuard: isolation (layer 0)", () => {
  function isolated(pathname: string) {
    const fake = fakeWindow(pathname);
    const navigations: string[] = [];
    let reloads = 0;
    fake.win.location.href = ORIGIN + pathname;
    fake.win.location.assign = (url: string) => navigations.push("assign " + url);
    fake.win.location.replace = (url: string) => navigations.push("replace " + url);
    fake.win.location.reload = () => {
      reloads++;
    };
    installGAPrivacyGuard(fake.win, ID, PUBLIC_PATH_SOURCE, PRIVATE_PATH_SOURCE);
    return { ...fake, navigations, reloads: () => reloads };
  }

  it("turns a public-to-private pushState into a full navigation before the URL changes", () => {
    const { win, navigations } = isolated("/play");
    win.history.pushState({}, "", "/create?game=x");
    expect(navigations).toEqual([`assign ${ORIGIN}/create?game=x`]);
    // The public document's URL never became private.
    expect(win.location.pathname).toBe("/play");
    expect(win[`ga-disable-${ID}`]).toBe(false);
  });

  it("uses location.replace for replaceState, keeping history length the same", () => {
    const { win, navigations } = isolated("/");
    win.history.replaceState({}, "", "/w/secret-token");
    expect(navigations).toEqual([`replace ${ORIGIN}/w/secret-token`]);
    expect(win.location.pathname).toBe("/");
  });

  it("leaves a private document for a public route the same way", () => {
    const { win, navigations } = isolated("/w/secret-token/result");
    win.history.pushState({}, "", "/play");
    expect(navigations).toEqual([`assign ${ORIGIN}/play`]);
    expect(win.location.pathname).toBe("/w/secret-token/result");
  });

  it("keeps same-kind navigations client-side (no reload loops)", () => {
    const { win, navigations, reloads } = isolated("/");
    win.history.pushState({}, "", "/faq");
    win.history.replaceState({}, "", "/faq");
    win.history.pushState({}, "", "/play/friends?x=1");
    expect(win.location.pathname).toBe("/play/friends");
    const priv = isolated("/w/secret-token");
    priv.win.history.replaceState({}, "", "/w/secret-token");
    priv.win.history.pushState({}, "", "/w/secret-token/answer");
    priv.win.history.pushState({}, "", "/create");
    expect([...navigations, ...priv.navigations]).toEqual([]);
    expect(reloads() + priv.reloads()).toBe(0);
  });

  it("reloads when Back/Forward lands on the other kind of URL", () => {
    const { win, listeners, reloads } = isolated("/faq");
    win.location.pathname = "/w/secret-token/result";
    listeners.popstate?.forEach((listener) => listener());
    expect(reloads()).toBe(1);
    expect(win[`ga-disable-${ID}`]).toBe(true);
  });

  it("falls back to letting the URL change, then reloading, if it can't navigate", () => {
    const { win } = fakeWindow("/");
    let reloads = 0;
    win.location.reload = () => {
      reloads++;
    };
    installGAPrivacyGuard(win, ID, PUBLIC_PATH_SOURCE, PRIVATE_PATH_SOURCE); // no assign/replace available
    win.history.pushState({}, "", "/create");
    expect(win.location.pathname).toBe("/create");
    expect(win[`ga-disable-${ID}`]).toBe(true);
    expect(reloads).toBe(1);
  });

  it("keeps GA disabled for the whole life of a private document", () => {
    const { win } = fakeWindow("/w/secret-token");
    installGAPrivacyGuard(win, ID, PUBLIC_PATH_SOURCE, PRIVATE_PATH_SOURCE); // no assign: URL changes in place
    win.history.pushState({}, "", "/play");
    expect(win[`ga-disable-${ID}`]).toBe(true);
    // ...and never tells the component it may load gtag.js.
    expect(win[GUARD_MARKER_KEY]).toBeUndefined();
  });
});

describe("installGAPrivacyGuard: unknown paths (404s) are private", () => {
  const TOKEN = "0123456789abcdef0123456789abcdef";

  it("keeps GA off in a document loaded at a mistyped share link", () => {
    for (const path of [`/W/${TOKEN}`, `/w${TOKEN}`, "/play/unknown"]) {
      const { win } = fakeWindow(path);
      installGAPrivacyGuard(win, ID, PUBLIC_PATH_SOURCE, PRIVATE_PATH_SOURCE);
      expect(win[`ga-disable-${ID}`]).toBe(true);
      expect(win[GUARD_MARKER_KEY]).toBeUndefined();
    }
  });

  it("drops a hit that names an unlisted path on this site, and scrubs it as a referrer", () => {
    const { win } = fakeWindow("/");
    const { sanitize } = installGAPrivacyGuard(win, ID, PUBLIC_PATH_SOURCE, PRIVATE_PATH_SOURCE);
    expect(sanitize(hit({ en: "page_view", dl: `${ORIGIN}/W/${TOKEN}` }))).toBe(null);
    expect(sanitize(hit({ en: "page_view", dl: `${ORIGIN}/w${TOKEN}` }))).toBe(null);
    expect(sanitize(hit({ en: "page_view", "ep.page_path": "/play/unknown" }))).toBe(null);
    const clean = sanitize(
      hit({ en: "page_view", dl: `${ORIGIN}/faq`, dr: `${ORIGIN}/W/${TOKEN}` }),
    );
    expect(clean).not.toBeNull();
    expect(clean!.url).not.toContain(TOKEN);
    expect(new URL(clean!.url).searchParams.get("dr")).toBe(`${ORIGIN}/`);
  });

  it("still lets public hits through, query strings included", () => {
    const { win } = fakeWindow("/");
    const { sanitize } = installGAPrivacyGuard(win, ID, PUBLIC_PATH_SOURCE, PRIVATE_PATH_SOURCE);
    const url = hit({
      en: "page_view",
      dl: `${ORIGIN}/?utm_source=fb`,
      dr: "https://l.facebook.com/",
    });
    expect(sanitize(url)).toEqual({ url, body: undefined });
    expect(sanitize(hit({ en: "page_view", "ep.page_path": "/play/friends" }))).not.toBeNull();
  });

  it("isolates a public document from a 404 the same way as from a private route", () => {
    const { win } = fakeWindow("/play");
    const navigations: string[] = [];
    win.location.href = ORIGIN + "/play";
    win.location.assign = (url: string) => navigations.push(url);
    installGAPrivacyGuard(win, ID, PUBLIC_PATH_SOURCE, PRIVATE_PATH_SOURCE);
    win.history.pushState({}, "", `/W/${TOKEN}`);
    expect(navigations).toEqual([`${ORIGIN}/W/${TOKEN}`]);
    expect(win.location.pathname).toBe("/play");
  });
});

describe("installGAPrivacyGuard: hardening", () => {
  it("drops every Google request while the current URL is private", () => {
    const { win } = fakeWindow("/w/secret-token");
    const { sanitize } = installGAPrivacyGuard(win, ID, PUBLIC_PATH_SOURCE, PRIVATE_PATH_SOURCE);
    // Even one that names only a public page.
    expect(sanitize(hit({ en: "page_view", dl: `${ORIGIN}/faq` }))).toBe(null);
    expect(sanitize("https://xyz.supabase.co/rest/v1/x")).not.toBeNull();
  });

  it("leaves untouched hits byte-for-byte as gtag encoded them", () => {
    const { win } = fakeWindow("/");
    const { sanitize } = installGAPrivacyGuard(win, ID, PUBLIC_PATH_SOURCE, PRIVATE_PATH_SOURCE);
    const url = `${COLLECT}?v=2&en=page_view&dt=Sameeeish%20FAQ&dl=${encodeURIComponent(`${ORIGIN}/faq`)}`;
    const body = "en=scroll&dt=Sameeeish%20FAQ\r\nen=user_engagement&_et=12";
    expect(sanitize(url, body)).toEqual({ url, body });
  });

  it("covers country-code Google domains", () => {
    const { win } = fakeWindow("/");
    const { sanitize } = installGAPrivacyGuard(win, ID, PUBLIC_PATH_SOURCE, PRIVATE_PATH_SOURCE);
    const leak = `?dl=${encodeURIComponent(`${ORIGIN}/w/secret-token`)}`;
    expect(sanitize("https://www.google.es/ads/ga-audiences" + leak)).toBe(null);
    expect(sanitize("https://www.google.co.uk/ads/ga-audiences" + leak)).toBe(null);
    expect(sanitize("https://stats.g.doubleclick.net/g/collect" + leak)).toBe(null);
  });

  it("leaves GA disabled if part of the guard fails to install", () => {
    const { win } = fakeWindow("/faq");
    win.addEventListener = () => {
      throw new Error("boom");
    };
    installGAPrivacyGuard(win, ID, PUBLIC_PATH_SOURCE, PRIVATE_PATH_SOURCE);
    expect(win[`ga-disable-${ID}`]).toBe(true);
    win.history.pushState({}, "", "/play");
    expect(win[`ga-disable-${ID}`]).toBe(true);
    // ...and doesn't mark itself installed, so the component won't load gtag.js.
    expect(win[GUARD_MARKER_KEY]).toBeUndefined();
  });

  it("marks itself installed only after installing completely", () => {
    const { win } = fakeWindow("/faq");
    expect(win[GUARD_MARKER_KEY]).toBeUndefined();
    installGAPrivacyGuard(win, ID, PUBLIC_PATH_SOURCE, PRIVATE_PATH_SOURCE);
    expect(win[GUARD_MARKER_KEY]).toBe(true);
  });

  it("leaves GA disabled if the guard script throws outright", () => {
    const win = { location: null } as unknown as GuardWindow;
    new Function("window", gaPrivacyGuardScript(ID))(win);
    expect(win[`ga-disable-${ID}`]).toBe(true);
  });
});
