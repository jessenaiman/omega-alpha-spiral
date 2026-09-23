import { defineConfig } from "@playwright/test";

/*
 * Required sources of truth:
 * .agents/skills/threejs-qa-release/SKILL.md
 * .agents/skills/threejs-qa-release/references/playtest-bot.md
 * .agents/skills/threejs-debug-profiler/SKILL.md
 */
export default defineConfig({
  testDir: "./tests",
  testMatch: "**/bot-playtest.spec.ts",
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: "http://127.0.0.1:5188",
    channel: "chromium",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: "npm run dev",
    url: "http://127.0.0.1:5188",
    reuseExistingServer: true,
    timeout: 20_000,
  },
});
