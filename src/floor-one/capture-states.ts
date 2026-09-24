/**
 * Floor One — named capture states for the canvas inspector.
 *
 * Every state is reached through the real `stepFloor` rules: a driver spends
 * actual intents (move/talk/hit/wait) from a fresh floor until the rules
 * themselves produce the state. Nothing fakes an acknowledgement — if a
 * driver cannot reach its predicate, it throws and the capture fails.
 *
 * Seed notes (verified by `scratch/probe-floor-states.ts`):
 *   guard-intent / defeat / pickup-resolved / exit-ready / escaped are
 *   seed-independent (no random draws on their routes). `door-open` depends
 *   on Talk rolls, so it starts from DOOR_OPEN_SEED, the seed the probe
 *   proved opens the door with the guard left friendly and the player
 *   unhurt. Defeat ends in a defeat that moves on (retry), never a
 *   final ending — the fight is placeholder while assets still load.
 */
import {
  createFloor,
  stepFloor,
  type Dir,
  type FloorState,
  type Intent,
  type Vec,
} from "../game/floor-one";

/** Probed seed where the door-open driver succeeds deterministically. */
export const DOOR_OPEN_SEED = "door-1";

export const CAPTURE_STATE_NAMES = [
  "entry",
  "pause",
  "guard-intent",
  "pickup-resolved",
  "door-open",
  "exit-ready",
  "escaped",
  "defeat",
] as const;

export type CaptureStateName = (typeof CAPTURE_STATE_NAMES)[number];

export function isCaptureState(name: string): name is CaptureStateName {
  return (CAPTURE_STATE_NAMES as readonly string[]).includes(name);
}

export interface CaptureResult {
  readonly state: FloorState;
  readonly paused: boolean;
}

const DIRS: Record<Dir, Vec> = {
  n: { x: 0, y: -1 },
  e: { x: 1, y: 0 },
  s: { x: 0, y: 1 },
  w: { x: -1, y: 0 },
};

const adjacentTo =
  (v: Vec) =>
  (x: number, y: number): boolean =>
    Math.abs(x - v.x) + Math.abs(y - v.y) === 1;

function tileAt(s: FloorState, x: number, y: number): string {
  if (x < 0 || y < 0 || x >= s.cols || y >= s.rows) return "wall";
  return s.tiles[y * s.cols + x] ?? "wall";
}

/** BFS over the same passability rules the game enforces. */
function bfs(
  s: FloorState,
  goal: (state: FloorState, x: number, y: number) => boolean
): Dir[] | null {
  const key = (x: number, y: number): number => y * s.cols + x;
  const start = key(s.player.x, s.player.y);
  const prev = new Map<number, number>([[start, start]]);
  const via = new Map<number, Dir>();
  const queue: number[] = [start];
  let head = 0;
  let found: number | null = null;
  while (head < queue.length) {
    const cur = queue[head++];
    const cx = cur % s.cols;
    const cy = Math.floor(cur / s.cols);
    if (goal(s, cx, cy)) {
      found = cur;
      break;
    }
    for (const dir of ["n", "e", "s", "w"] as const) {
      const d = DIRS[dir];
      const nx = cx + d.x;
      const ny = cy + d.y;
      if (nx < 0 || ny < 0 || nx >= s.cols || ny >= s.rows) continue;
      const nk = key(nx, ny);
      if (prev.has(nk)) continue;
      const tile = tileAt(s, nx, ny);
      if (tile === "wall") continue;
      if (tile === "door" && !s.doorOpen) continue;
      if (s.guard && s.guard.pos.x === nx && s.guard.pos.y === ny) continue;
      prev.set(nk, cur);
      via.set(nk, dir);
      queue.push(nk);
    }
  }
  if (found === null) return null;
  if (found === start) return [];
  const path: Dir[] = [];
  let cursor = found;
  while (cursor !== start) {
    const dir = via.get(cursor);
    if (dir === undefined) return null;
    path.push(dir);
    cursor = prev.get(cursor) as number;
  }
  return path.reverse();
}

function apply(s: FloorState, intent: Intent): FloorState {
  return stepFloor(s, intent).state;
}

function walkTo(
  s: FloorState,
  goal: (state: FloorState, x: number, y: number) => boolean,
  cap = 300
): FloorState {
  let cur = s;
  for (let i = 0; i < cap; i += 1) {
    if (goal(cur, cur.player.x, cur.player.y)) return cur;
    const path = bfs(cur, goal);
    if (!path || path.length === 0) return cur;
    cur = apply(cur, { kind: "move", dir: path[0] as Dir });
    if (cur.outcome !== "ongoing") return cur;
  }
  return cur;
}

const toGuard = (s: FloorState, x: number, y: number): boolean =>
  s.guard ? adjacentTo(s.guard.pos)(x, y) : false;

function fail(name: string, s: FloorState): never {
  throw new Error(
    `capture state "${name}" could not be reached: outcome=${s.outcome} hp=${s.hp} ` +
      `doorOpen=${s.doorOpen} pickup=${s.pickupTaken} player=${s.player.x},${s.player.y}`
  );
}

// --- drivers ---------------------------------------------------------------

function driverGuardIntent(seed: string): FloorState {
  let s = walkTo(createFloor(seed), toGuard);
  if (
    !s.guard ||
    !adjacentTo(s.guard.pos)(s.player.x, s.player.y) ||
    s.outcome !== "ongoing"
  ) {
    fail("guard-intent", s);
  }
  s = apply(s, { kind: "hit" }); // any result — hit or miss — makes it hostile
  const hostile = s.guard !== null && s.guard.disposition === "hostile";
  if (!hostile || s.outcome !== "ongoing") fail("guard-intent", s);
  return s;
}

function driverDefeat(seed: string): FloorState {
  let s = driverGuardIntent(seed);
  for (let i = 0; i < 20 && s.outcome === "ongoing"; i += 1) {
    s = apply(s, { kind: "wait" }); // the hostile guard strikes every turn
  }
  if (s.outcome !== "dead") fail("defeat", s);
  return s;
}

function driverPickup(seed: string): FloorState {
  const s = walkTo(
    createFloor(seed),
    (st, x, y) => tileAt(st, x, y) === "pickup"
  );
  if (!s.pickupTaken) fail("pickup-resolved", s);
  return s;
}

function driverExitReady(seed: string): FloorState {
  const s = walkTo(createFloor(seed), (_st, x, y) =>
    adjacentTo({ x: 18, y: 5 })(x, y)
  );
  const ok =
    s.outcome === "ongoing" &&
    adjacentTo({ x: 18, y: 5 })(s.player.x, s.player.y) &&
    !s.doorOpen;
  if (!ok) fail("exit-ready", s);
  return s;
}

function driverEscaped(seed: string): FloorState {
  let s = driverExitReady(seed);
  const path = bfs(s, (_st, x, y) => x === 18 && y === 5);
  if (path) for (const dir of path) s = apply(s, { kind: "move", dir });
  if (s.outcome !== "escaped") fail("escaped", s);
  return s;
}

function driverDoorOpen(seed: string): FloorState {
  let s = walkTo(createFloor(seed), toGuard);
  if (!s.guard || !adjacentTo(s.guard.pos)(s.player.x, s.player.y))
    fail("door-open", s);
  for (let i = 0; i < 60 && s.outcome === "ongoing" && !s.doorOpen; i += 1) {
    if (s.guard && s.guard.disposition !== "hostile")
      s = apply(s, { kind: "talk" });
    else s = apply(s, { kind: "hit" });
  }
  if (!s.doorOpen || s.outcome !== "ongoing") fail("door-open", s);
  return s;
}

// --- entry point -----------------------------------------------------------

/**
 * Drive a fresh floor to the requested capture state through real rules.
 * `current` only supplies the seed for seed-independent states.
 */
export function applyCaptureState(
  name: CaptureStateName,
  current: FloorState
): CaptureResult {
  switch (name) {
    case "entry":
      return { state: createFloor(current.seed), paused: false };
    case "pause":
      return { state: createFloor(current.seed), paused: true };
    case "guard-intent":
      return { state: driverGuardIntent(current.seed), paused: false };
    case "pickup-resolved":
      return { state: driverPickup(current.seed), paused: false };
    case "door-open":
      return { state: driverDoorOpen(DOOR_OPEN_SEED), paused: false };
    case "exit-ready":
      return { state: driverExitReady(current.seed), paused: false };
    case "escaped":
      return { state: driverEscaped(current.seed), paused: false };
    case "defeat":
      return { state: driverDefeat(current.seed), paused: false };
  }
}
