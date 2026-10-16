import { describe, expect, it } from "vitest";

import {
  GUARD_MARKER_KEY,
  type GuardWindow,
  PRIVATE_PATH_SOURCE,
  PUBLIC_PATHS,
  PUBLIC_PATH_SOURCE,
  gaPrivacyGuardScript,
  installGAPrivacyGuard,
  isPublicPath,
} from "../../lib/analytics/ga-privacy-guard";

const ID = "G-TEST123";
const ORIGIN = "https://sameeeish.com";
const COLLECT = "https://region1.google-analytics.com/g/collect";

/** A fake window at `path` (which may carry a query string and fragment). */
function fakeWindow(path: string) {
  const listeners: Record<string, Array<() => void>> = {};
  const beacons: Array<{ url: string; data: unknown }> = [];
  const goTo = (url: unknown) => {
    const { pathname, search, hash } = new URL(String(url), ORIGIN);
    Object.assign(win.location, { pathname, search, hash });
  };
  const win: GuardWindow = {
    location: { pathname: "/", search: "", hash: "", origin: ORIGIN, host: "sameeeish.com" },
    history: {
      pushState: (_state: unknown, _title: unknown, url: unknown) => goTo(url),
      replaceState: (_state: unknown, _title: unknown, url: unknown) => goTo(url),
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
  goTo(path);
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

describe("installGAPrivacyGuard: private data in query strings, fragments and encodings", () => {
  // Made-up values only: a token-shaped hex string that isn't any real share
  // token, a record-ID-shaped UUID, and a share path that isn't token-shaped
  // at all (the filter mustn't depend on the token's format).
  const FAKE_TOKEN = "0123456789abcdef0123456789abcdef";
  const FAKE_UUID = "00000000-0000-4000-8000-000000000000";
  const FAKE_SHARE = "/w/not-a-real-token";

  const { win } = fakeWindow("/");
  const { sanitize } = installGAPrivacyGuard(win, ID, PUBLIC_PATH_SOURCE, PRIVATE_PATH_SOURCE);

  /** The params of the cleaned hit, or null if it was dropped. */
  function sent(params: Record<string, string>) {
    const clean = sanitize(hit(params));
    return clean && new URL(clean.url).searchParams;
  }

  function encodeTimes(value: string, times: number) {
    for (let i = 0; i < times; i++) value = encodeURIComponent(value);
    return value;
  }

  const PRIVATE_VARIANTS = [
    FAKE_SHARE,
    "/W/not-a-real-token",
    "//w//not-a-real-token",
    "\\w\\not-a-real-token",
    "\\/w\\/not-a-real-token", // JSON-escaped
    "/./w/not-a-real-token",
    "/play/../w/not-a-real-token",
    "/%77/not-a-real-token",
    "%2Fw%2Fnot-a-real-token",
    "/create",
    "/Create/",
    "/create?game=x",
    `${ORIGIN}/w/not-a-real-token/result`,
    `${ORIGIN}//W/not-a-real-token`,
    `${ORIGIN}/w${FAKE_TOKEN}`, // a 404 on this site
    `//sameeeish.com/w/not-a-real-token`,
  ];

  it("keeps a page_view on a public page but strips private data from its query string", () => {
    for (const query of [
      `t=${FAKE_TOKEN}`,
      `ref=${FAKE_SHARE}`,
      `ref=${encodeURIComponent(ORIGIN + FAKE_SHARE)}`,
      `next=${encodeTimes(FAKE_SHARE, 3)}`,
      `id=${FAKE_UUID}`,
      "session=anything", // unknown parameters aren't kept, whatever they hold
    ]) {
      const params = sent({ en: "page_view", dl: `${ORIGIN}/faq?${query}` });
      expect(params?.get("dl"), query).toBe(`${ORIGIN}/faq`);
    }
  });

  it("strips the fragment, whatever it holds", () => {
    for (const hash of [FAKE_SHARE, `token=${FAKE_TOKEN}`, "section"]) {
      expect(sent({ en: "page_view", dl: `${ORIGIN}/faq#${hash}` })?.get("dl"), hash).toBe(
        `${ORIGIN}/faq`,
      );
    }
  });

  it("keeps campaign parameters exactly as sent", () => {
    const dl = `${ORIGIN}/play/friends?utm_source=newsletter&utm_medium=email&utm_campaign=fall_launch&utm_content=a&utm_term=b`;
    for (const url of [
      dl,
      `${ORIGIN}/?fbclid=IwAR0FakeClickId_x-y`,
      `${ORIGIN}/for-couples?gclid=Cj0KCQFakeClickId&gbraid=0AAAFake&wbraid=FakeW`,
    ]) {
      const request = hit({ en: "page_view", dl: url, dr: "https://www.google.com/" });
      expect(sanitize(request), url).toEqual({ url: request, body: undefined });
    }
  });

  it("keeps campaign parameters but drops the rest, and any campaign value that looks private", () => {
    const params = sent({
      en: "page_view",
      dl: `${ORIGIN}/?utm_source=ig&ref=friend&utm_campaign=${encodeURIComponent(FAKE_SHARE)}&utm_content=${FAKE_TOKEN}&gclid=abc#top`,
    });
    expect(params?.get("dl")).toBe(`${ORIGIN}/?utm_source=ig&gclid=abc`);
  });

  it("catches a private path or token under any number of layers of percent-encoding", () => {
    for (let times = 0; times <= 8; times++) {
      for (const secret of [ORIGIN + FAKE_SHARE, FAKE_SHARE, FAKE_TOKEN]) {
        const value = encodeTimes(secret, times);
        const label = `${secret} x${times}`;
        // As its own content parameter: the hit is dropped.
        expect(sent({ en: "click", "ep.link_url": value }), label).toBe(null);
        expect(sent({ en: "page_view", dt: `Sameeeish ${value}` }), label).toBe(null);
        // As a referrer: scrubbed to the origin.
        expect(sent({ en: "page_view", dl: `${ORIGIN}/`, dr: value })?.get("dr"), label).toBe(
          `${ORIGIN}/`,
        );
        // Inside page_location's query string: stripped.
        expect(
          sent({ en: "page_view", dl: `${ORIGIN}/faq?utm_term=${value}` })?.get("dl"),
          label,
        ).toBe(`${ORIGIN}/faq`);
      }
      // Private paths are also caught in parameters that aren't content.
      expect(sent({ en: "page_view", xyz: encodeTimes(ORIGIN + FAKE_SHARE, times) })).toBe(null);
    }
  });

  it("fails closed on a value still decoding after 10 layers", () => {
    expect(sent({ en: "click", "ep.note": encodeTimes("%", 10) + "harmless" })).not.toBeNull();
    expect(sent({ en: "click", "ep.note": encodeTimes("%", 11) + "harmless" })).toBe(null);
  });

  it("isn't fooled by malformed percent-encoding around a private path", () => {
    for (const value of [
      `%E0%A4%${FAKE_SHARE}`,
      `%ZZ${encodeURIComponent(FAKE_SHARE)}`,
      `%${FAKE_TOKEN}`,
    ]) {
      expect(sent({ en: "click", "ep.link_url": value }), value).toBe(null);
    }
    // Malformed but harmless values still go through.
    expect(sent({ en: "page_view", dl: `${ORIGIN}/faq`, "ep.note": "100%" })).not.toBeNull();
  });

  it.each(PRIVATE_VARIANTS)("treats %s as private in every content field", (variant) => {
    expect(
      sent({
        en: "page_view",
        dl:
          variant.startsWith("/") || variant.startsWith("http") ? variant : `${ORIGIN}/${variant}`,
      }),
    ).toBe(null);
    expect(sent({ en: "page_view", "ep.page_path": variant })).toBe(null);
    expect(sent({ en: "click", "ep.link_url": variant })).toBe(null);
    expect(sent({ en: "page_view", dl: `${ORIGIN}/`, dr: variant })?.get("dr")).toBe(`${ORIGIN}/`);
    expect(
      sent({ en: "page_view", dl: `${ORIGIN}/`, "ep.page_referrer": variant })?.get(
        "ep.page_referrer",
      ),
    ).toBe(`${ORIGIN}/`);
  });

  it("drops token- or ID-shaped values in titles, event and user parameters", () => {
    expect(sent({ en: "page_view", dt: `Results ${FAKE_TOKEN}` })).toBe(null);
    expect(sent({ en: "page_view", dt: FAKE_TOKEN.toUpperCase() })).toBe(null);
    expect(sent({ en: "click", "ep.ref": FAKE_UUID })).toBe(null);
    expect(sent({ en: "click", "up.id": `x${FAKE_TOKEN}0000` })).toBe(null);
    expect(sent({ en: "click", [`ep.${FAKE_TOKEN}`]: "1" })).toBe(null);
  });

  it("reduces another site's URL to its origin and path, unless it looks private", () => {
    expect(
      sent({
        en: "page_view",
        dl: `${ORIGIN}/`,
        dr: "https://www.google.com/search?q=sameeeish#x",
      })?.get("dr"),
    ).toBe("https://www.google.com/search");
    // A host that merely starts with a private word isn't a private path.
    expect(
      sent({ en: "page_view", dl: `${ORIGIN}/`, dr: "https://create.example.com/" })?.get("dr"),
    ).toBe("https://create.example.com/");
    expect(
      sent({ en: "click", "ep.link_url": "https://vercel.com/legal/privacy-notice" })?.get(
        "ep.link_url",
      ),
    ).toBe("https://vercel.com/legal/privacy-notice");
  });

  it("drops an unparseable URL in page_location", () => {
    expect(sent({ en: "page_view", dl: "https://[not-a-host/faq" })).toBe(null);
  });

  it("sends every public page's page_view unchanged, with gtag's technical parameters", () => {
    for (const path of PUBLIC_PATHS) {
      const request =
        `${COLLECT}?v=2&tid=${ID}&gtm=45je5a10v9&_p=1760000000000&gcd=13l3l3l3l1l1&npa=0&dma=0` +
        `&cid=1234567890.1760000000&ul=en-us&sr=1280x720&uaa=x86&uab=64&uafvl=Chromium%3B141.0.0.0` +
        `&uamb=0&uam=&uap=Linux&uapv=6.1&uaw=0&are=1&frm=0&pscdl=noapi&_s=1&tag_exp=101509157~103116026` +
        `&sid=1760000000&sct=1&seg=0&dl=${encodeURIComponent(ORIGIN + path)}&dr=${encodeURIComponent("https://www.google.com/")}` +
        `&dt=Sameeeish&en=page_view&_fv=1&_ss=1&_ee=1&tfd=500`;
      expect(sanitize(request), path).toEqual({ url: request, body: undefined });
      expect(sanitize(hit({ en: "page_view", "ep.page_path": path })), path).not.toBeNull();
    }
  });
});

describe("installGAPrivacyGuard: documents opened with private data in the query or fragment", () => {
  const FAKE_TOKEN = "fedcba9876543210fedcba9876543210";

  function isolated(path: string) {
    const fake = fakeWindow(path);
    const navigations: string[] = [];
    let reloads = 0;
    fake.win.location.href = ORIGIN + path;
    fake.win.location.assign = (url: string) => navigations.push("assign " + url);
    fake.win.location.replace = (url: string) => navigations.push("replace " + url);
    fake.win.location.reload = () => {
      reloads++;
    };
    const { sanitize } = installGAPrivacyGuard(
      fake.win,
      ID,
      PUBLIC_PATH_SOURCE,
      PRIVATE_PATH_SOURCE,
    );
    return { ...fake, sanitize, navigations, reloads: () => reloads };
  }

  it.each([
    `/faq?t=${FAKE_TOKEN}`,
    "/?ref=/w/not-a-real-token",
    `/?ref=${encodeURIComponent(encodeURIComponent("/w/not-a-real-token"))}`,
    `/?r=${encodeURIComponent(`${ORIGIN}/W/not-a-real-token`)}`,
    "/faq#/w/not-a-real-token",
    `/faq#${FAKE_TOKEN}`,
    "/play?next=/create",
  ])("keeps GA off and unmarked in a public page opened at %s", (path) => {
    const { win, sanitize } = isolated(path);
    expect(win[`ga-disable-${ID}`]).toBe(true);
    expect(win[GUARD_MARKER_KEY]).toBeUndefined();
    expect(sanitize(hit({ en: "page_view", dl: `${ORIGIN}/faq` }))).toBe(null);
  });

  it.each([
    "/?utm_source=newsletter&utm_medium=email",
    "/faq?fbclid=IwAR0Fake",
    "/how-it-works#rules",
    "/play?x=1",
  ])("runs GA normally on a public page opened at %s", (path) => {
    const { win } = isolated(path);
    expect(win[`ga-disable-${ID}`]).toBe(false);
    expect(win[GUARD_MARKER_KEY]).toBe(true);
  });

  it("leaves the public document when a pushState would put private data in its URL", () => {
    const { win, navigations } = isolated("/faq");
    win.history.pushState({}, "", "/faq?ref=/w/not-a-real-token");
    win.history.replaceState({}, "", `/faq#${FAKE_TOKEN}`);
    expect(navigations).toEqual([
      `assign ${ORIGIN}/faq?ref=/w/not-a-real-token`,
      `replace ${ORIGIN}/faq#${FAKE_TOKEN}`,
    ]);
    expect(`${win.location.search}${win.location.hash}`).toBe("");
    expect(win[`ga-disable-${ID}`]).toBe(false);
  });

  it("reloads when the fragment changes to something private", () => {
    const { win, listeners, reloads } = isolated("/faq");
    win.location.hash = "#/w/not-a-real-token";
    listeners.hashchange?.forEach((listener) => listener());
    expect(reloads()).toBe(1);
    expect(win[`ga-disable-${ID}`]).toBe(true);
  });
});
