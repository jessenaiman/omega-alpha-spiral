import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";
import { inspectPage } from "../../scripts/inspect-threejs-canvas.mjs";

const out = "artifacts/stage1-visual-20260924-f";
const runId = "stage1-visual-20260924-f";
const url = "http://127.0.0.1:5193/intro.html?debug";
const states = ["question-1", "question-2", "question-3", "question-4"];
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ channel: "chromium" });
try {
  for (const state of states) {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    await page.addInitScript(() => {
      document.addEventListener("DOMContentLoaded", () => {
        const timer = setInterval(() => {
          const button = document.querySelector(".os-start-begin");
          if (button instanceof HTMLButtonElement) {
            clearInterval(timer);
            button.click();
          }
        }, 20);
      });
    });
    const report = await inspectPage(page, {
      url,
      out,
      mobile: false,
      state,
      runId,
      wait: 750,
    });
    await writeFile(`${out}/desktop-${state}.json`, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`${state}: ${report.result?.reason}; errors=${report.consoleErrors.length + report.pageErrors.length}`);
    await context.close();
  }
} finally {
  await browser.close();
}



