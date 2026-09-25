import { rename, writeFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const out = "artifacts/stage1-visual-20260924-e";
const url = "http://127.0.0.1:5193/intro.html?debug";
const browser = await chromium.launch({ channel: "chromium" });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
  recordVideo: { dir: out, size: { width: 1280, height: 720 } },
});
const page = await context.newPage();
const consoleErrors = [];
const pageErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(String(error)));
page.addInitScript(() => {
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

const state = () =>
  page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.state);
const waitFor = (predicate, timeout = 15000) =>
  page.waitForFunction(predicate, null, { timeout, polling: 30 });
const capture = async (name) => {
  await page.screenshot({ path: `${out}/${name}.png` });
};

try {
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await waitFor(
    () =>
      window.__THREE_GAME_TEST_HOOKS__ &&
      document.querySelector("main")?.dataset.osStartedTs === "true"
  );
  await page.evaluate(async () => {
    const hooks = window.__THREE_GAME_TEST_HOOKS__;
    await hooks.setState("question-1");
    hooks.setPausedForScreenshot(false);
    hooks.setReducedMotion(false);
    document.activeElement?.blur();
    window.__arrivalSamples = [];
    window.__arrivalSampler = setInterval(() => {
      const current = window.__THREE_GAME_DIAGNOSTICS__?.state;
      if (!current) return;
      window.__arrivalSamples.push({
        t: performance.now(),
        frame: current.frame,
        mode: current.storyMode,
        question: current.questionIndex + 1,
        paused: current.pausedForScreenshot,
        x: current.playerPosition.x,
        y: current.playerPosition.y,
        z: current.playerPosition.z,
      });
    }, 30);
  });
  await capture("arrival-question-1");
  await page.keyboard.press("1");
  await waitFor(
    () => window.__THREE_GAME_DIAGNOSTICS__?.state.storyMode === "response",
    15000
  );
  await capture("arrival-contact-response");

  // Shorten authored response writing; travel itself stays unpaused and at full motion.
  await page.evaluate(() =>
    window.__THREE_GAME_TEST_HOOKS__.setReducedMotion(true)
  );
  for (let attempt = 0; attempt < 6; attempt++) {
    const current = await state();
    if (current.storyMode === "travel") break;
    if (current.canContinue) await page.keyboard.press("Enter");
    else await page.waitForTimeout(500);
  }
  await waitFor(
    () => window.__THREE_GAME_DIAGNOSTICS__?.state.storyMode === "travel",
    15000
  );
  await page.evaluate(() =>
    window.__THREE_GAME_TEST_HOOKS__.setReducedMotion(false)
  );
  await capture("arrival-travel-start");
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.down("w");
  await waitFor(
    () =>
      window.__THREE_GAME_DIAGNOSTICS__?.state.storyMode === "travel" &&
      window.__THREE_GAME_DIAGNOSTICS__.state.playerPosition.z < -2.5,
    10000
  );
  await capture("arrival-travel-middle");
  await waitFor(
    () =>
      window.__THREE_GAME_DIAGNOSTICS__?.state.storyMode === "travel" &&
      window.__THREE_GAME_DIAGNOSTICS__.state.playerPosition.z < -4.7,
    10000
  );
  await capture("arrival-travel-near");
  await waitFor(
    () =>
      window.__THREE_GAME_DIAGNOSTICS__?.state.storyMode === "prelude" &&
      window.__THREE_GAME_DIAGNOSTICS__.state.questionIndex === 1,
    10000
  );
  await page.keyboard.up("w");
  await capture("arrival-question-2-prelude");
  const samples = await page.evaluate(() => {
    clearInterval(window.__arrivalSampler);
    return window.__arrivalSamples;
  });
  const transitionSteps = samples.slice(1).flatMap((sample, index) => {
    const before = samples[index];
    const crossesArrival =
      before.mode === "travel" || sample.mode === "travel";
    const dt = sample.t - before.t;
    if (!crossesArrival || dt > 150 || dt <= 0) return [];
    return [
      {
        from: before.mode,
        to: sample.mode,
        dtMs: dt,
        distance: Math.hypot(
          sample.x - before.x,
          sample.y - before.y,
          sample.z - before.z
        ),
      },
    ];
  });
  const report = {
    url,
    sourceCommit: "b529609232b2a876692ac83f0e669dc128a9c16d",
    initial: samples[0],
    final: samples.at(-1),
    sampleCount: samples.length,
    modeSequence: [...new Set(samples.map((sample) => sample.mode))],
    unpausedTravelSamples: samples.filter(
      (sample) => sample.mode === "travel" && !sample.paused
    ).length,
    maxTravelStep: Math.max(0, ...transitionSteps.map((step) => step.distance)),
    arrivalSteps: transitionSteps.filter((step) => step.to !== step.from),
    consoleErrors,
    pageErrors,
    samples,
  };
  await writeFile(`${out}/arrival.json`, `${JSON.stringify(report, null, 2)}\n`);
  console.log(
    `arrival: ${report.modeSequence.join(" -> ")}; travel samples=${report.unpausedTravelSamples}; max step=${report.maxTravelStep.toFixed(3)}; errors=${consoleErrors.length + pageErrors.length}`
  );
} catch (error) {
  const current = await state().catch(() => null);
  const samples = await page
    .evaluate(() => window.__arrivalSamples ?? [])
    .catch(() => []);
  console.log("arrival stopped:", String(error), JSON.stringify(current));
  await writeFile(
    `${out}/arrival-attempt.json`,
    `${JSON.stringify({ error: String(error), current, samples }, null, 2)}\n`
  );
  throw error;
} finally {
  await page.keyboard.up("w").catch(() => {});
  const video = page.video();
  await context.close();
  if (video) await rename(await video.path(), `${out}/arrival.webm`);
  await browser.close();
}

