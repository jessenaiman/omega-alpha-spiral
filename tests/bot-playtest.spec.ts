/*
 * Required sources of truth:
 * .agents/skills/threejs-qa-release/SKILL.md
 * .agents/skills/threejs-qa-release/references/playtest-bot.md
 * .agents/skills/threejs-debug-profiler/SKILL.md
 */
import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

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

type JourneyState = {
  kind: "early" | "middle" | "late";
  floor: number;
  phase: string | null;
  player: ChapterPoint;
  status?: {
    encounterOutcome?: "won" | "fallen" | null;
    exitUnlocked?: boolean;
    nearOffer?: boolean;
    recruitChoice?: string | null;
    enemies?: Array<{
      id: string;
      health: number;
      position: ChapterPoint;
      telegraph: { target: ChapterPoint } | null;
    }>;
    gatheredDreamweavers?: string[];
    selectedRoute?: string | null;
  };
  routes?: Array<{
    id?: string;
    from?: ChapterPoint;
    to?: ChapterPoint;
    points?: ChapterPoint[];
    waypoints?: ChapterPoint[];
    destinationLandmarkId?: string;
  }>;
  landmarks?: Array<{
    id: string;
    role?: string;
    kind?: string;
    position: ChapterPoint;
    reach?: number;
  }>;
};

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
  journey: JourneyState;
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
      complete:
        chapter?.journey.kind === "late" &&
        chapter.journey.floor === 8 &&
        chapter.journey.phase === "complete",
      x: chapter?.active ? chapter.journey.player.x : intro.playerPosition.x,
      z: chapter?.active ? chapter.journey.player.z : intro.playerPosition.z,
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
      expect(
        moved,
        "held travel motion must remain continuous between samples"
      ).toBeLessThan(Math.max(1.25, (state.frame - previous.frame) * 0.4));
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
  throw new Error(
    "Bot failed to reach the next intro question while walking forward"
  );
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
        if (allowRoomChange)
          return state.distanceTravelled - before.distanceTravelled;
        throw new Error(
          `Room changed while steering to ${JSON.stringify(target)}`
        );
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
      const moved = Math.hypot(
        state.player.x - last.x,
        state.player.z - last.z
      );
      stuck = moved < 0.015 ? stuck + 1 : 0;
      if (stuck >= 18)
        throw new Error(
          `Movement blocked on room ${roomIndex + 1} toward ${JSON.stringify(target)} at ${JSON.stringify(state.player)}`
        );
      last = state.player;
      await page.waitForTimeout(45);
    }
  } finally {
    if (heldX) await page.keyboard.up(heldX);
    if (heldZ) await page.keyboard.up(heldZ);
  }
  throw new Error(
    `Timed out walking room ${roomIndex + 1} toward ${JSON.stringify(target)}`
  );
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
    throw new Error(
      `Missing authored ${choice} route or exit on room ${start.roomIndex + 1}`
    );
  let distance = 0;
  for (const waypoint of route.slice(1, -1))
    distance += await steerChapterPoint(page, waypoint, start.roomIndex);
  const previous = route[route.length - 2];
  const length = Math.hypot(previous.x - selected.x, previous.z - selected.z);
  if (length < 2.3)
    throw new Error(`Final ${choice} route segment is too short`);
  const approach = {
    x: selected.x + ((previous.x - selected.x) / length) * 2.15,
    z: selected.z + ((previous.z - selected.z) / length) * 2.15,
  };
  distance += await steerChapterPoint(page, approach, start.roomIndex, 0.4);
  const atExit = await readChapter(page);
  expect(
    atExit.nearest,
    `Expected ${choice} near ${JSON.stringify(selected)}; player ${JSON.stringify(atExit.player)}`
  ).toBe(choice);
  if (capturePath) await page.screenshot({ path: capturePath });
  await page.keyboard.press("KeyE");
  await expect
    .poll(async () => (await readChapter(page)).phase, { timeout: 5_000 })
    .toMatch(/^(prompt|fighting|result)$/);
  if (choice === "door") {
    const input = page.locator("#echo-answer");
    await expect(input).toBeVisible();
    await input.fill(answer);
    await input.press("Enter");
  }
  await expect
    .poll(async () => (await readChapter(page)).phase, { timeout: 6_000 })
    .toBe("result");
  const resolved = await readChapter(page);
  expect(resolved.choices.length).toBe(start.roomIndex + 1);
  if (choice === "monster")
    expect(resolved.choices[start.roomIndex].combatOutcome).toBe("fallen");
  distance += await steerChapterPoint(
    page,
    selected,
    start.roomIndex,
    0.65,
    true
  );
  await expect
    .poll(
      async () => {
        const state = await readChapter(page);
        return state.roomIndex > start.roomIndex || state.phase === "complete";
      },
      { timeout: 5_000 }
    )
    .toBe(true);
  return {
    roomIndex: start.roomIndex,
    door: { x: door.x, z: door.z },
    chosen: choice,
    outcome: resolved.choices[start.roomIndex].combatOutcome ?? null,
    distance,
  };
}

async function steerJourneyTo(
  page: Page,
  target: ChapterPoint,
  expected: { kind: JourneyState["kind"]; floor: number },
  metrics: { distance: number; softlocks: number },
  tolerance = 0.55
): Promise<void> {
  let heldX: "KeyA" | "KeyD" | null = null;
  let heldZ: "KeyW" | "KeyS" | null = null;
  let last = (await readChapter(page)).journey.player;
  let stuck = 0;
  try {
    for (let tick = 0; tick < 700; tick += 1) {
      const state = (await readChapter(page)).journey;
      if (state.kind !== expected.kind || state.floor !== expected.floor)
        return;
      const dx = target.x - state.player.x;
      const dz = target.z - state.player.z;
      if (Math.hypot(dx, dz) <= tolerance) return;
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
      const moved = Math.hypot(
        state.player.x - last.x,
        state.player.z - last.z
      );
      metrics.distance += moved;
      stuck = moved < 0.015 ? stuck + 1 : 0;
      if (stuck >= 18) {
        metrics.softlocks += 1;
        throw new Error(
          `Real input stalled on ${expected.kind} floor ${expected.floor} toward ${JSON.stringify(target)} at ${JSON.stringify(state.player)}`
        );
      }
      last = state.player;
      if (state.kind === "middle" && state.phase === "active") return;
      await page.waitForTimeout(45);
    }
  } finally {
    if (heldX) await page.keyboard.up(heldX);
    if (heldZ) await page.keyboard.up(heldZ);
  }
  const state = (await readChapter(page)).journey;
  if (state.kind === expected.kind && state.floor === expected.floor)
    throw new Error(
      `Timed out walking ${expected.kind} floor ${expected.floor} toward ${JSON.stringify(target)}`
    );
}

async function resolveMiddleEncounter(
  page: Page,
  floor: number,
  routeSequence: string[],
  metrics: { distance: number; softlocks: number }
): Promise<"won" | "fallen"> {
  let heldX: "KeyA" | "KeyD" | null = null;
  let heldZ: "KeyW" | "KeyS" | null = null;
  let last = (await readChapter(page)).journey.player;
  let stuck = 0;
  let nextAttackAt = 0;
  let dodgedTell = "";
  const setAxes = async (
    x: "KeyA" | "KeyD" | null,
    z: "KeyW" | "KeyS" | null
  ): Promise<void> => {
    if (x !== heldX) {
      if (heldX) await page.keyboard.up(heldX);
      heldX = x;
      if (heldX) await page.keyboard.down(heldX);
    }
    if (z !== heldZ) {
      if (heldZ) await page.keyboard.up(heldZ);
      heldZ = z;
      if (heldZ) await page.keyboard.down(heldZ);
    }
  };
  try {
    for (let tick = 0; tick < 1_200; tick += 1) {
      const state = (await readChapter(page)).journey;
      if (state.kind !== "middle" || state.floor !== floor)
        throw new Error(`Floor ${floor} changed during its encounter`);
      const outcome = state.status?.encounterOutcome;
      if (outcome) {
        routeSequence.push(`floor-${floor}:encounter-${outcome}`);
        return outcome;
      }

      const enemies = state.status?.enemies ?? [];
      const live = enemies
        .filter((enemy) => enemy.health > 0)
        .sort(
          (left, right) =>
            Math.hypot(
              left.position.x - state.player.x,
              left.position.z - state.player.z
            ) -
            Math.hypot(
              right.position.x - state.player.x,
              right.position.z - state.player.z
            )
        );
      const threat = live.find((enemy) => enemy.telegraph);
      if (threat?.telegraph) {
        const dx = state.player.x - threat.telegraph.target.x;
        const dz = state.player.z - threat.telegraph.target.z;
        const awayX = Math.abs(dx) > 0.2 ? (dx > 0 ? "KeyD" : "KeyA") : null;
        const awayZ = Math.abs(dz) > 0.2 ? (dz > 0 ? "KeyS" : "KeyW") : null;
        await setAxes(awayX, awayZ);
        const tell = `${threat.id}:${threat.telegraph.target.x}:${threat.telegraph.target.z}`;
        if (tell !== dodgedTell) {
          await page.keyboard.press("Shift");
          dodgedTell = tell;
        }
      } else if (live[0]) {
        dodgedTell = "";
        const dx = live[0].position.x - state.player.x;
        const dz = live[0].position.z - state.player.z;
        if (Math.hypot(dx, dz) > 1.45) {
          await setAxes(
            Math.abs(dx) > 0.2 ? (dx > 0 ? "KeyD" : "KeyA") : null,
            Math.abs(dz) > 0.2 ? (dz > 0 ? "KeyS" : "KeyW") : null
          );
        } else {
          await setAxes(null, null);
          if (Date.now() >= nextAttackAt) {
            await page.keyboard.press("Space");
            nextAttackAt = Date.now() + 500;
          }
        }
      }
      const moved = Math.hypot(
        state.player.x - last.x,
        state.player.z - last.z
      );
      metrics.distance += moved;
      if ((heldX || heldZ) && moved < 0.015) stuck += 1;
      else stuck = 0;
      if (stuck >= 18) {
        metrics.softlocks += 1;
        throw new Error(
          `Floor ${floor} combat input stalled at ${JSON.stringify(state.player)}; status=${JSON.stringify(state.status)}`
        );
      }
      last = state.player;
      await page.waitForTimeout(45);
    }
  } finally {
    if (heldX) await page.keyboard.up(heldX);
    if (heldZ) await page.keyboard.up(heldZ);
  }
  const state = (await readChapter(page)).journey;
  throw new Error(
    `Floor ${floor} encounter did not resolve; phase=${state.phase}, status=${JSON.stringify(state.status)}`
  );
}

async function playMiddleFloor(
  page: Page,
  floor: number,
  metrics: { distance: number; softlocks: number },
  routeSequence: string[]
): Promise<void> {
  const start = (await readChapter(page)).journey;
  expect(start.kind).toBe("middle");
  expect(start.floor).toBe(floor);
  routeSequence.push(`floor-${floor}:enter`);
  const exit = start.landmarks?.find((landmark) => landmark.role === "exit");
  const offer = start.landmarks?.find((landmark) => landmark.role === "offer");
  const main = start.routes?.find(
    (route) => route.destinationLandmarkId === exit?.id
  )?.points;
  const branch = start.routes?.find(
    (route) => route.destinationLandmarkId === offer?.id
  )?.points;
  if (
    !exit ||
    !offer ||
    !main ||
    !branch ||
    main.length < 2 ||
    branch.length < 2
  )
    throw new Error(`Floor ${floor} is missing its authored route diagnostics`);
  const branchIndex = main.findIndex(
    (point) => Math.hypot(point.x - branch[0]!.x, point.z - branch[0]!.z) < 0.5
  );
  if (branchIndex < 0)
    throw new Error(`Floor ${floor} offer route does not join its exit route`);

  for (const point of main.slice(1, branchIndex + 1)) {
    await steerJourneyTo(page, point, { kind: "middle", floor }, metrics);
    const current = (await readChapter(page)).journey;
    if (current.kind !== "middle" || current.floor !== floor) return;
    if (current.phase === "active")
      await resolveMiddleEncounter(page, floor, routeSequence, metrics);
  }
  let state = (await readChapter(page)).journey;
  if (state.kind !== "middle" || state.floor !== floor) return;
  if (state.phase === "active")
    await resolveMiddleEncounter(page, floor, routeSequence, metrics);
  if (!state.status?.encounterOutcome)
    state = (await readChapter(page)).journey;
  if (!state.status?.encounterOutcome)
    throw new Error(
      `Floor ${floor} route reached its offer without resolving combat`
    );

  for (const point of branch.slice(1))
    await steerJourneyTo(page, point, { kind: "middle", floor }, metrics);
  state = (await readChapter(page)).journey;
  if (state.kind !== "middle" || state.floor !== floor) return;
  expect(
    state.status?.nearOffer,
    `Floor ${floor} offer must be reachable`
  ).toBe(true);
  await page.keyboard.press("1");
  await expect
    .poll(async () => (await readChapter(page)).journey.status?.recruitChoice)
    .toBe("Light");
  routeSequence.push(`floor-${floor}:recommendation-Light`);

  for (const point of branch.slice(0, -1).reverse())
    await steerJourneyTo(page, point, { kind: "middle", floor }, metrics);
  for (const point of main.slice(branchIndex + 1))
    await steerJourneyTo(page, point, { kind: "middle", floor }, metrics);
  await expect
    .poll(
      async () => {
        const current = (await readChapter(page)).journey;
        return current.kind !== "middle" || current.floor !== floor;
      },
      { timeout: 15_000 }
    )
    .toBe(true);
  routeSequence.push(`floor-${floor}:exit-crossed`);
}

async function gatherTownDreamweavers(
  page: Page,
  metrics: { distance: number; softlocks: number },
  routeSequence: string[]
): Promise<void> {
  const state = (await readChapter(page)).journey;
  expect(state.kind).toBe("late");
  expect(state.floor).toBe(7);
  routeSequence.push("floor-7:town-entry");
  const dreamweavers =
    state.landmarks?.filter((landmark) => landmark.kind === "dreamweaver") ??
    [];
  for (const dreamweaver of dreamweavers) {
    await steerJourneyTo(
      page,
      dreamweaver.position,
      { kind: "late", floor: 7 },
      metrics
    );
    await page.keyboard.press("e");
    await expect
      .poll(
        async () =>
          (await readChapter(page)).journey.status?.gatheredDreamweavers?.length
      )
      .toBeGreaterThan(dreamweavers.indexOf(dreamweaver));
    routeSequence.push(`town:gathered-${dreamweaver.id}`);
  }
  await expect
    .poll(async () => {
      const journey = (await readChapter(page)).journey;
      return (
        journey.kind === "late" &&
        journey.floor === 7 &&
        journey.phase === "ready-to-choose" &&
        journey.status?.gatheredDreamweavers?.length === 3
      );
    })
    .toBe(true);
  routeSequence.push("town:ready-to-choose-after-gathering");
}

async function chooseTownExit(
  page: Page,
  metrics: { distance: number; softlocks: number },
  routeSequence: string[]
): Promise<void> {
  const state = (await readChapter(page)).journey;
  expect(state.kind).toBe("late");
  expect(state.floor).toBe(7);
  expect(state.phase).toBe("ready-to-choose");
  const routes = state.routes ?? [];
  const townRoute = routes.find((route) => route.id === "alleys");
  if (!townRoute?.from || !townRoute.to || !townRoute.waypoints?.length)
    throw new Error("Town has no authored plaza exit route diagnostics");
  await steerJourneyTo(
    page,
    { x: 4, z: townRoute.from.z },
    { kind: "late", floor: 7 },
    metrics
  );
  await steerJourneyTo(page, townRoute.from, { kind: "late", floor: 7 }, metrics);
  await page.keyboard.press("2");
  await expect
    .poll(async () => (await readChapter(page)).journey.status?.selectedRoute)
    .toBe("alleys");
  routeSequence.push("town:route-alleys-selected");
  for (const point of [...townRoute.waypoints, townRoute.to])
    await steerJourneyTo(page, point, { kind: "late", floor: 7 }, metrics);
  await expect
    .poll(
      async () => {
        const current = (await readChapter(page)).journey;
        return (
          current.kind === "late" &&
          current.floor === 8 &&
          current.phase === "core-approach"
        );
      },
      { timeout: 15_000 }
    )
    .toBe(true);
  routeSequence.push("floor-7:exit-crossed");
  routeSequence.push("floor-8:stable-core-approach-entry");
}

async function playTownAndFinale(
  page: Page,
  metrics: { distance: number; softlocks: number },
  routeSequence: string[]
): Promise<void> {
  await gatherTownDreamweavers(page, metrics, routeSequence);
  await chooseTownExit(page, metrics, routeSequence);
  const state = (await readChapter(page)).journey;
  const core = state.landmarks?.find(
    (landmark) => landmark.id === "healing-core"
  );
  if (!core) throw new Error("Floor 8 diagnostics omitted the healing core");
  await steerJourneyTo(
    page,
    core.position,
    { kind: "late", floor: 8 },
    metrics,
    2.3
  );
  await expect
    .poll(async () => (await readChapter(page)).journey.phase, {
      timeout: 10_000,
    })
    .toBe("complete");
  routeSequence.push("floor-8:healing-core-complete");
}

test("bot playtest: real input reaches Floor 8 from Begin", async ({
  page,
}, testInfo: TestInfo) => {
  test.setTimeout(480_000);
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
  const routeSequence = ["begin:clicked"];
  await page.waitForFunction(() => {
    const diagnostics = (
      window as unknown as {
        __THREE_GAME_DIAGNOSTICS__?: { state: { frame: number } };
      }
    ).__THREE_GAME_DIAGNOSTICS__;
    return (diagnostics?.state.frame ?? 0) > 10;
  });

  const seedAcknowledgement = await page.evaluate(async () => {
    const hooks = (
      window as unknown as {
        __THREE_GAME_TEST_HOOKS__?: {
          seed(value: string | number): Promise<{ seed: string }>;
        };
      }
    ).__THREE_GAME_TEST_HOOKS__;
    if (!hooks || typeof hooks.seed !== "function")
      throw new Error("Bot playtests require the deterministic seed hook");
    return hooks.seed(472);
  });
  expect(seedAcknowledgement.seed).toBe("472");

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
    routeSequence.push(`ghost-question-${index + 1}:choice-${step.choice}`);
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
  routeSequence.push(`name-entered:${nameStep.value}`);
  await expect
    .poll(async (): Promise<string> => (await readIntro(page)).storyMode)
    .toBe("doorway");

  if (!INPUT_SCRIPT.some((step) => step.kind === "doorway-crossing"))
    throw new Error("Bot script is missing the doorway-crossing step");
  await walkThroughDoorway(page, routeMetrics);
  routeSequence.push("doorway:crossed-by-input");
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
    chapterResults.push(
      await playEarlyRoom(page, step.choice, `bot answer ${index}`)
    );
    routeMetrics.distance += chapterResults[index].distance;
    routeSequence.push(
      `floor-${chapterResults[index].roomIndex + 1}:exit-crossed-by-input`
    );
    await recordStep(introSteps.length + index);
  }
  await expect
    .poll(async () => (await readChapter(page)).phase)
    .toBe("complete");
  await expect
    .poll(
      async () => {
        const journey = (await readChapter(page)).journey;
        return journey.kind === "middle" && journey.floor === 4;
      },
      { timeout: 15_000 }
    )
    .toBe(true);
  routeSequence.push("floor-4:entered-after-floor-3-handoff");
  await playMiddleFloor(page, 4, routeMetrics, routeSequence);
  await expect
    .poll(
      async () => {
        const journey = (await readChapter(page)).journey;
        return (
          journey.kind === "middle" &&
          journey.floor === 5 &&
          journey.phase === null
        );
      },
      { timeout: 15_000 }
    )
    .toBe(true);
  routeSequence.push("floor-5:stable-entry");
  await playMiddleFloor(page, 5, routeMetrics, routeSequence);
  await expect
    .poll(
      async () => {
        const journey = (await readChapter(page)).journey;
        return (
          journey.kind === "middle" &&
          journey.floor === 6 &&
          journey.phase === null
        );
      },
      { timeout: 15_000 }
    )
    .toBe(true);
  routeSequence.push("floor-6:stable-entry");
  await playMiddleFloor(page, 6, routeMetrics, routeSequence);
  await expect
    .poll(
      async () => {
        const journey = (await readChapter(page)).journey;
        return (
          journey.kind === "late" &&
          journey.floor === 7 &&
          journey.phase === "exploring"
        );
      },
      { timeout: 15_000 }
    )
    .toBe(true);
  routeSequence.push("floor-7:stable-town-entry");
  await gatherTownDreamweavers(page, routeMetrics, routeSequence);
  await chooseTownExit(page, routeMetrics, routeSequence);
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
    routeSequence,
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
  expect(
    routeSequence.at(-1),
    "real input must choose a town exit and reach Floor 8"
  ).toBe("floor-8:stable-core-approach-entry");
  expect(report.retryVerified, "restart must restore playable state").toBe(
    true
  );
});
