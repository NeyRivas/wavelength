import { defineConfig, devices } from "@playwright/test";

/**
 * E2E setup (see ARCHITECTURE.md §10). Drives a real production build of
 * the app (`next build` + `next start`, the same thing Vercel serves) with
 * a real browser — nothing here is mocked or stubbed, unlike
 * tests/integration/ (which talks to Postgres directly and never touches
 * the app layer at all). That means these tests need a working Supabase
 * Anonymous Auth backend behind NEXT_PUBLIC_SUPABASE_URL /
 * NEXT_PUBLIC_SUPABASE_ANON_KEY (.env.local, or the environment in CI) —
 * a local `supabase start` works; never point this at production.
 *
 * Why a production build rather than `next dev`: the dev server compiles
 * each route and server action on first use, so the first test to reach a
 * route can wait seconds for a response a real visitor never waits for,
 * and dev-only UI (the Next.js Dev Tools button) leaks into role queries.
 * Testing what ships makes failures mean something.
 *
 * Server lifecycle: Playwright starts the web server below once before the
 * run, waits for `url` to answer, and stops it (SIGTERM, then SIGKILL)
 * when the run ends — pass or fail. `E2E_REUSE_SERVER=1` reuses a server
 * that's already listening on the port instead (useful while iterating
 * locally); it's off by default so a stale server from an earlier build
 * can't silently answer for new code. `E2E_SKIP_BUILD=1` starts the
 * existing `.next` build without rebuilding.
 *
 * Google Analytics is forced off for the server (an empty
 * NEXT_PUBLIC_GA_MEASUREMENT_ID takes precedence over .env.local), so a
 * test run never loads gtag.js or sends anything to a real GA property.
 *
 * Browser: uses Playwright's normal, managed Chromium — install it once
 * per machine with `pnpm exec playwright install chromium`. No hardcoded
 * executablePath, so this works on any machine with that browser installed
 * the standard way. PLAYWRIGHT_CHROMIUM_PATH is an optional escape hatch
 * for environments that provide their own Chromium binary at a fixed,
 * non-standard path (e.g. a locked-down CI sandbox) instead of letting
 * Playwright manage it; leave it unset for normal local/dev use.
 */
const PORT = process.env.E2E_PORT ?? "3100";
const baseURL = `http://127.0.0.1:${PORT}`;
const chromiumPath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
const isCI = !!process.env.CI;

const startServer = `pnpm exec next start -p ${PORT} -H 127.0.0.1`;
const serverCommand = process.env.E2E_SKIP_BUILD
  ? startServer
  : `pnpm exec next build && ${startServer}`;

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  // One worker, in file order: every test creates its own anonymous users
  // and drafts, so tests don't share data, but one shared local Supabase
  // and one server are the realistic setup, and a serial run keeps a
  // failure's trace free of unrelated concurrent traffic.
  fullyParallel: false,
  workers: 1,
  forbidOnly: isCI,
  // No retries: a test that needs one to pass is a bug to fix, not hide.
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    ...(chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}),
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: serverCommand,
    url: baseURL,
    reuseExistingServer: !!process.env.E2E_REUSE_SERVER,
    // Covers a cold `next build` on a slow machine; startup itself is ~1s.
    timeout: 300_000,
    stdout: "pipe",
    stderr: "pipe",
    gracefulShutdown: { signal: "SIGTERM", timeout: 10_000 },
    env: { NEXT_PUBLIC_GA_MEASUREMENT_ID: "" },
  },
});
