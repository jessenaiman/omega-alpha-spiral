/**
 * Slice-1 probe: validate the named-state drivers for Floor One against the
 * real stepFloor rules, and find a seed where the door-open driver succeeds.
 *
 * Drivers mirror what src/floor-one/main.ts will run:
 *   guard-intent: walk adjacent to the neutral guard, land one hit (any hit
 *                 result makes it hostile) — intent readable, one strike back.
 *   defeat:       continue waiting adjacent; the hostile guard strikes every
 *                 turn until HP hits 0. The player then moves on (retry).
 *   pickup:       BFS onto the echo-shard tile in the west room.
 *   door-open:    talk while it listens, hit once hostile until it goes down
 *                 (the door clicks open). Seed-dependent — this probe finds one.
 *   exit-ready:   BFS to a tile adjacent to the stairs via the south corridor
 *                 with the door sealed and the guard neutral.
 *   escaped:      step onto the stairs from exit-ready.
 */
import {
  createFloor,
  stepFloor,
  FLOOR_ONE_MAP,
  type Dir,
  type FloorState,
  type Intent,
  type Vec,
} from "../src/game/floor-one";

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

/** BFS over the same passability rules the game uses. Returns move intents. */
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
  if (found === null || found === start) return found === start ? [] : null;
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

function driverGuardIntent(seed: string): { ok: boolean; state: FloorState } {
  let s = walkTo(createFloor(seed), toGuard);
  if (!s.guard || !adjacentTo(s.guard.pos)(s.player.x, s.player.y))
    return { ok: false, state: s };
  s = apply(s, { kind: "hit" }); // any result (hit or miss) makes it hostile
  const hostile = s.guard?.disposition === "hostile" || s.guard === null;
  return { ok: hostile && s.outcome === "ongoing", state: s };
}

function driverDefeat(seed: string): { ok: boolean; state: FloorState } {
  const started = driverGuardIntent(seed);
  let s = started.state;
  for (let i = 0; i < 20 && s.outcome === "ongoing"; i += 1) {
    s = apply(s, { kind: "wait" }); // hostile guard strikes every turn
  }
  return { ok: started.ok && s.outcome === "dead", state: s };
}

function driverPickup(seed: string): { ok: boolean; state: FloorState } {
  let s = walkTo(
    createFloor(seed),
    (st, x, y) => tileAt(st, x, y) === "pickup"
  );
  return { ok: s.pickupTaken, state: s };
}

function driverExitReady(seed: string): { ok: boolean; state: FloorState } {
  let s = walkTo(
    createFloor(seed),
    (st, x, y) => adjacentTo({ x: 18, y: 5 })(x, y) && !(x === 18 && y === 5)
  );
  const ok =
    s.outcome === "ongoing" &&
    adjacentTo({ x: 18, y: 5 })(s.player.x, s.player.y) &&
    !s.doorOpen;
  return { ok, state: s };
}

function driverEscaped(seed: string): { ok: boolean; state: FloorState } {
  let s = driverExitReady(seed).state;
  const path = bfs(s, (_st, x, y) => x === 18 && y === 5);
  if (path) for (const dir of path) s = apply(s, { kind: "move", dir });
  return { ok: s.outcome === "escaped", state: s };
}

function driverDoorOpen(seed: string): { ok: boolean; state: FloorState } {
  let s = walkTo(createFloor(seed), toGuard);
  if (!s.guard || !adjacentTo(s.guard.pos)(s.player.x, s.player.y))
    return { ok: false, state: s };
  for (let i = 0; i < 60 && s.outcome === "ongoing" && !s.doorOpen; i += 1) {
    if (s.guard && s.guard.disposition !== "hostile")
      s = apply(s, { kind: "talk" });
    else s = apply(s, { kind: "hit" });
  }
  return { ok: s.doorOpen && s.outcome === "ongoing", state: s };
}

// --- report ----------------------------------------------------------------

function report(
  name: string,
  seed: string,
  result: { ok: boolean; state: FloorState }
): void {
  const s = result.state;
  console.log(
    `${name.padEnd(12)} seed=${seed.padEnd(10)} ok=${result.ok} outcome=${s.outcome} ` +
      `hp=${s.hp} turns=${s.turns} doorOpen=${s.doorOpen} pickup=${s.pickupTaken} ` +
      `guard=${s.guard ? `${s.guard.disposition}@${s.guard.pos.x},${s.guard.pos.y}(${s.guard.hp})` : "down"} ` +
      `player=${s.player.x},${s.player.y}`
  );
}

const DEFAULT = "floor-1";

console.log(
  "map:",
  `${FLOOR_ONE_MAP.length} rows x ${FLOOR_ONE_MAP[0]?.length} cols`
);
report("guard-intent", DEFAULT, driverGuardIntent(DEFAULT));
report("defeat", DEFAULT, driverDefeat(DEFAULT));
report("pickup", DEFAULT, driverPickup(DEFAULT));
report("exit-ready", DEFAULT, driverExitReady(DEFAULT));
report("escaped", DEFAULT, driverEscaped(DEFAULT));

let doorSeed: string | null = null;
for (let n = 1; n <= 400 && doorSeed === null; n += 1) {
  const candidate = `door-${n}`;
  const result = driverDoorOpen(candidate);
  if (result.ok) {
    doorSeed = candidate;
    report("door-open", candidate, result);
  }
}
if (doorSeed === null)
  console.log("door-open: NO SEED FOUND in door-1..door-400");
