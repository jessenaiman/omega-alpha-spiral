/*
 * Required sources of truth:
 * .agents/skills/threejs-qa-release/SKILL.md
 * .agents/skills/threejs-qa-release/references/playtest-bot.md
 * .agents/skills/threejs-debug-profiler/SKILL.md
 */
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

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

type RoomKind = "door" | "monster" | "chest";
type ChapterPoint = { x: number; z: number };

type ChapterState = {
  active: boolean;
  phase: string;
  roomIndex: number;
  variationSeed: number;
  objects: Array<{ kind: RoomKind; x: number; z: number }>;
  nearest: RoomKind | null;
  routes: Record<RoomKind, ChapterPoint[]> | null;
  player: ChapterPoint;
  framesAdvanced: number;
  distanceTravelled: number;
  choices: Array<{ object: string; answer: string; combatOutcome?: "fallen" }>;
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
  | { kind: "name-entry"; value: string }
  | { kind: "doorway-crossing" }
  | { kind: "chapter-room"; choice: RoomKind };

// One deterministic route through the opening and the three playable rooms.
// Hooks establish only the reproducible boot state; route selection uses real input.
const INPUT_SCRIPT: BotStep[] = [
  { kind: "intro-choice", choice: 0 },
  { kind: "intro-choice", choice: 1 },
  { kind: "intro-choice", choice: 2 },
  { kind: "intro-choice", choice: 0 },
  { kind: "name-entry", value: "Astra" },
  { kind: "doorway-crossing" },
  { kind: "chapter-room", choice: "door" },
  { kind: "chapter-room", choice: "monster" },
  { kind: "chapter-room", choice: "chest" },
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
  metrics: { distance: number; softlocks: number }
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
        state.playerPosition.z - previous.playerPosition.z
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
  capturePath?: string
): Promise<void> {
  let previous = await readIntro(page);
  const startZ = previous.playerPosition.z;
  let captured = false;
  let stationarySamples = 0;
  await page.keyboard.down("ArrowUp");
  try {
    for (let index = 0; index < 440; index += 1) {
      const state = await readIntro(page);
      const moved = Math.hypot(
        state.playerPosition.x - previous.playerPosition.x,
        state.playerPosition.y - previous.playerPosition.y,
        state.playerPosition.z - previous.playerPosition.z
      );
      // Arrival rebases the next station's local coordinates; only compare motion within travel.
      if (state.storyMode !== "travel") return;
      expect(moved, "held travel motion must remain continuous between samples")
        .toBeLessThan(Math.max(1.25, (state.frame - previous.frame) * 0.4));
      metrics.distance += moved;
      if (!captured && capturePath && state.playerPosition.z < startZ - 1.5) {
        await page.screenshot({ path: capturePath });
        captured = true;
      }
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
  throw new Error("Bot failed to reach the next intro question while walking forward");
}

async function walkThroughDoorway(
  page: Page,
  metrics: { distance: number; softlocks: number }
): Promise<void> {
  let previous = await readIntro(page);
  let doorwayDistance = 0;
  let stationarySamples = 0;
  await page.keyboard.down("ArrowUp");
  try {
    for (let index = 0; index < 440; index += 1) {
      const state = await readIntro(page);
      const moved = Math.hypot(
        state.playerPosition.x - previous.playerPosition.x,
        state.playerPosition.y - previous.playerPosition.y,
        state.playerPosition.z - previous.playerPosition.z
      );
      doorwayDistance += moved;
      metrics.distance += moved;
      if (state.frame > previous.frame && moved < 0.001) stationarySamples += 1;
      else stationarySamples = 0;
      if (stationarySamples >= 10) {
        metrics.softlocks += 1;
        stationarySamples = 0;
      }
      if (state.storyMode === "complete") {
        expect(
          doorwayDistance,
          "held forward input must move the player through the doorway sensor"
        ).toBeGreaterThan(0.5);
        return;
      }
      previous = state;
      await page.waitForTimeout(45);
    }
  } finally {
    await page.keyboard.up("ArrowUp");
  }
  throw new Error("Bot failed to walk through the Omega words");
}

async function finishResponse(page: Page): Promise<string> {
  await waitForContinue(page);
  await page.keyboard.press("Enter");
  for (let index = 0; index < 3; index += 1) {
    await expect
      .poll(async (): Promise<string> => (await readIntro(page)).storyMode, {
        timeout: 20_000,
      })
      .toMatch(/^(commentary|travel|final|name|doorway)$/);
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
  target: number
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
      { timeout: 15_000 }
    );
  } finally {
    await page.keyboard.up(key);
  }
  const after = await readChapter(page);
  expect(after.framesAdvanced).toBeGreaterThan(before.framesAdvanced);
  expect(after.distanceTravelled).toBeGreaterThan(before.distanceTravelled);
  return after.distanceTravelled - before.distanceTravelled;
}

type EarlyRoomResult = {
  roomIndex: number;
  door: ChapterPoint;
  chosen: RoomKind;
  outcome: "fallen" | null;
  distance: number;
};

/** Hold real movement keys along authored waypoints; fail when visible collision traps a route. */
async function steerChapterPoint(
  page: Page,
  target: ChapterPoint,
  roomIndex: number,
  tolerance = 0.42,
  allowRoomChange = false
): Promise<number> {
  const before = await readChapter(page);
  let heldX: "KeyA" | "KeyD" | null = null;
  let heldZ: "KeyW" | "KeyS" | null = null;
  let last = before.player;
  let stuck = 0;
  try {
    for (let tick = 0; tick < 360; tick += 1) {
      const state = await readChapter(page);
      if (allowRoomChange && state.phase === "complete")
        return state.distanceTravelled - before.distanceTravelled;
      if (state.roomIndex !== roomIndex) {
        if (allowRoomChange) return state.distanceTravelled - before.distanceTravelled;
        throw new Error(`Room changed while steering to ${JSON.stringify(target)}`);
      }
      const dx = target.x - state.player.x;
      const dz = target.z - state.player.z;
      if (Math.hypot(dx, dz) <= tolerance)
        return state.distanceTravelled - before.distanceTravelled;
      const wantX: "KeyA" | "KeyD" | null =
        Math.abs(dx) <= 0.25 ? null : dx > 0 ? "KeyD" : "KeyA";
      const wantZ: "KeyW" | "KeyS" | null =
        Math.abs(dz) <= 0.25 ? null : dz > 0 ? "KeyS" : "KeyW";
      if (wantX !== heldX) {
        if (heldX) await page.keyboard.up(heldX);
        heldX = wantX;
        if (heldX) await page.keyboard.down(heldX);
      }
      if (wantZ !== heldZ) {
        if (heldZ) await page.keyboard.up(heldZ);
        heldZ = wantZ;
        if (heldZ) await page.keyboard.down(heldZ);
      }
      const moved = Math.hypot(state.player.x - last.x, state.player.z - last.z);
      stuck = moved < 0.015 ? stuck + 1 : 0;
      if (stuck >= 18)
        throw new Error(`Movement blocked on room ${roomIndex + 1} toward ${JSON.stringify(target)} at ${JSON.stringify(state.player)}`);
      last = state.player;
      await page.waitForTimeout(45);
    }
  } finally {
    if (heldX) await page.keyboard.up(heldX);
    if (heldZ) await page.keyboard.up(heldZ);
  }
  throw new Error(`Timed out walking room ${roomIndex + 1} toward ${JSON.stringify(target)}`);
}

async function playEarlyRoom(
  page: Page,
  choice: RoomKind,
  answer: string,
  capturePath?: string
): Promise<EarlyRoomResult> {
  const start = await readChapter(page);
  expect(start.phase).toBe("exploring");
  const door = start.objects.find((object) => object.kind === "door");
  const selected = start.objects.find((object) => object.kind === choice);
  const route = start.routes?.[choice];
  if (!door || !selected || !route || route.length < 2)
    throw new Error(`Missing authored ${choice} route or exit on room ${start.roomIndex + 1}`);
  let distance = 0;
  for (const waypoint of route.slice(1, -1))
    distance += await steerChapterPoint(page, waypoint, start.roomIndex);
  const previous = route[route.length - 2];
  const length = Math.hypot(previous.x - selected.x, previous.z - selected.z);
  if (length < 2.3) throw new Error(`Final ${choice} route segment is too short`);
  const approach = {
    x: selected.x + (previous.x - selected.x) / length * 2.15,
    z: selected.z + (previous.z - selected.z) / length * 2.15,
  };
  distance += await steerChapterPoint(page, approach, start.roomIndex, 0.4);
  const atExit = await readChapter(page);
  expect(atExit.nearest, `Expected ${choice} near ${JSON.stringify(selected)}; player ${JSON.stringify(atExit.player)}`).toBe(choice);
  if (capturePath) await page.screenshot({ path: capturePath });
  await page.keyboard.press("KeyE");
  await expect.poll(async () => (await readChapter(page)).phase, { timeout: 5_000 })
    .toMatch(/^(prompt|fighting|result)$/);
  if (choice === "door") {
    const input = page.locator("#echo-answer");
    await expect(input).toBeVisible();
    await input.fill(answer);
    await input.press("Enter");
  }
  await expect.poll(async () => (await readChapter(page)).phase, { timeout: 6_000 })
    .toBe("result");
  const resolved = await readChapter(page);
  expect(resolved.choices.length).toBe(start.roomIndex + 1);
  if (choice === "monster")
    expect(resolved.choices[start.roomIndex].combatOutcome).toBe("fallen");
  distance += await steerChapterPoint(page, selected, start.roomIndex, 0.65, true);
  await expect.poll(async () => {
    const state = await readChapter(page);
    return state.roomIndex > start.roomIndex || state.phase === "complete";
  }, { timeout: 5_000 }).toBe(true);
  return {
    roomIndex: start.roomIndex,
    door: { x: door.x, z: door.z },
    chosen: choice,
    outcome: resolved.choices[start.roomIndex].combatOutcome ?? null,
    distance,
  };
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
  await page.goto("/intro.html?debug&seed=472");
  await page.getByRole("button", { name: /Begin/ }).click();
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
    "boot-cursor"
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
      step.kind === "intro-choice"
  );
  for (const [index, step] of introSteps.entries()) {
    if (index === 0) {
      const beforeGuide = await readIntro(page);
      await page.keyboard.press("1");
      await expect
        .poll(async (): Promise<string> => (await readIntro(page)).storyMode, {
          timeout: 15_000,
        })
        .toBe("response");
      const afterGuide = await readIntro(page);
      routeMetrics.distance += Math.hypot(
        afterGuide.playerPosition.x - beforeGuide.playerPosition.x,
        afterGuide.playerPosition.y - beforeGuide.playerPosition.y,
        afterGuide.playerPosition.z - beforeGuide.playerPosition.z
      );
      expect(
        routeMetrics.distance,
        "number key should send the player toward a path"
      ).toBeGreaterThan(0.5);
    } else await steerIntro(page, step.choice, routeMetrics);
    const reached = await readIntro(page);
    if (
      reached.storyMode === "waiting" &&
      reached.pendingChoice === step.choice
    )
      await page.keyboard.press("Enter");
    await expect
      .poll(async (): Promise<string> => (await readIntro(page)).storyMode)
      .toBe("response");
    const beforeTravel = await readIntro(page);
    const nextMode = await finishResponse(page);
    const afterResponse = await readIntro(page);
    await recordStep(index);
    if (index === introSteps.length - 1) {
      expect(["final", "name"]).toContain(nextMode);
      break;
    }
    expect(nextMode).toBe("travel");
    expect(
      Math.hypot(
        afterResponse.playerPosition.x - beforeTravel.playerPosition.x,
        afterResponse.playerPosition.y - beforeTravel.playerPosition.y,
        afterResponse.playerPosition.z - beforeTravel.playerPosition.z
      ),
      "travel must begin from the contacted strand"
    ).toBeLessThan(1.25);
    await steerTravel(
      page,
      routeMetrics,
      testInfo.outputPath(`intro-travel-${index + 1}.png`)
    );
    await expect
      .poll(async (): Promise<string> => (await readIntro(page)).storyMode)
      .toMatch(/^(prelude|question|waiting)$/);
    if ((await readIntro(page)).storyMode === "prelude") {
      await waitForContinue(page);
      if ((await readIntro(page)).storyMode === "prelude")
        await page.keyboard.press("Enter");
    }
    await expect
      .poll(async (): Promise<string> => (await readIntro(page)).storyMode, {
        timeout: 20_000,
      })
      .toBe("waiting");
  }

  await expect
    .poll(async (): Promise<string> => (await readIntro(page)).storyMode, {
      timeout: 30_000,
    })
    .toBe("name");
  const nameStep = INPUT_SCRIPT.find(
    (step): step is Extract<BotStep, { kind: "name-entry" }> =>
      step.kind === "name-entry"
  );
  if (!nameStep) throw new Error("Bot script is missing the name-entry step");
  const nameForm = page.locator("#os-name-entry-ts");
  const nameInput = page.locator("#os-name-input-ts");
  await expect(nameForm).toBeVisible();
  await expect(nameInput).toBeVisible();
  await nameInput.pressSequentially(nameStep.value);
  await nameInput.press("Enter");
  await expect
    .poll(async (): Promise<string> => (await readIntro(page)).storyMode)
    .toBe("doorway");

  if (!INPUT_SCRIPT.some((step) => step.kind === "doorway-crossing"))
    throw new Error("Bot script is missing the doorway-crossing step");
  await walkThroughDoorway(page, routeMetrics);
  await expect
    .poll(async (): Promise<boolean> => (await readIntro(page)).complete)
    .toBe(true);
  await expect
    .poll(
      async (): Promise<string | null> =>
        page.locator("main").getAttribute("data-chapter"),
      { timeout: 20_000 }
    )
    .toBe("2");
  await expect
    .poll(async (): Promise<boolean> => (await readChapter(page)).active)
    .toBe(true);

  const chapterSteps = INPUT_SCRIPT.filter(
    (step): step is Extract<BotStep, { kind: "chapter-room" }> =>
      step.kind === "chapter-room"
  );
  const chapterResults: EarlyRoomResult[] = [];
  for (const [index, step] of chapterSteps.entries()) {
    chapterResults.push(await playEarlyRoom(page, step.choice, `bot answer ${index}`));
    routeMetrics.distance += chapterResults[index].distance;
    await recordStep(introSteps.length + index);
  }
  await expect.poll(async () => (await readChapter(page)).phase).toBe("complete");
  const completedChapter = await readChapter(page);
  const after = await sample(page);
  await page.keyboard.press("KeyR");
  await expect
    .poll(async (): Promise<number> => (await readChapter(page)).choices.length)
    .toBe(0);
  await expect
    .poll(
      async (): Promise<number> => (await readChapter(page)).distanceTravelled
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
    chapterResults,
    consoleErrors,
    pageErrors,
    networkErrors,
  };
  await testInfo.attach("bot-playtest-report", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  });
  await writeFile(
    "artifacts/intro-bot-playtest-report.json",
    JSON.stringify(report, null, 2)
  );
  console.log(`bot playtest: ${JSON.stringify(report)}`);

  expect(pageErrors, "page errors during bot play").toEqual([]);
  expect(consoleErrors, "console errors during bot play").toEqual([]);
  expect(networkErrors, "network errors during bot play").toEqual([]);
  expect(report.framesAdvanced, "game loop must keep running").toBeGreaterThan(
    100
  );
  expect(
    report.distanceTravelled,
    "player must respond to scripted input"
  ).toBeGreaterThan(5);
  expect(
    report.softlockWindows,
    "held input repeatedly produced no motion or progress"
  ).toBeLessThanOrEqual(2);
  expect(
    report.scoreAfter,
    "scripted route must progress the objective"
  ).toBeGreaterThan(report.scoreBefore);
  expect(
    report.stepOfFirstScore,
    "bot must find objective progress"
  ).toBeGreaterThanOrEqual(0);
  expect(report.complete, "bot must complete the playable route").toBe(true);
  expect(report.retryVerified, "restart must restore playable state").toBe(
    true
  );
});


test("Shadow bot: real input crosses seeded exits and captures active floors", async ({
  page,
}, testInfo: TestInfo) => {
  test.setTimeout(240_000);
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
  const runs: Array<{ seed: number; results: EarlyRoomResult[]; frames: number; distance: number }> = [];
  await mkdir("artifacts/qa-61", { recursive: true });
  for (const seed of [17, 42]) {
    await page.goto(`/intro.html?debug&seed=${seed}`);
    await page.getByRole("button", { name: /Begin/ }).click();
    const hooks = await page.evaluate(async () => {
      const testWindow = window as unknown as {
        __THREE_GAME_TEST_HOOKS__?: {
          setState(name: string): Promise<{ state: string }>;
        };
      };
      if (!testWindow.__THREE_GAME_TEST_HOOKS__)
        throw new Error("Focused bot needs intro test hooks");
      return testWindow.__THREE_GAME_TEST_HOOKS__.setState("final-door");
    });
    expect(hooks.state).toBe("final-door");
    await walkThroughDoorway(page, { distance: 0, softlocks: 0 });
    await expect.poll(async () => (await readChapter(page)).active, { timeout: 15_000 })
      .toBe(true);
    const first = await readChapter(page);
    expect(first.variationSeed).toBe(seed);
    const results: EarlyRoomResult[] = [];
    results.push(await playEarlyRoom(page, "door", `seed ${seed}`));
    await expect.poll(async () => (await readChapter(page)).roomIndex).toBe(1);
    await page.screenshot({ path: `artifacts/qa-61/shadow-seed-${seed}.png` });
    results.push(await playEarlyRoom(page, "monster", "", `artifacts/qa-61/shadow-action-seed-${seed}.png`));
    await expect.poll(async () => (await readChapter(page)).roomIndex).toBe(2);
    await page.screenshot({ path: `artifacts/qa-61/ambition-seed-${seed}.png` });
    results.push(await playEarlyRoom(page, "chest", "", `artifacts/qa-61/ambition-action-seed-${seed}.png`));
    await expect.poll(async () => (await readChapter(page)).phase).toBe("complete");
    const end = await readChapter(page);
    const uniqueDoors = new Set(results.map((result) => `${result.door.x},${result.door.z}`));
    expect(uniqueDoors.size, "doorway must occupy a different place on each floor").toBe(3);
    runs.push({
      seed,
      results,
      frames: end.framesAdvanced - first.framesAdvanced,
      distance: Number(results.reduce((sum, result) => sum + result.distance, 0).toFixed(2)),
    });
  }
  expect(
    runs[0].results.some((result, index) =>
      result.door.x !== runs[1].results[index].door.x ||
      result.door.z !== runs[1].results[index].door.z
    ),
    "different seeds must vary at least one doorway"
  ).toBe(true);
  const report = {
    runs,
    pageErrors,
    consoleErrors,
    networkErrors,
    introScope: "final-door hook sets starting point; doorway and all three floors use real keyboard input",
  };
  await writeFile("artifacts/qa-61/early-floor-bot-report.json", JSON.stringify(report, null, 2));
  await testInfo.attach("early-floor-bot-report", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  });
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
  expect(networkErrors).toEqual([]);
  expect(runs.every((run) => run.frames > 50 && run.distance > 5)).toBe(true);
});
