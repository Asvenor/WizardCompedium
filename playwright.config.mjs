import { defineConfig } from "@playwright/test";
const baseURL = `http://127.0.0.1:${process.env.CHARACTER_IMPORT_PORT || 4331}`;
export default defineConfig({
  testDir: "tests/browser",
  timeout: 180000,
  workers: 1,
  fullyParallel: false,
  use: {
    baseURL,
    channel: "chrome",
    headless: true,
    viewport: { width: 1440, height: 1000 },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/serve-import-tests.mjs",
    url: `${baseURL}/play/import/`,
    reuseExistingServer: false,
    timeout: 20000,
  },
  reporter: "list",
});
