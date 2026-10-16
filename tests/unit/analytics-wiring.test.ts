import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { GUARD_MARKER_KEY, type GuardWindow } from "../../lib/analytics/ga-privacy-guard";

// The pieces around lib/analytics/ga-privacy-guard.ts that nothing else
// tests: app/layout.tsx putting the guard in <head>, and next.config.ts
// sending Referrer-Policy on every route.

vi.mock("@/components/analytics/google-analytics", () => ({ GoogleAnalytics: () => null }));
vi.mock("../../app/session-bootstrap", () => ({ SessionBootstrap: () => null }));

const ID = "G-TEST123";

async function renderLayout(id: string) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", id);
  const layout = await import("../../app/layout");
  // RootLayout is a plain synchronous server component, so it can be called directly.
  const html = renderToStaticMarkup(layout.default({ children: createElement("main") }));
  return { html, metadata: layout.metadata };
}

function guardScript(html: string): string | null {
  const match = html.match(/<head>[\s\S]*?<script id="ga-privacy-guard">([\s\S]*?)<\/script>/);
  return match ? (match[1] as string) : null;
}

function windowAt(pathname: string): GuardWindow {
  return {
    location: { pathname, origin: "https://sameeeish.com", host: "sameeeish.com" },
    history: { pushState: () => {}, replaceState: () => {} },
    addEventListener: () => {},
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("app/layout.tsx", () => {
  it("puts the privacy guard in <head> when a GA measurement ID is set", async () => {
    const script = guardScript((await renderLayout(ID)).html);
    expect(script).not.toBeNull();
    expect(script).toContain(JSON.stringify(ID));
  });

  it("renders a guard that keeps GA off on unknown paths and marks public pages", async () => {
    const script = guardScript((await renderLayout(ID)).html) as string;
    const decoded = script.replace(/&quot;/g, '"').replace(/&amp;/g, "&");
    for (const [path, disabled, marked] of [
      ["/W/0123456789abcdef", true, undefined],
      ["/w/0123456789abcdef", true, undefined],
      ["/faq", false, true],
    ] as const) {
      const win = windowAt(path);
      new Function("window", decoded)(win);
      expect(win[`ga-disable-${ID}`], path).toBe(disabled);
      expect(win[GUARD_MARKER_KEY], path).toBe(marked);
    }
  });

  it("leaves the guard out without a measurement ID", async () => {
    expect(guardScript((await renderLayout("")).html)).toBeNull();
  });

  it("keeps a fixed site title, which private pages inherit", async () => {
    expect((await renderLayout(ID)).metadata.title).toBe("Sameeeish");
  });
});

describe("next.config.ts", () => {
  it("sends Referrer-Policy: strict-origin on every route", async () => {
    const config = (await import("../../next.config")).default;
    const rules = (await config.headers?.()) ?? [];
    const everyRoute = rules.find((rule) => rule.source === "/:path*");
    expect(everyRoute?.headers).toContainEqual({ key: "Referrer-Policy", value: "strict-origin" });
  });
});
