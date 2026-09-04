import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // RLS integration tests share one Postgres instance/database; running
    // every project's files serially avoids cross-test interference from
    // concurrent transactions. Unit tests are few/fast, so this costs nothing.
    fileParallelism: false,
    projects: [
      {
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          environment: "node",
          // Boots a native local Postgres, applies the real migrations plus a
          // minimal auth-schema stub, and tears it down after the run. See
          // tests/integration/setup/global-setup.ts for details on why.
          globalSetup: ["tests/integration/setup/global-setup.ts"],
          hookTimeout: 60_000,
          testTimeout: 20_000,
        },
      },
    ],
  },
});
