import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  workers: 2,
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH,
          args: ["--no-sandbox", "--disable-dev-shm-usage", "--no-zygote"],
        }
      : {},
  },
  webServer: process.env.PLAYWRIGHT_EXTERNAL_SERVER
    ? undefined
    : {
        command: "npm run start -- --port 3000",
        env: { NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3000" },
        url: "http://127.0.0.1:3000",
        reuseExistingServer: true,
      },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
    {
      name: "small-mobile",
      use: { ...devices["Pixel 7"], viewport: { width: 360, height: 800 } },
    },
  ],
});
