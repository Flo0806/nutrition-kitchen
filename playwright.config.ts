import { defineConfig, devices } from "@playwright/test";

// A production build on its own port, so tests never touch a running dev server.
const port = 3101;
const nodeOnly = /(api|bundle)\.spec\.ts$/;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? "github" : "list",
  // German browser by default: the first audience is German.
  use: { baseURL: `http://localhost:${port}`, locale: "de-DE", trace: "retain-on-failure" },
  projects: [
    // Server and build checks need no browser.
    { name: "node", testMatch: nodeOnly },
    { name: "chromium", testIgnore: nodeOnly, use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", testIgnore: nodeOnly, use: { ...devices["Desktop Safari"] } },
    { name: "mobile-webkit", testIgnore: nodeOnly, use: { ...devices["iPhone 15"] } },
  ],
  webServer: {
    command: `pnpm build --envName e2e && PORT=${port} node .output-e2e/server/index.mjs`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
