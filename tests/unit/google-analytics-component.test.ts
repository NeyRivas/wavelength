// @vitest-environment happy-dom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GUARD_MARKER_KEY } from "../../lib/analytics/ga-privacy-guard";

// Renders components/analytics/google-analytics.tsx for real (React DOM in
// happy-dom). Only Next's router hook and @next/third-parties are replaced:
// the stand-in <NextGoogleAnalytics> renders a marker element instead of
// injecting gtag.js, and sendGAEvent is a spy.

const ID = "G-TEST123";
const mocks = vi.hoisted(() => ({ pathname: "/", sendGAEvent: vi.fn() }));

vi.mock("next/navigation", () => ({ usePathname: () => mocks.pathname }));
vi.mock("@next/third-parties/google", async () => {
  const { createElement: h } = await import("react");
  return {
    GoogleAnalytics: ({ gaId }: { gaId: string }) => h("span", { "data-gtag": gaId }),
    sendGAEvent: mocks.sendGAEvent,
  };
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLElement;
let Component: () => unknown;

/** Fresh module each test: the measurement ID and the "first page_view" flag are module state. */
async function load({ guard = true, id = ID }: { guard?: boolean; id?: string } = {}) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", id);
  const w = window as unknown as Record<string, unknown>;
  if (guard) w[GUARD_MARKER_KEY] = true;
  else delete w[GUARD_MARKER_KEY];
  Component = (await import("../../components/analytics/google-analytics")).GoogleAnalytics;
}

async function visit(pathname: string) {
  mocks.pathname = pathname;
  await act(async () => {
    root ??= createRoot(container);
    root.render(createElement(Component as never));
  });
}

const gtagLoaded = () => container.querySelector("[data-gtag]") !== null;
const pageViews = () =>
  mocks.sendGAEvent.mock.calls
    .filter((call) => call[0] === "event" && call[1] === "page_view")
    .map((call) => (call[2] as { page_path: string }).page_path);

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  mocks.sendGAEvent.mockClear();
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = null;
  container.remove();
  vi.unstubAllEnvs();
});

describe("<GoogleAnalytics>", () => {
  it("loads gtag.js on a public page, leaving that first page_view to gtag's config", async () => {
    await load();
    await visit("/");
    expect(container.querySelector("[data-gtag]")?.getAttribute("data-gtag")).toBe(ID);
    expect(pageViews()).toEqual([]);
  });

  it("sends exactly one page_view per later public navigation, with only the path", async () => {
    await load();
    await visit("/");
    await visit("/faq");
    await visit("/play/friends");
    expect(pageViews()).toEqual(["/faq", "/play/friends"]);
    for (const call of mocks.sendGAEvent.mock.calls) {
      expect(Object.keys(call[2] as object)).toEqual(["page_path"]);
    }
  });

  it.each(["/create", "/create?game=x", "/w/abc", "/w/abc/result", "/W/abc", "/play/unknown"])(
    "never loads gtag.js or sends anything on %s",
    async (path) => {
      await load();
      await visit(path);
      expect(gtagLoaded()).toBe(false);
      expect(mocks.sendGAEvent).not.toHaveBeenCalled();
    },
  );

  it("sends nothing for a non-public page reached after a public one", async () => {
    await load();
    await visit("/play");
    await visit("/W/abc");
    expect(gtagLoaded()).toBe(false);
    await visit("/faq");
    expect(pageViews()).toEqual(["/faq"]);
  });

  it("stays off when the <head> guard didn't mark the document as protected", async () => {
    await load({ guard: false });
    await visit("/");
    await visit("/faq");
    expect(gtagLoaded()).toBe(false);
    expect(mocks.sendGAEvent).not.toHaveBeenCalled();
  });

  it("stays off without a measurement ID", async () => {
    await load({ id: "" });
    await visit("/");
    expect(gtagLoaded()).toBe(false);
  });
});
