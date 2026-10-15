import { describe, expect, it } from "vitest";

import {
  GUARD_MARKER_KEY,
  type GuardWindow,
  PRIVATE_PATH_SOURCE,
  gaPrivacyGuardScript,
  installGAPrivacyGuard,
  isPrivatePath,
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

describe("isPrivatePath", () => {
  it("matches /create and /w/ routes only", () => {
    expect(isPrivatePath("/create")).toBe(true);
    expect(isPrivatePath("/create?game=x")).toBe(true);
    expect(isPrivatePath("/w/abc")).toBe(true);
    expect(isPrivatePath("/w/abc/result")).toBe(true);
    expect(isPrivatePath("/")).toBe(false);
    expect(isPrivatePath("/faq")).toBe(false);
    expect(isPrivatePath("/ways-to-play")).toBe(false);
    expect(isPrivatePath("/play/dating-couples")).toBe(false);
  });
});

describe("installGAPrivacyGuard: opt-out flag", () => {
  it("follows the URL through pushState, replaceState and popstate", () => {
    const { win, listeners } = fakeWindow("/");
    installGAPrivacyGuard(win, ID, PRIVATE_PATH_SOURCE);
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
    installGAPrivacyGuard(win, ID, PRIVATE_PATH_SOURCE);
    expect(win[`ga-disable-${ID}`]).toBe(true);
  });
});

describe("installGAPrivacyGuard: transport filter", () => {
  const { win, beacons } = fakeWindow("/");
  const { sanitize } = installGAPrivacyGuard(win, ID, PRIVATE_PATH_SOURCE);

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
  function withReload(pathname: string, dataLayer: boolean) {
    const fake = fakeWindow(pathname);
    let reloads = 0;
    fake.win.location.reload = () => {
      reloads++;
    };
    if (dataLayer) fake.win.dataLayer = [];
    installGAPrivacyGuard(fake.win, ID, PRIVATE_PATH_SOURCE);
    return { ...fake, reloads: () => reloads };
  }

  it("reloads when a GA-enabled document's URL turns private", () => {
    const { win, reloads } = withReload("/", true);
    win.history.pushState({}, "", "/faq");
    expect(reloads()).toBe(0);
    win.history.pushState({}, "", "/create?game=x");
    expect(reloads()).toBe(1);
    win.history.replaceState({}, "", "/w/secret-token");
    expect(reloads()).toBe(2);
  });

  it("reloads on Back/Forward into a private URL", () => {
    const { win, listeners, reloads } = withReload("/faq", true);
    win.location.pathname = "/w/secret-token/result";
    listeners.popstate?.forEach((listener) => listener());
    expect(reloads()).toBe(1);
  });

  it("never reloads a document that hasn't initialized GA (no loop)", () => {
    const { win, reloads } = withReload("/w/secret-token", false);
    win.history.replaceState({}, "", "/w/secret-token");
    win.history.pushState({}, "", "/create");
    expect(reloads()).toBe(0);
  });
});

describe("installGAPrivacyGuard: hardening", () => {
  it("drops every Google request while the current URL is private", () => {
    const { win } = fakeWindow("/w/secret-token");
    const { sanitize } = installGAPrivacyGuard(win, ID, PRIVATE_PATH_SOURCE);
    // Even one that names only a public page.
    expect(sanitize(hit({ en: "page_view", dl: `${ORIGIN}/faq` }))).toBe(null);
    expect(sanitize("https://xyz.supabase.co/rest/v1/x")).not.toBeNull();
  });

  it("leaves untouched hits byte-for-byte as gtag encoded them", () => {
    const { win } = fakeWindow("/");
    const { sanitize } = installGAPrivacyGuard(win, ID, PRIVATE_PATH_SOURCE);
    const url = `${COLLECT}?v=2&en=page_view&dt=Sameeeish%20FAQ&dl=${encodeURIComponent(`${ORIGIN}/faq`)}`;
    const body = "en=scroll&dt=Sameeeish%20FAQ\r\nen=user_engagement&_et=12";
    expect(sanitize(url, body)).toEqual({ url, body });
  });

  it("covers country-code Google domains", () => {
    const { win } = fakeWindow("/");
    const { sanitize } = installGAPrivacyGuard(win, ID, PRIVATE_PATH_SOURCE);
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
    installGAPrivacyGuard(win, ID, PRIVATE_PATH_SOURCE);
    expect(win[`ga-disable-${ID}`]).toBe(true);
    win.history.pushState({}, "", "/play");
    expect(win[`ga-disable-${ID}`]).toBe(true);
    // ...and doesn't mark itself installed, so the component won't load gtag.js.
    expect(win[GUARD_MARKER_KEY]).toBeUndefined();
  });

  it("marks itself installed only after installing completely", () => {
    const { win } = fakeWindow("/faq");
    expect(win[GUARD_MARKER_KEY]).toBeUndefined();
    installGAPrivacyGuard(win, ID, PRIVATE_PATH_SOURCE);
    expect(win[GUARD_MARKER_KEY]).toBe(true);
  });

  it("leaves GA disabled if the guard script throws outright", () => {
    const win = { location: null } as unknown as GuardWindow;
    new Function("window", gaPrivacyGuardScript(ID))(win);
    expect(win[`ga-disable-${ID}`]).toBe(true);
  });
});
