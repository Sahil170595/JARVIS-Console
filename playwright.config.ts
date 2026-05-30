import { defineConfig, devices } from "@playwright/test";

/**
 * P109.1 — End-to-end smoke for the debate viewer.
 *
 * Tests assume:
 *   - jarvis-console dev server is running on http://localhost:3100
 *   - chimera-backend is running on http://localhost:8100 with at least one
 *     completed debate (or the spec will start its own)
 *
 * To run:
 *   npx playwright test --reporter=line
 */

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // chimera is single-tenant for debate state
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.JARVIS_CONSOLE_URL || "http://localhost:3100",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
