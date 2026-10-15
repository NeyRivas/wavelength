import { describe, expect, it } from "vitest";

import {
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
