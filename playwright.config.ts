import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:3120",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run start -- --port 3120",
    url: "http://127.0.0.1:3120",
    reuseExistingServer: false,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
