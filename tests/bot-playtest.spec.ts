import { expect, test, type Page, type TestInfo } from "@playwright/test";

type IntroState = {
  frame: number;
  storyMode: string;
  canContinue: boolean;
  pendingChoice: number;
  objectiveProgress: number;
  complete: boolean;
  failed: boolean;
  playerPosition: { x: number; y: number; z: number };
  choiceTargets: Array<{ x: number; y: number; z: number }>;
  physics: { ready: boolean; steps: number };
};

type ChapterState = {
  active: boolean;
  phase: string;
  roomIndex: number;
  player: { x: number; z: number };
  framesAdvanced: number;
  distanceTravelled: number;
  choices: Array<{ object: string; answer: string }>;
};

type BotSnapshot = {
  frame: number;
  score: number;
  complete: boolean;
  x: number;
  z: number;
};

type BotStep =
  | { kind: "intro-choice"; choice: number }
  | { kind: "chapter-room"; targetX: number };

// One deterministic route through the opening and the three playable rooms.
// Hooks establish only the reproducible boot state; every step uses player input.
const INPUT_SCRIPT: BotStep[] = [
  { kind: "intro-choice", choice: 0 },
  { kind: "intro-choice", choice: 1 },
  { kind: "intro-choice", choice: 2 },
  { kind: "intro-choice", choice: 0 },
  { kind: "chapter-room", targetX: -8 },
  { kind: "chapter-room", targetX: 0 },
  { kind: "chapter-room", targetX: 8 },
];

test.use({ video: "on" });

const readIntro = (page: Page): Promise<IntroState> =>
  page.evaluate((): IntroState => {
    const diagnostics = (
      window as unknown as {
        __THREE_GAME_DIAGNOSTICS__?: { state: IntroState };
      }
    ).__THREE_GAME_DIAGNOSTICS__;
    if (!diagnostics)
      throw new Error("Bot playtest requires intro diagnostics");
    return diagnostics.state;
  });

const readChapter = (page: Page): Promise<ChapterState> =>
  page.evaluate((): ChapterState => {
    const diagnostics = (
      window as unknown as {
        __CHAPTER_TWO_DIAGNOSTICS__?: { getState(): ChapterState };
      }
    ).__CHAPTER_TWO_DIAGNOSTICS__;
    if (!diagnostics)
      throw new Error("Bot playtest requires chapter-two diagnostics");
    return diagnostics.getState();
  });

const sample = (page: Page): Promise<BotSnapshot> =>
  page.evaluate((): BotSnapshot => {
    const intro = (
      window as unknown as {
        __THREE_GAME_DIAGNOSTICS__?: { state: IntroState };
      }
    ).__THREE_GAME_DIAGNOSTICS__?.state;
    if (!intro) throw new Error("Bot playtest requires intro diagnostics");
    const chapter = (
      window as unknown as {
        __CHAPTER_TWO_DIAGNOSTICS__?: { getState(): ChapterState };
      }
    ).__CHAPTER_TWO_DIAGNOSTICS__?.getState();
    return {
      frame: intro.frame,
      score: intro.objectiveProgress + (chapter?.choices.length ?? 0),
      complete: chapter?.phase === "complete",
      x: chapter?.active ? chapter.player.x : intro.playerPosition.x,
      z: chapter?.active ? chapter.player.z : intro.playerPosition.z,
    };
  });

async function waitForContinue(page: Page): Promise<void> {
  await expect
    .poll(async (): Promise<boolean> => (await readIntro(page)).canContinue, {
      timeout: 20_000,
    })
    .toBe(true);
}

async function steerIntro(
  page: Page,
  choice: number,
  metrics: { distance: number; softlocks: number },
): Promise<void> {
  let horizontal: "ArrowLeft" | "ArrowRight" | null = null;
  let previous: IntroState = await readIntro(page);
  let stationarySamples = 0;
  await page.keyboard.down("ArrowUp");
  try {
    for (let index = 0; index < 220; index += 1) {
      const state = await readIntro(page);
      if (state.storyMode === "response" || state.pendingChoice === choice)
        return;
      const target = state.choiceTargets[choice];
      if (!target) throw new Error(`Missing intro choice target ${choice}`);
      const dx = target.x - state.playerPosition.x;
      const desired: "ArrowLeft" | "ArrowRight" | null =
        Math.abs(dx) < 0.11 ? null : dx < 0 ? "ArrowLeft" : "ArrowRight";
      if (desired !== horizontal) {
        if (horizontal) await page.keyboard.up(horizontal);
        horizontal = desired;
        if (horizontal) await page.keyboard.down(horizontal);
      }
      const moved = Math.hypot(
        state.playerPosition.x - previous.playerPosition.x,
        state.playerPosition.y - previous.playerPosition.y,
        state.playerPosition.z - previous.playerPosition.z,
      );
      metrics.distance += moved;
      if (state.frame > previous.frame && moved < 0.001) stationarySamples += 1;
      else stationarySamples = 0;
      if (stationarySamples >= 10) {
        metrics.softlocks += 1;
        stationarySamples = 0;
      }
      previous = state;
      await page.waitForTimeout(45);
    }
  } finally {
    await page.keyboard.up("ArrowUp");
    if (horizontal) await page.keyboard.up(horizontal);
  }
  throw new Error(`Bot failed to reach intro choice ${choice}`);
}

async function steerTravel(
  page: Page,
  metrics: { distance: number; softlocks: number },
): Promise<void> {
  let previous = await readIntro(page);
  let stationarySamples = 0;
  await page.keyboard.down("ArrowUp");
  try {
    for (let index = 0; index < 220; index += 1) {
      const state = await readIntro(page);
      if (state.storyMode !== "travel") return;
      const moved = Math.hypot(
        state.playerPosition.x - previous.playerPosition.x,
        state.playerPosition.y - previous.playerPosition.y,
        state.playerPosition.z - previous.playerPosition.z,
      );
      metrics.distance += moved;
      if (state.frame > previous.frame && moved < 0.001) stationarySamples += 1;
      else stationarySamples = 0;
      if (stationarySamples >= 10) {
        metrics.softlocks += 1;
        stationarySamples = 0;
      }
      previous = state;
      await page.waitForTimeout(45);
    }
  } finally {
    await page.keyboard.up("ArrowUp");
  }
  throw new Error("Bot failed to reach the next intro question");
}

async function finishResponse(page: Page): Promise<string> {
  await waitForContinue(page);
  await page.keyboard.press("Enter");
  for (let index = 0; index < 3; index += 1) {
    await expect
      .poll(async (): Promise<string> => (await readIntro(page)).storyMode, {
        timeout: 20_000,
      })
      .toMatch(/^(commentary|travel|final|doorway)$/);
    const mode = (await readIntro(page)).storyMode;
    if (mode !== "commentary") return mode;
    await waitForContinue(page);
    await page.keyboard.press("Enter");
  }
  throw new Error("Bot could not leave Dreamweaver commentary");
}

async function walkChapter(
  page: Page,
  axis: "x" | "z",
  target: number,
): Promise<number> {
  const before = await readChapter(page);
  if (Math.abs(target - before.player[axis]) < 0.2) return 0;
  const positive = target > before.player[axis];
  const key =
    axis === "x" ? (positive ? "KeyD" : "KeyA") : positive ? "KeyS" : "KeyW";
  await page.keyboard.down(key);
  try {
    await page.waitForFunction(
      ({ requestedAxis, requestedTarget, requestedPositive }) => {
        const diagnostics = (
          window as unknown as {
            __CHAPTER_TWO_DIAGNOSTICS__?: { getState(): ChapterState };
          }
        ).__CHAPTER_TWO_DIAGNOSTICS__;
        if (!diagnostics) return false;
        const position = diagnostics.getState().player[requestedAxis];
        return requestedPositive
          ? position >= requestedTarget
          : position <= requestedTarget;
      },
      {
        requestedAxis: axis,
        requestedTarget: target,
        requestedPositive: positive,
      },
      { timeout: 15_000 },
    );
  } finally {
    await page.keyboard.up(key);
  }
  const after = await readChapter(page);
  expect(after.framesAdvanced).toBeGreaterThan(before.framesAdvanced);
  expect(after.distanceTravelled).toBeGreaterThan(before.distanceTravelled);
  return after.distanceTravelled - before.distanceTravelled;
}

test("bot playtest: scripted real input completes and retries the playable route", async ({
  page,
}, testInfo: TestInfo) => {
  test.setTimeout(180_000);
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const networkErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      networkErrors.push(`${response.status()} ${response.url()}`);
  });

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/intro.html?debug");
  await page.waitForFunction(() => {
    const diagnostics = (
      window as unknown as {
        __THREE_GAME_DIAGNOSTICS__?: { state: { frame: number } };
      }
    ).__THREE_GAME_DIAGNOSTICS__;
    return (diagnostics?.state.frame ?? 0) > 10;
  });

  const acknowledgement = await page.evaluate(async () => {
    const hooks = (
      window as unknown as {
        __THREE_GAME_TEST_HOOKS__?: {
          seed(value: string | number): Promise<{ seed: string }>;
          setState(name: string): Promise<{ state: string }>;
        };
      }
    ).__THREE_GAME_TEST_HOOKS__;
    if (
      !hooks ||
      typeof hooks.seed !== "function" ||
      typeof hooks.setState !== "function"
    ) {
      throw new Error("Bot playtests require seed and setState test hooks");
    }
    const seeded = await hooks.seed(472);
    if (seeded.seed !== "472")
      throw new Error("seed must acknowledge the requested value");
    const applied = await hooks.setState("boot-cursor");
    if (!applied || applied.state !== "boot-cursor")
      throw new Error("setState must acknowledge boot-cursor");
    return applied;
  });
  expect(acknowledgement.state, "bot must start in the requested state").toBe(
    "boot-cursor",
  );

  const before = await sample(page);
  const snapshots: BotSnapshot[] = [before];
  const routeMetrics = { distance: 0, softlocks: 0 };
  let stepOfFirstScore = -1;
  const recordStep = async (stepIndex: number): Promise<void> => {
    const current = await sample(page);
    const previous = snapshots[snapshots.length - 1];
    if (stepOfFirstScore === -1 && current.score > previous.score)
      stepOfFirstScore = stepIndex;
    if (
      current.frame > previous.frame &&
      current.score === previous.score &&
      Math.hypot(current.x - previous.x, current.z - previous.z) < 0.2
    )
      routeMetrics.softlocks += 1;
    snapshots.push(current);
  };

  await page.keyboard.press("Enter");
  await expect
    .poll(async (): Promise<string> => (await readIntro(page)).storyMode, {
      timeout: 30_000,
    })
    .toBe("waiting");

  const introSteps = INPUT_SCRIPT.filter(
    (step): step is Extract<BotStep, { kind: "intro-choice" }> =>
      step.kind === "intro-choice",
  );
  for (const [index, step] of introSteps.entries()) {
    await steerIntro(page, step.choice, routeMetrics);
    const reached = await readIntro(page);
    if (
      reached.storyMode === "waiting" &&
      reached.pendingChoice === step.choice
    )
      await page.keyboard.press("Enter");
    await expect
      .poll(async (): Promise<string> => (await readIntro(page)).storyMode)
      .toBe("response");
    const nextMode = await finishResponse(page);
    await recordStep(index);
    if (index === introSteps.length - 1) {
      if (nextMode !== "doorway") {
        await expect
          .poll(
            async (): Promise<string> => (await readIntro(page)).storyMode,
            { timeout: 30_000 },
          )
          .toBe("doorway");
      }
      break;
    }
    expect(nextMode).toBe("travel");
    await steerTravel(page, routeMetrics);
    await expect
      .poll(async (): Promise<string> => (await readIntro(page)).storyMode)
      .toBe("prelude");
    await waitForContinue(page);
    await page.keyboard.press("Enter");
    await expect
      .poll(async (): Promise<string> => (await readIntro(page)).storyMode, {
        timeout: 20_000,
      })
      .toBe("waiting");
  }

  await page.keyboard.press("Enter");
  await expect
    .poll(async (): Promise<boolean> => (await readIntro(page)).complete)
    .toBe(true);
  await expect
    .poll(
      async (): Promise<string | null> =>
        page.locator("main").getAttribute("data-chapter"),
      { timeout: 20_000 },
    )
    .toBe("2");
  await expect
    .poll(async (): Promise<boolean> => (await readChapter(page)).active)
    .toBe(true);

  const chapterSteps = INPUT_SCRIPT.filter(
    (step): step is Extract<BotStep, { kind: "chapter-room" }> =>
      step.kind === "chapter-room",
  );
  let room = 0;
  while ((await readChapter(page)).phase !== "complete") {
    const step = chapterSteps[room % chapterSteps.length];
    routeMetrics.distance += await walkChapter(page, "x", step.targetX);
    routeMetrics.distance += await walkChapter(page, "z", 2.4);
    await page.keyboard.press("KeyE");
    await expect
      .poll(async (): Promise<string> => (await readChapter(page)).phase)
      .toMatch(/^(prompt|result)$/);
    if ((await readChapter(page)).phase === "prompt") {
      const answer = page.locator("#echo-answer");
      await expect(answer).toBeVisible();
      await answer.fill(`bot answer ${room}`);
      await answer.press("Enter");
    }
    await expect
      .poll(async (): Promise<string> => (await readChapter(page)).phase)
      .toBe("result");
    await recordStep(introSteps.length + room);
    await page.keyboard.press("KeyE");
    if ((await readChapter(page)).phase === "rewriting") {
      const roomBefore = (await readChapter(page)).roomIndex;
      await page.keyboard.press("KeyE");
      await expect
        .poll(async (): Promise<number> => (await readChapter(page)).roomIndex)
        .toBeGreaterThan(roomBefore);
    }
    if ((await readChapter(page)).phase !== "complete") {
      await expect
        .poll(async (): Promise<string> => (await readChapter(page)).phase)
        .toBe("exploring");
    }
    room += 1;
    if (room > 12)
      throw new Error("Bot exceeded the expected chapter-two room count");
  }

  const completedChapter = await readChapter(page);
  const after = await sample(page);
  await page.keyboard.press("KeyR");
  await expect
    .poll(async (): Promise<number> => (await readChapter(page)).choices.length)
    .toBe(0);
  await expect
    .poll(
      async (): Promise<number> => (await readChapter(page)).distanceTravelled,
    )
    .toBe(0);
  const retryVerified = (await readChapter(page)).phase === "exploring";
  const introFinal = await readIntro(page);

  const report = {
    seed: "472",
    steps: INPUT_SCRIPT.length,
    framesAdvanced: after.frame - before.frame,
    scoreBefore: before.score,
    scoreAfter: after.score,
    complete: after.complete,
    distanceTravelled: Number(routeMetrics.distance.toFixed(2)),
    stepOfFirstScore,
    softlockWindows: routeMetrics.softlocks,
    physicsSteps: introFinal.physics.steps,
    failureAvailable: introFinal.failed,
    retryVerified,
    chapterChoices: completedChapter.choices.length,
    consoleErrors,
    pageErrors,
    networkErrors,
  };
  await testInfo.attach("bot-playtest-report", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  });
  console.log(`bot playtest: ${JSON.stringify(report)}`);

  expect(pageErrors, "page errors during bot play").toEqual([]);
  expect(consoleErrors, "console errors during bot play").toEqual([]);
  expect(networkErrors, "network errors during bot play").toEqual([]);
  expect(report.framesAdvanced, "game loop must keep running").toBeGreaterThan(
    100,
  );
  expect(
    report.distanceTravelled,
    "player must respond to scripted input",
  ).toBeGreaterThan(5);
  expect(
    report.softlockWindows,
    "held input repeatedly produced no motion or progress",
  ).toBeLessThanOrEqual(2);
  expect(
    report.scoreAfter,
    "scripted route must progress the objective",
  ).toBeGreaterThan(report.scoreBefore);
  expect(
    report.stepOfFirstScore,
    "bot must find objective progress",
  ).toBeGreaterThanOrEqual(0);
  expect(report.complete, "bot must complete the playable route").toBe(true);
  expect(report.retryVerified, "restart must restore playable state").toBe(
    true,
  );
});
