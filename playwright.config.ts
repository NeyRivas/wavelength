import { defineConfig, devices } from "@playwright/test";

/**
 * First-stage E2E setup (see ARCHITECTURE.md §10). Drives the real Next.js
 * dev server with a real browser — nothing here is mocked or stubbed,
 * unlike tests/integration/ (which talks to Postgres directly and never
 * touches the app layer at all). That means these tests need a working
 * Supabase Anonymous Auth backend behind NEXT_PUBLIC_SUPABASE_URL /
 * NEXT_PUBLIC_SUPABASE_ANON_KEY (.env.local) to get past the very first
 * page load — see the "Infrastructure" note in the E2E audit for what
 * happens when that's not reachable (as in this sandbox).
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

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    ...(chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}),
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: `pnpm exec next dev -p ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
