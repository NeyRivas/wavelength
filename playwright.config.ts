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
 * The preinstalled Chromium at PLAYWRIGHT_BROWSERS_PATH may not match the
 * revision @playwright/test's own version expects, so `executablePath`
 * points at it explicitly instead of letting Playwright try to resolve/
 * download its own copy.
 */
const PORT = process.env.E2E_PORT ?? "3100";
const baseURL = `http://127.0.0.1:${PORT}`;

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
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH ?? "/opt/pw-browsers/chromium",
    },
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
