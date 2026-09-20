/**
 * Rogue Descent — pure, deterministic turn rules. No DOM, no Three.js.
 *
 * One step = one turn: the player acts, then every monster acts. Walls block,
 * stepping into a monster attacks, stepping onto the stairs descends a level.
 * All randomness comes from the seeded source, so a seed plus an intent
 * sequence replays the same run.
 */

import { createRng, type SeededRng } from '../../core/random';
import { createDungeon, type Tile, type Vec } from './dungeon';
import { TUNING } from './tuning';

export type Dir = 'n' | 'e' | 's' | 'w';
export type Outcome = 'ongoing' | 'dead';

export type Intent =
  | { kind: 'move'; dir: Dir }
  | { kind: 'wait' }
  | { kind: 'restart' }
  | { kind: 'new-run' };

export interface Monster {
  id: string;
  pos: Vec;
  hp: number;
}

export interface RogueState {
  seed: string;
  depth: number;
  cols: number;
  rows: number;
  tiles: Tile[];
  player: Vec;
  hp: number;
  maxHp: number;
  monsters: Monster[];
  hearts: Vec[];
  messages: string[];
  outcome: Outcome;
  turns: number;
  rng: SeededRng;
}

export type RogueEvent =
  | { type: 'moved'; to: Vec }
  | { type: 'blocked' }
  | { type: 'attack'; target: string; damage: number }
  | { type: 'monster.down'; target: string }
  | { type: 'damage'; amount: number; hp: number }
  | { type: 'heal'; amount: number; hp: number }
  | { type: 'descend'; depth: number }
  | { type: 'death'; cause: string }
  | { type: 'message'; text: string };

export interface RogueTransition {
  state: RogueState;
  events: RogueEvent[];
}

const DIRS: Record<Dir, Vec> = {
  n: { x: 0, y: -1 },
  e: { x: 1, y: 0 },
  s: { x: 0, y: 1 },
  w: { x: -1, y: 0 },
};

const MESSAGE_CAP = 40;

const same = (a: Vec, b: Vec): boolean => a.x === b.x && a.y === b.y;
const adjacent = (a: Vec, b: Vec): boolean => Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1;

function say(state: RogueState, events: RogueEvent[], text: string): void {
  state.messages.push(text);
  if (state.messages.length > MESSAGE_CAP) state.messages.shift();
  events.push({ type: 'message', text });
}

function tileAt(state: RogueState, x: number, y: number): Tile {
  if (x < 0 || y < 0 || x >= state.cols || y >= state.rows) return 'wall';
  return state.tiles[y * state.cols + x] ?? 'wall';
}

function monsterAt(state: RogueState, x: number, y: number): Monster | undefined {
  return state.monsters.find(monster => monster.pos.x === x && monster.pos.y === y);
}

function spawnFloor(state: RogueState, depth: number): void {
  const dungeon = createDungeon(state.seed, depth);
  state.depth = depth;
  state.cols = dungeon.cols;
  state.rows = dungeon.rows;
  state.tiles = dungeon.tiles;
  state.player = { ...dungeon.playerStart };
  state.monsters = dungeon.monsterSpawns.map((pos, index) => ({ id: `m${depth}-${index}`, pos: { ...pos }, hp: TUNING.monsterHp }));
  state.hearts = dungeon.heartSpawn ? [{ ...dungeon.heartSpawn }] : [];
}

export function createRun(seed: string): RogueState {
  const state: RogueState = {
    seed,
    depth: 1,
    cols: 0,
    rows: 0,
    tiles: [],
    player: { x: 0, y: 0 },
    hp: TUNING.playerHp,
    maxHp: TUNING.playerHp,
    monsters: [],
    hearts: [],
    messages: [],
    outcome: 'ongoing',
    turns: 0,
    rng: createRng(seed),
  };
  spawnFloor(state, 1);
  state.messages.push('You enter the descent. Find the stairs.');
  return state;
}

function newSeed(state: RogueState): string {
  return `${state.seed}:new:${state.rng.int(1_000_000)}`;
}

function attack(state: RogueState, events: RogueEvent[], monster: Monster): void {
  monster.hp -= 1;
  events.push({ type: 'attack', target: monster.id, damage: 1 });
  if (monster.hp <= 0) {
    state.monsters = state.monsters.filter(candidate => candidate !== monster);
    events.push({ type: 'monster.down', target: monster.id });
    say(state, events, 'The monster collapses.');
  } else {
    say(state, events, `You hit the monster. ${monster.hp} left.`);
  }
}

function resolveMove(state: RogueState, events: RogueEvent[], dir: Dir): boolean {
  const delta = DIRS[dir];
  const nx = state.player.x + delta.x;
  const ny = state.player.y + delta.y;

  const monster = monsterAt(state, nx, ny);
  if (monster) {
    attack(state, events, monster);
    return true;
  }
  if (tileAt(state, nx, ny) === 'wall') {
    say(state, events, 'Stone blocks the way.');
    return false;
  }

  state.player = { x: nx, y: ny };
  events.push({ type: 'moved', to: { x: nx, y: ny } });

  const heartIndex = state.hearts.findIndex(heart => heart.x === nx && heart.y === ny);
  if (heartIndex !== -1) {
    state.hearts.splice(heartIndex, 1);
    const healed = Math.min(TUNING.heartHeal, state.maxHp - state.hp);
    state.hp += healed;
    events.push({ type: 'heal', amount: healed, hp: state.hp });
    say(state, events, healed > 0 ? `You take the heart. HP ${state.hp}.` : 'The heart is spent.');
  }

  if (tileAt(state, nx, ny) === 'stairs') {
    spawnFloor(state, state.depth + 1);
    events.push({ type: 'descend', depth: state.depth });
    say(state, events, `You descend. Depth ${state.depth}.`);
    return false;
  }

  return true;
}

function monsterPhase(state: RogueState, events: RogueEvent[]): void {
  for (const monster of state.monsters) {
    if (adjacent(monster.pos, state.player)) {
      state.hp -= TUNING.monsterDamage;
      events.push({ type: 'damage', amount: TUNING.monsterDamage, hp: state.hp });
      say(state, events, `A monster strikes you. HP ${Math.max(0, state.hp)}.`);
      continue;
    }
    const dx = Math.sign(state.player.x - monster.pos.x);
    const dy = Math.sign(state.player.y - monster.pos.y);
    const distance = Math.abs(state.player.x - monster.pos.x) + Math.abs(state.player.y - monster.pos.y);
    if (distance > TUNING.aggroRadius) continue;
    const tries: Vec[] = Math.abs(state.player.x - monster.pos.x) >= Math.abs(state.player.y - monster.pos.y)
      ? [{ x: dx, y: 0 }, { x: 0, y: dy }]
      : [{ x: 0, y: dy }, { x: dx, y: 0 }];
    for (const step of tries) {
      if (step.x === 0 && step.y === 0) continue;
      const nx = monster.pos.x + step.x;
      const ny = monster.pos.y + step.y;
      if (tileAt(state, nx, ny) === 'wall') continue;
      if (same({ x: nx, y: ny }, state.player)) continue;
      if (monsterAt(state, nx, ny)) continue;
      monster.pos = { x: nx, y: ny };
      break;
    }
  }
}

function resolveTerminal(state: RogueState, events: RogueEvent[]): void {
  if (state.outcome === 'ongoing' && state.hp <= 0) {
    state.outcome = 'dead';
    events.push({ type: 'death', cause: 'a monster' });
    say(state, events, `A monster ends your descent at depth ${state.depth}. Press R to retry.`);
  }
}

function spendTurn(state: RogueState, events: RogueEvent[]): void {
  state.turns += 1;
  monsterPhase(state, events);
  resolveTerminal(state, events);
}

export function stepRogue(state: RogueState, intent: Intent): RogueTransition {
  const events: RogueEvent[] = [];

  if (intent.kind === 'restart') {
    const next = createRun(state.seed);
    say(next, events, 'Same seed. The descent rebuilds.');
    return { state: next, events };
  }
  if (intent.kind === 'new-run') {
    const next = createRun(newSeed(state));
    say(next, events, 'A new descent.');
    return { state: next, events };
  }
  if (state.outcome !== 'ongoing') return { state, events };

  if (intent.kind === 'move') {
    if (resolveMove(state, events, intent.dir)) spendTurn(state, events);
    return { state, events };
  }

  say(state, events, 'You wait. The dungeon turns.');
  spendTurn(state, events);
  return { state, events };
}
