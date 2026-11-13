import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import sitemap from "../../app/sitemap";

// Keeps app/sitemap.ts's hand-written `lastModified` dates honest: a route's
// date must be on or after the last commit to that route's own files, so a
// change to a page can't ship while the sitemap still tells crawlers the
// page hasn't changed since an older date.
//
// A route's own files are its page.tsx plus everything it imports, through
// any depth (static, re-exported, and dynamic `import()`s; CSS modules
// included), minus files that SHARED_BY or more sitemap routes reach: those
// are the parts most pages share (header, footer, back link, catalog data,
// the experience-page building blocks…), and changing them doesn't mean
// every page's content changed.
//
// Reads git history, so it needs a full clone: in a shallow one (CI's
// default checkout) every file's history starts at the cut, which would make
// dates look stale that aren't. It fails with instructions instead.

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const BASE_URL = "https://sameeeish.com";
const SHARED_BY = 3;

const IMPORT_PATTERNS = [
  /(?:^|[\s;])(?:import|export)\s[^;]*?from\s*["']([^"']+)["']/g,
  /(?:^|[\s;])import\s*["']([^"']+)["']/g,
  /\bimport\(\s*["']([^"']+)["']\s*\)/g,
];

function resolveImport(spec: string, fromFile: string): string | null {
  let base: string;
  if (spec.startsWith("@/")) base = path.join(ROOT, spec.slice(2));
  else if (spec.startsWith(".")) base = path.resolve(path.dirname(fromFile), spec);
  else return null; // a package, not a project file
  for (const candidate of [
    base,
    `${base}.tsx`,
    `${base}.ts`,
    path.join(base, "index.tsx"),
    path.join(base, "index.ts"),
  ]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
  return null;
}

/** Every project file `file` pulls in, itself included. */
function dependencies(file: string, seen = new Set<string>()): Set<string> {
  if (seen.has(file)) return seen;
  seen.add(file);
  if (!/\.tsx?$/.test(file)) return seen;
  const source = readFileSync(file, "utf8");
  for (const pattern of IMPORT_PATTERNS) {
    for (const match of source.matchAll(pattern)) {
      const resolved = resolveImport(match[1]!, file);
      if (resolved) dependencies(resolved, seen);
    }
  }
  return seen;
}

function git(...args: string[]): string {
  return execFileSync("git", args, { cwd: ROOT, encoding: "utf8" }).trim();
}

interface Route {
  route: string;
  sitemapDate: string;
  files: Set<string>;
}

function routes(): Route[] {
  return sitemap().map((entry) => {
    const route = entry.url.slice(BASE_URL.length) || "/";
    const page = path.join(ROOT, "app", route === "/" ? "" : route, "page.tsx");
    return {
      route,
      sitemapDate: new Date(entry.lastModified!).toISOString().slice(0, 10),
      files: dependencies(page),
    };
  });
}

/** Each route's own files: what fewer than SHARED_BY routes reach. */
function ownFiles(all: Route[]): Map<string, string[]> {
  const reach = new Map<string, number>();
  for (const { files } of all) {
    for (const file of files) reach.set(file, (reach.get(file) ?? 0) + 1);
  }
  return new Map(
    all.map(({ route, files }) => [
      route,
      [...files].filter((file) => reach.get(file)! < SHARED_BY).map((f) => path.relative(ROOT, f)),
    ]),
  );
}

describe("app/sitemap.ts lastModified dates", () => {
  const all = routes();
  const own = ownFiles(all);

  it("counts a page's own content and dynamic imports, but not shared parts", () => {
    expect(own.get("/play/friends/how-well-do-you-know-me")).toContain(
      "components/play/how-well-do-you-know-me-content.tsx",
    );
    // Loaded with next/dynamic's import().
    expect(own.get("/play/dating-couples/date-night")).toContain(
      "components/date-night/date-night-experience.tsx",
    );
    // A CSS module is part of the page too.
    expect(own.get("/")).toContain("components/landing/hero-demo.module.css");
    for (const [route, files] of own) {
      expect(files, route).toContain(path.join("app", route === "/" ? "" : route, "page.tsx"));
      expect(files, route).not.toContain("components/landing/landing-header.tsx");
      expect(files, route).not.toContain("components/landing/landing-footer.tsx");
    }
  });

  it("is on or after the last commit to each route's own files", () => {
    expect(
      git("rev-parse", "--is-shallow-repository"),
      "This check reads git history and needs a full clone: run `git fetch --unshallow` " +
        "(or check out with `fetch-depth: 0` in CI).",
    ).toBe("false");

    const stale: string[] = [];
    for (const { route, sitemapDate } of all) {
      const [date, hash, subject] = git(
        "log",
        "-1",
        "--format=%cs%x09%h%x09%s",
        "--",
        ...own.get(route)!,
      ).split("\t");
      if (date && date > sitemapDate) {
        stale.push(
          `${route}: app/sitemap.ts says ${sitemapDate}, but its own files changed on ${date} ` +
            `(${hash} "${subject}"). Set its lastModified to ${date} or later.`,
        );
      }
    }
    expect(stale, `Stale sitemap dates:\n${stale.join("\n")}`).toEqual([]);
  });
});
