import { defineConfig, devices } from "@playwright/test";

// E2E for the real user flows (nav, locale switch, contact-form validation, the
// /v QR door). Runs against a production build: `npm run build` then
// `npx next start`. Point BASE_URL at an already-running server to reuse it.
const PORT = Number(process.env.PORT ?? 3100);
const baseURL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["list"]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Reuses a server already on the port (the usual local loop); otherwise builds
  // and starts one (CI, a cold checkout).
  webServer: {
    command: `npm run build && npx next start -p ${PORT}`,
    url: `${baseURL}/en`,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
