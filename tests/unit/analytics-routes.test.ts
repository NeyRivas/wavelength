import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import {
  PRIVATE_PATH_SOURCE,
  PUBLIC_PATHS,
  isPublicPath,
} from "../../lib/analytics/ga-privacy-guard";

// Ties lib/analytics/ga-privacy-guard.ts's allowlist to the pages that
// actually exist under app/, and keeps private pages from ever getting a
// title of their own (document.title is part of every GA hit).

const APP_DIR = fileURLToPath(new URL("../../app", import.meta.url));
const PRIVATE_PREFIX = new RegExp("^" + PRIVATE_PATH_SOURCE);

/** Every app/**\/page.tsx as [route, file], e.g. ["/w/[token]/result", ".../page.tsx"]. */
function pageRoutes(dir = APP_DIR, route = ""): Array<[string, string]> {
  const routes: Array<[string, string]> = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      routes.push(...pageRoutes(full, `${route}/${entry}`));
    } else if (entry === "page.tsx") {
      routes.push([route || "/", full]);
    }
  }
  return routes;
}

/** A concrete URL for a route, with dynamic segments filled in. */
function samplePath(route: string): string {
  return route.replace(/\[[^\]]+\]/g, "0123456789abcdef");
}

const routes = pageRoutes();
const privateRoutes = routes.filter(([route]) => !isPublicPath(samplePath(route)));

describe("PUBLIC_PATHS", () => {
  it("finds the app's pages", () => {
    expect(routes.length).toBeGreaterThan(10);
  });

  it("classifies every page: listed as public, or under a private prefix", () => {
    for (const [route] of routes) {
      const url = samplePath(route);
      const classified = isPublicPath(url) || PRIVATE_PREFIX.test(url);
      expect(classified, `${route} is neither in PUBLIC_PATHS nor private`).toBe(true);
    }
  });

  it("never lists a private route as public", () => {
    for (const [route] of routes) {
      const url = samplePath(route);
      if (PRIVATE_PREFIX.test(url)) expect(isPublicPath(url), route).toBe(false);
    }
  });

  it("lists only pages that exist", () => {
    const existing = new Set(routes.map(([route]) => route));
    for (const publicPath of PUBLIC_PATHS) {
      expect(existing.has(publicPath), `${publicPath} has no page`).toBe(true);
    }
  });
});

describe("private pages' titles", () => {
  it("covers the private routes", () => {
    expect(privateRoutes.map(([route]) => route).sort()).toEqual([
      "/create",
      "/w/[token]",
      "/w/[token]/answer",
      "/w/[token]/result",
    ]);
  });

  it("never set a title of their own, so it can't carry an alias or a question", () => {
    for (const [route, file] of privateRoutes) {
      const source = readFileSync(file, "utf8");
      expect(source, `${route} exports generateMetadata`).not.toMatch(
        /export\s+(?:async\s+function|function|const|let)\s+generateMetadata\b/,
      );
      expect(source, `${route} renders a <title>`).not.toMatch(/<title[\s>]/);
      const metadata = source.match(/export const metadata[^=]*=\s*(\{[\s\S]*?\n\});/);
      if (metadata) expect(metadata[1], `${route} sets metadata.title`).not.toMatch(/\btitle\s*:/);
    }
  });

  it("have no layout of their own that could set one", () => {
    for (const [route, file] of privateRoutes) {
      let dir = path.dirname(file);
      while (dir.startsWith(APP_DIR) && dir !== APP_DIR) {
        const layout = path.join(dir, "layout.tsx");
        let exists = true;
        try {
          statSync(layout);
        } catch {
          exists = false;
        }
        expect(exists, `${route} has its own ${path.relative(APP_DIR, layout)}`).toBe(false);
        dir = path.dirname(dir);
      }
    }
  });
});
