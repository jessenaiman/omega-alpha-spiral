/**
 * Floor One — pure, deterministic rules for the modern roguelike floor.
 *
 * One authored grid (no procedural floors). The player uses cardinal movement,
 * Wait, Talk, Hit, and Run to reach the stairs while one Threshold Guard acts
 * only on elapsed turns. Visibility has three states (unknown / remembered /
 * currently visible); remembered terrain keeps no stale entity positions. All
 * randomness comes from the seeded source, so a seed plus an input sequence
 * replays the same floor.
 *
 * No DOM, no Three.js, no Math.random. Presentation consumes this seam.
 */

import { createRng, type SeededRng } from '../core/random';

export type Dir = 'n' | 'e' | 's' | 'w';
export type Tile = 'wall' | 'floor' | 'door' | 'pickup' | 'stairs';
export type Disposition = 'neutral' | 'friendly' | 'suspicious' | 'hostile';
export type Outcome = 'ongoing' | 'dead' | 'escaped';

export interface Vec {
  x: number;
  y: number;
}

export type Intent =
  | { kind: 'move'; dir: Dir }
  | { kind: 'wait' }
  | { kind: 'talk' }
  | { kind: 'hit' }
  | { kind: 'run'; dir: Dir }
  | { kind: 'inspect' }
  | { kind: 'retry' }
  | { kind: 'new-run'; seed?: string | number };

export type FloorEvent =
  | { type: 'moved'; to: Vec }
  | { type: 'blocked'; reason: string }
  | { type: 'message'; text: string }
  | { type: 'disposition'; value: Disposition }
  | { type: 'hit'; target: 'guard'; damage: number }
  | { type: 'miss'; target: 'guard' }
  | { type: 'damage'; amount: number; hp: number }
  | { type: 'pickup'; heal: number }
  | { type: 'door'; open: boolean }
  | { type: 'guard.down' }
  | { type: 'pursuit'; to: Vec }
  | { type: 'death'; cause: string }
  | { type: 'exit' };

export interface Guard {
  pos: Vec;
  hp: number;
  disposition: Disposition;
}

export interface FloorState {
  seed: string;
  cols: number;
  rows: number;
  tiles: Tile[];
  player: Vec;
  hp: number;
  maxHp: number;
  guard: Guard | null;
  doorOpen: boolean;
  pickupTaken: boolean;
  visible: boolean[];
  seen: boolean[];
  messages: string[];
  outcome: Outcome;
  turns: number;
  rng: SeededRng;
}

// --- the one authored floor -------------------------------------------------

const MAP: readonly string[] = [
  '#####################',
  '#@........#.........#',
  '#.........#.........#',
  '#..#####..#.........#',
  '#..#...#..#.........#',
  '#..#.*...G+.......>.#',
  '#..#...#..#.........#',
  '#..#####..#.........#',
  '#.........#.........#',
  '#...................#',
  '#...................#',
  '#####################',
];

export const FLOOR_ONE_MAP = MAP;
export const SIGHT_RADIUS = 7;
export const MAX_HP = 6;
export const GUARD_HP = 4;
export const RUN_MAX_STEPS = 8;

const DIRS: Record<Dir, Vec> = {
  n: { x: 0, y: -1 },
  e: { x: 1, y: 0 },
  s: { x: 0, y: 1 },
  w: { x: -1, y: 0 },
};

const MESSAGE_CAP = 40;

// --- helpers -----------------------------------------------------------------

function idx(state: FloorState, x: number, y: number): number {
  return y * state.cols + x;
}

function inBounds(state: FloorState, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < state.cols && y < state.rows;
}

function tileAt(state: FloorState, x: number, y: number): Tile {
  return inBounds(state, x, y) ? (state.tiles[idx(state, x, y)] ?? 'wall') : 'wall';
}

function same(a: Vec, b: Vec): boolean {
  return a.x === b.x && a.y === b.y;
}

function adjacent(a: Vec, b: Vec): boolean {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;
}

function say(state: FloorState, events: FloorEvent[], text: string): void {
  state.messages.push(text);
  if (state.messages.length > MESSAGE_CAP) state.messages.shift();
  events.push({ type: 'message', text });
}

function blocksSight(state: FloorState, x: number, y: number): boolean {
  const tile = tileAt(state, x, y);
  return tile === 'wall' || (tile === 'door' && !state.doorOpen);
}

function passable(state: FloorState, x: number, y: number): boolean {
  const tile = tileAt(state, x, y);
  if (tile === 'wall') return false;
  if (tile === 'door' && !state.doorOpen) return false;
  if (state.guard && state.guard.pos.x === x && state.guard.pos.y === y) return false;
  return true;
}

/** Bresenham line of sight. ponytail: O(cells) per tile, fine on a 21x12 grid. */
function hasLineOfSight(state: FloorState, from: Vec, to: Vec): boolean {
  let x0 = from.x;
  let y0 = from.y;
  const dx = Math.abs(to.x - x0);
  const dy = Math.abs(to.y - y0);
  const sx = x0 < to.x ? 1 : -1;
  const sy = y0 < to.y ? 1 : -1;
  let err = dx - dy;
  for (;;) {
    if (x0 === to.x && y0 === to.y) return true;
    if (!(x0 === from.x && y0 === from.y) && blocksSight(state, x0, y0)) return false;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x0 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y0 += sy;
    }
  }
}

function computeVisibility(state: FloorState): void {
  state.visible.fill(false);
  const radius2 = SIGHT_RADIUS * SIGHT_RADIUS;
  for (let y = 0; y < state.rows; y += 1) {
    for (let x = 0; x < state.cols; x += 1) {
      const dx = x - state.player.x;
      const dy = y - state.player.y;
      if (dx * dx + dy * dy > radius2) continue;
      if (!hasLineOfSight(state, state.player, { x, y })) continue;
      state.visible[idx(state, x, y)] = true;
      state.seen[idx(state, x, y)] = true;
    }
  }
  state.visible[idx(state, state.player.x, state.player.y)] = true;
  state.seen[idx(state, state.player.x, state.player.y)] = true;
}

function guardSeesPlayer(state: FloorState): boolean {
  const guard = state.guard;
  if (!guard) return false;
  const dx = guard.pos.x - state.player.x;
  const dy = guard.pos.y - state.player.y;
  if (dx * dx + dy * dy > SIGHT_RADIUS * SIGHT_RADIUS) return false;
  return hasLineOfSight(state, guard.pos, state.player);
}

// --- construction ------------------------------------------------------------

function newSeed(state: FloorState): string {
  return `${state.seed}:new:${state.rng.int(1_000_000)}`;
}

export function createFloor(seed: string | number): FloorState {
  const label = String(seed);
  const rows = MAP.length;
  const cols = (MAP[0] ?? '').length;
  const tiles: Tile[] = [];
  let player: Vec = { x: 1, y: 1 };
  let guardSpawn: Vec = { x: 0, y: 0 };
  for (let y = 0; y < rows; y += 1) {
    const row = MAP[y] ?? '';
    for (let x = 0; x < cols; x += 1) {
      const ch = row[x] ?? '#';
      tiles.push(ch === '#' ? 'wall' : ch === '+' ? 'door' : ch === '*' ? 'pickup' : ch === '>' ? 'stairs' : 'floor');
      if (ch === '@') player = { x, y };
      if (ch === 'G') guardSpawn = { x, y };
    }
  }
  const state: FloorState = {
    seed: label,
    cols,
    rows,
    tiles,
    player,
    hp: MAX_HP,
    maxHp: MAX_HP,
    guard: { pos: guardSpawn, hp: GUARD_HP, disposition: 'neutral' },
    doorOpen: false,
    pickupTaken: false,
    visible: new Array<boolean>(cols * rows).fill(false),
    seen: new Array<boolean>(cols * rows).fill(false),
    messages: [],
    outcome: 'ongoing',
    turns: 0,
    rng: createRng(label),
  };
  computeVisibility(state);
  state.messages.push('You wake on Floor One. Three ways past the guard: Talk, Hit, Run.');
  return state;
}

// --- verbs -------------------------------------------------------------------

function resolveHit(state: FloorState, events: FloorEvent[]): boolean {
  const guard = state.guard;
  if (!guard || !adjacent(state.player, guard.pos)) {
    say(state, events, 'Nothing to hit there.');
    return false;
  }
  if (state.rng.next() > 0.28) {
    guard.hp -= 1;
    events.push({ type: 'hit', target: 'guard', damage: 1 });
    if (guard.hp <= 0) {
      state.guard = null;
      state.doorOpen = true;
      events.push({ type: 'guard.down' });
      events.push({ type: 'door', open: true });
      say(state, events, 'The Threshold Guard ends. The door clicks open.');
    } else {
      say(state, events, `You strike the guard. ${guard.hp} left.`);
      guard.disposition = 'hostile';
      events.push({ type: 'disposition', value: 'hostile' });
    }
  } else {
    events.push({ type: 'miss', target: 'guard' });
    say(state, events, 'The guard slips your strike.');
    guard.disposition = 'hostile';
    events.push({ type: 'disposition', value: 'hostile' });
  }
  return true;
}

function resolveTalk(state: FloorState, events: FloorEvent[]): boolean {
  const guard = state.guard;
  if (!guard || !adjacent(state.player, guard.pos)) {
    say(state, events, 'No one is close enough to hear you.');
    return false;
  }
  const roll = state.rng.next();
  if (guard.disposition === 'neutral') {
    if (roll < 0.5) {
      guard.disposition = 'friendly';
      state.doorOpen = true;
      events.push({ type: 'disposition', value: 'friendly' });
      events.push({ type: 'door', open: true });
      say(state, events, 'You name the loop. The guard lowers its weapon and opens the door.');
    } else {
      guard.disposition = 'suspicious';
      events.push({ type: 'disposition', value: 'suspicious' });
      say(state, events, 'The guard does not answer. It watches you.');
    }
  } else if (guard.disposition === 'suspicious') {
    if (roll < 0.55) {
      guard.disposition = 'friendly';
      state.doorOpen = true;
      events.push({ type: 'disposition', value: 'friendly' });
      events.push({ type: 'door', open: true });
      say(state, events, 'The guard remembers you. The door opens.');
    } else {
      guard.disposition = 'hostile';
      events.push({ type: 'disposition', value: 'hostile' });
      say(state, events, 'The guard decides you are the intruder.');
    }
  } else if (guard.disposition === 'hostile') {
    say(state, events, 'It will not talk. Hit it, or Run.');
  } else {
    say(state, events, 'The guard keeps the door open for you.');
  }
  return true;
}

function enterTile(state: FloorState, events: FloorEvent[], x: number, y: number): void {
  state.player = { x, y };
  events.push({ type: 'moved', to: { x, y } });
  const tile = tileAt(state, x, y);
  if (tile === 'stairs') {
    state.outcome = 'escaped';
    events.push({ type: 'exit' });
    say(state, events, 'You take the stairs. Floor One ends; the next era waits.');
    return;
  }
  if (tile === 'pickup' && !state.pickupTaken) {
    state.pickupTaken = true;
    const heal = Math.min(2, state.maxHp - state.hp);
    state.hp += heal;
    events.push({ type: 'pickup', heal });
    say(state, events, heal > 0 ? `You take the echo shard. HP ${state.hp}.` : 'You take the echo shard. You are already whole.');
  }
}

function resolveMove(state: FloorState, events: FloorEvent[], dir: Dir): boolean {
  const delta = DIRS[dir];
  const nx = state.player.x + delta.x;
  const ny = state.player.y + delta.y;
  const guard = state.guard;
  if (guard && guard.pos.x === nx && guard.pos.y === ny) return resolveHit(state, events);
  if (tileAt(state, nx, ny) === 'door' && !state.doorOpen) {
    say(state, events, 'The door is sealed. Talk to the guard, or take the long way round.');
    return false;
  }
  if (!inBounds(state, nx, ny) || tileAt(state, nx, ny) === 'wall') {
    say(state, events, 'Old output blocks the way.');
    return false;
  }
  enterTile(state, events, nx, ny);
  return true;
}

function shouldStop(state: FloorState): boolean {
  const guard = state.guard;
  if (guard) {
    const dist = Math.abs(guard.pos.x - state.player.x) + Math.abs(guard.pos.y - state.player.y);
    if (dist <= 2 && guardSeesPlayer(state)) return true;
  }
  for (const dir of ['n', 'e', 's', 'w'] as const) {
    const delta = DIRS[dir];
    const tile = tileAt(state, state.player.x + delta.x, state.player.y + delta.y);
    if (tile === 'door' || tile === 'pickup' || tile === 'stairs') return true;
  }
  return false;
}

function guardPhase(state: FloorState, events: FloorEvent[]): void {
  const guard = state.guard;
  if (!guard) return;
  const chase = guard.disposition === 'hostile' || guard.disposition === 'suspicious';
  if (!chase || !guardSeesPlayer(state)) return;
  if (adjacent(guard.pos, state.player)) {
    state.hp -= 1;
    events.push({ type: 'damage', amount: 1, hp: state.hp });
    say(state, events, `The guard strikes you. HP ${Math.max(0, state.hp)}.`);
    return;
  }
  const options: Vec[] = [];
  for (const dir of ['e', 'w', 'n', 's'] as const) {
    const delta = DIRS[dir];
    const nx = guard.pos.x + delta.x;
    const ny = guard.pos.y + delta.y;
    if (!passable(state, nx, ny)) continue;
    if (same({ x: nx, y: ny }, state.player)) continue;
    options.push({ x: nx, y: ny });
  }
  if (options.length === 0) return;
  options.sort((a, b) => {
    const da = Math.abs(a.x - state.player.x) + Math.abs(a.y - state.player.y);
    const db = Math.abs(b.x - state.player.x) + Math.abs(b.y - state.player.y);
    return da - db;
  });
  const step = options[0];
  if (!step) return;
  guard.pos = step;
  events.push({ type: 'pursuit', to: { ...step } });
}

function resolveTerminal(state: FloorState, events: FloorEvent[]): void {
  if (state.outcome !== 'ongoing') return;
  if (state.hp <= 0) {
    state.outcome = 'dead';
    events.push({ type: 'death', cause: 'the Threshold Guard' });
    say(state, events, 'The Threshold Guard ends you. Press Enter to retry the same seed.');
  }
}

// --- the transition ----------------------------------------------------------

export interface FloorTransition {
  state: FloorState;
  events: FloorEvent[];
}

function spendTurn(state: FloorState, events: FloorEvent[]): void {
  state.turns += 1;
  guardPhase(state, events);
  computeVisibility(state);
  resolveTerminal(state, events);
}

function runSequence(state: FloorState, events: FloorEvent[], dir: Dir): void {
  for (let step = 0; step < RUN_MAX_STEPS; step += 1) {
    if (state.outcome !== 'ongoing') return;
    if (shouldStop(state)) {
      say(state, events, 'You stop. Something ahead.');
      return;
    }
    const moved = resolveMove(state, events, dir);
    if (!moved) return;
    if (state.outcome !== 'ongoing') return;
    spendTurn(state, events);
  }
}

export function stepFloor(state: FloorState, intent: Intent): FloorTransition {
  const events: FloorEvent[] = [];

  if (intent.kind === 'retry') {
    const next = createFloor(state.seed);
    say(next, events, 'Same seed. The floor rebuilds itself.');
    return { state: next, events };
  }
  if (intent.kind === 'new-run') {
    const next = createFloor(intent.seed ?? newSeed(state));
    say(next, events, 'New run. A different floor.');
    return { state: next, events };
  }
  if (state.outcome !== 'ongoing') return { state, events, };

  if (intent.kind === 'inspect') {
    const guard = state.guard;
    const guardText = guard ? `The Threshold Guard is ${guard.disposition}.` : 'The threshold is clear.';
    say(state, events, `You are at ${state.player.x},${state.player.y}. Door ${state.doorOpen ? 'open' : 'sealed'}. ${guardText} (no turn spent)`);
    return { state, events };
  }

  if (intent.kind === 'move') {
    if (resolveMove(state, events, intent.dir)) spendTurn(state, events);
    return { state, events };
  }
  if (intent.kind === 'run') {
    runSequence(state, events, intent.dir);
    return { state, events };
  }
  if (intent.kind === 'wait') {
    say(state, events, 'You wait. The loop turns.');
    spendTurn(state, events);
    return { state, events };
  }
  if (intent.kind === 'talk') {
    if (resolveTalk(state, events)) spendTurn(state, events);
    return { state, events };
  }
  if (intent.kind === 'hit') {
    if (resolveHit(state, events)) spendTurn(state, events);
    return { state, events };
  }

  return { state, events };
}
