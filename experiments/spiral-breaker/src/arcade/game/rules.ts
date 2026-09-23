/**
 * Spiral Breaker — the pure rules.
 *
 * No DOM, no Three.js, no browser clock, no unseeded randomness. The whole game
 * is one `step(world, dt, commands)` now; every spawn draw comes from the seeded
 * generator held by the world, so the same seed and the same command sequence
 * produce an identical event trace — that is the determinism contract the
 * acceptance hooks depend on.
 *
 * Phases:
 *   menu       — a ghost-driven endless demo world; any start intent opens a run.
 *   play       — an active run. Holds `ghostDriving` while the autopilot steers.
 *   game-over  — frozen results; a start intent launches the next run.
 *   victory    — the gauntlet was cleared; same hand-off as game-over, won.
 *
 * Encounter kinds:
 *   standard  — the dart. Break it or it breaches.
 *   splitter  — cracks into two fast minis when dashed; minis spawn only with
 *               cap headroom, so popping it near a full field buys nothing.
 *   mini      — a fast fragment of a splitter; small and quick.
 *   heart     — a fragment of the core. Destroying it (or letting it arrive)
 *               heals one integrity pip; a full core pays bonus points.
 *   shielded  — a frontal cone faces the core; a dash inside that cone bounces
 *               ('shard.blocked'), a flank dash breaks it.
 *   pulsar    — a rhythm hazard. Emits a 360° ring on a fixed-step cooldown;
 *               anything inside its reach when the ring fires is knocked back
 *               (no integrity loss). Dashing the pulsar kills it before it
 *               can ever fire.
 *
 * Event types are the only seam between rules and presentation. Presentation
 * reacts; it never decides score, health, or collision.
 */

import type { Intents } from "../../../../src/core/input";
import {
  createRng,
  normalizeSeed,
  type SeededRng,
} from "../../../../src/core/random";
import { TUNING, distanceSq, type Vec2 } from "./tuning";

export type Phase = "menu" | "play" | "game-over" | "victory";

export type ShardKind =
  "standard" | "splitter" | "mini" | "heart" | "shielded" | "pulsar";

export interface Shard {
  readonly id: number;
  pos: Vec2;
  /** Direction of travel, straight toward the core. */
  readonly bearing: number;
  readonly speed: number;
  /** Wobbles across its line when true (wave 3+). */
  readonly drifter: boolean;
  readonly driftPhase: number;
  readonly variant: number;
  readonly kind: ShardKind;
  /** Fresh minis are ignored by collision for this many seconds. */
  grace: number;
  /** Pulsars only: seconds until the next ring fires. Ignored for other kinds. */
  pulseTimer: number;
  alive: boolean;
}

export interface PlayerState {
  pos: Vec2;
  vel: Vec2;
  /** Seconds still spent dashing. */
  dashTime: number;
  /** Seconds until the dash is ready again. */
  dashCooldown: number;
  readonly dashDir: Vec2;
  /** Seconds of knockback stun remaining. */
  stun: number;
  /** Seconds of post-hit invulnerability remaining. */
  invuln: number;
  /** Last non-zero facing, so a dash with no input still has a direction. */
  readonly facing: Vec2;
}

export type ArcadeEvent =
  | {
      readonly type: "run.begin";
      readonly seed: string;
      readonly runNumber: number;
    }
  | { readonly type: "wave.start"; readonly wave: number }
  | {
      readonly type: "shard.spawn";
      readonly id: number;
      readonly x: number;
      readonly y: number;
      readonly bearing: number;
      readonly variant: number;
      readonly drifter: boolean;
      readonly kind: ShardKind;
    }
  | {
      readonly type: "shard.destroy";
      readonly id: number;
      readonly x: number;
      readonly y: number;
      readonly kind: ShardKind;
    }
  | {
      readonly type: "shard.blocked";
      readonly id: number;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly type: "pulsar.pulse";
      readonly id: number;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly type: "core.heal";
      readonly integrity: number;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly type: "score.change";
      readonly score: number;
      readonly gained: number;
      readonly chain: number;
    }
  | { readonly type: "chain.reset" }
  | { readonly type: "dash.start"; readonly x: number; readonly y: number }
  | {
      readonly type: "player.knockback";
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly type: "core.breach";
      readonly integrity: number;
      readonly x: number;
      readonly y: number;
    }
  | {
      readonly type: "game.over";
      readonly victory: boolean;
      readonly score: number;
      readonly bonus: number;
      readonly wave: number;
      readonly best: number;
    }
  | { readonly type: "ghost.takeover" }
  | { readonly type: "ghost.release" };

export interface Commands {
  readonly intents: Intents;
  /** True when the intents came from the autopilot, not a human. */
  readonly fromAutopilot: boolean;
  /** A start intent (dash/act in menu, or any start on results). */
  readonly start: boolean;
  /** True when the human took any action this step (opposite of autopilot). */
  readonly humanActive: boolean;
}

export const IDLE_COMMANDS: Commands = Object.freeze({
  intents: { moveX: 0, moveY: 0, dash: false, act: false, pause: false },
  fromAutopilot: false,
  start: false,
  humanActive: false,
});

export interface WorldState {
  seed: string;
  runNumber: number;
  phase: Phase;
  time: number;
  wave: number;
  waveTime: number;
  score: number;
  best: number;
  chain: number;
  chainWindow: number;
  integrity: number;
  shards: Shard[];
  player: PlayerState;
  ghostDriving: boolean;
  idleTime: number;
  /** Countdown to the next shard spawn, in seconds. */
  nextSpawnIn: number;
  rng: SeededRng;
  steps: number;
}

export function createPlayer(): PlayerState {
  return {
    pos: { x: TUNING.spawnWaypointRadius, y: 0 },
    vel: { x: 0, y: 0 },
    dashTime: 0,
    dashCooldown: 0,
    dashDir: { x: 1, y: 0 },
    stun: 0,
    invuln: 0,
    facing: { x: 1, y: 0 },
  };
}

/** A fresh world; `menu` phase with the ghost already driving, so it is watchable immediately. */
export function createWorld(
  seed: string | number,
  best = 0,
  runNumber = 0
): WorldState {
  return {
    seed: normalizeSeed(seed),
    runNumber,
    phase: "menu",
    time: 0,
    wave: 1,
    waveTime: 0,
    score: 0,
    best,
    chain: 0,
    chainWindow: 0,
    integrity: TUNING.maxIntegrity,
    shards: [],
    player: createPlayer(),
    ghostDriving: true,
    idleTime: TUNING.ghostIdleTriggerSec,
    nextSpawnIn: 0.2,
    rng: createRng(normalizeSeed(seed)).fork("arcade"),
    steps: 0,
  };
}

/** Replace `target`'s contents with a fresh world built from `seed`. */
function resetWorldInto(
  target: WorldState,
  seed: string | number,
  best: number,
  runNumber: number
): void {
  const fresh = createWorld(seed, best, runNumber);
  target.seed = fresh.seed;
  target.runNumber = fresh.runNumber;
  target.phase = fresh.phase;
  target.time = fresh.time;
  target.wave = fresh.wave;
  target.waveTime = fresh.waveTime;
  target.score = fresh.score;
  target.best = fresh.best;
  target.chain = fresh.chain;
  target.chainWindow = fresh.chainWindow;
  target.integrity = fresh.integrity;
  target.shards = fresh.shards;
  target.player = fresh.player;
  target.ghostDriving = fresh.ghostDriving;
  target.idleTime = fresh.idleTime;
  target.nextSpawnIn = fresh.nextSpawnIn;
  target.rng = fresh.rng;
  target.steps = fresh.steps;
}

/**
 * Begin a fresh run in place: resets the world to wave 1 at zero score and
 * returns the opening events. Preserves `best` across runs; increments the run
 * number. Reusing the same seed keeps a re-run byte-identical.
 */
export function resetForRun(
  world: WorldState,
  seed: string | number = world.seed
): ArcadeEvent[] {
  const best = world.best;
  resetWorldInto(world, seed, best, world.runNumber + 1);
  world.phase = "play";
  world.ghostDriving = false;
  world.idleTime = 0;
  return [
    { type: "run.begin", seed: world.seed, runNumber: world.runNumber },
    { type: "wave.start", wave: world.wave },
  ];
}

/**
 * Advance the world by one fixed step. `dt` is the fixed step in seconds.
 * Returns the events the step produced; presentation consumes, never mutates.
 */
export function step(
  world: WorldState,
  dt: number,
  commands: Commands
): ArcadeEvent[] {
  const events: ArcadeEvent[] = [];
  world.steps += 1;

  if (world.phase === "menu") {
    if (commands.start) return resetForRun(world);
    return events;
  }

  if (world.phase === "game-over" || world.phase === "victory") {
    if (commands.start) return resetForRun(world);
    return events;
  }

  // The ghost keeps the world alive when nobody has input for a while.
  if (!commands.fromAutopilot && commands.humanActive && world.ghostDriving) {
    world.ghostDriving = false;
    world.idleTime = 0;
    events.push({ type: "ghost.release" });
  } else if (!commands.fromAutopilot) {
    world.idleTime = 0;
  } else if (world.ghostDriving) {
    world.idleTime = TUNING.ghostIdleTriggerSec;
  } else {
    world.idleTime += dt;
    if (world.idleTime >= TUNING.ghostIdleTriggerSec) {
      world.ghostDriving = true;
      world.idleTime = TUNING.ghostIdleTriggerSec;
      events.push({ type: "ghost.takeover" });
    }
  }

  world.time += dt;
  world.waveTime += dt;

  // Where the player stood as this step began: a dash is legitimately aimed
  // at a shielded shard when it DEPARTS from outside the frontal cone, even
  // if the flight and the contact land inside it.
  const approach: Vec2 = { x: world.player.pos.x, y: world.player.pos.y };
  updatePlayer(world, dt, commands, events);
  const pulsed = updateShards(world, dt);
  resolveContacts(world, dt, events, approach);
  // A pulse fires only if its pulsar survived the step, so dashing a pulsar
  // that is about to pulse kills it before the ring can ever go off.
  firePulses(world, pulsed, events);

  updateWave(world, events);
  updateSpawning(world, dt, events);

  if (world.integrity <= 0 && world.phase === "play") {
    world.phase = "game-over";
    world.ghostDriving = false;
    if (world.score > world.best) world.best = world.score;
    events.push({
      type: "game.over",
      victory: false,
      score: world.score,
      bonus: 0,
      wave: world.wave,
      best: world.best,
    });
  }

  return events;
}

function updatePlayer(
  world: WorldState,
  dt: number,
  commands: Commands,
  events: ArcadeEvent[]
): void {
  const player = world.player;

  if (player.stun > 0) {
    player.stun = Math.max(0, player.stun - dt);
    player.invuln = Math.max(0, player.invuln - dt);
    return;
  }
  if (player.invuln > 0) player.invuln = Math.max(0, player.invuln - dt);

  if (player.dashTime > 0) {
    player.dashTime -= dt;
    player.pos.x += player.dashDir.x * TUNING.dashSpeed * dt;
    player.pos.y += player.dashDir.y * TUNING.dashSpeed * dt;
    if (player.dashTime <= 0) player.dashCooldown = TUNING.dashCooldownSec;
    clampToArena(player);
    return;
  }
  if (player.dashCooldown > 0)
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);

  const { moveX, moveY } = commands.intents;
  if (moveX !== 0 || moveY !== 0) {
    const length = Math.hypot(moveX, moveY);
    player.vel.x += (moveX / length) * TUNING.baseAccel * dt;
    player.vel.y += (moveY / length) * TUNING.baseAccel * dt;
    player.facing.x = moveX / length;
    player.facing.y = moveY / length;
  }

  const speed = Math.hypot(player.vel.x, player.vel.y);
  if (speed > 0) {
    if (speed > TUNING.maxPlayerSpeed) {
      const scale = TUNING.maxPlayerSpeed / speed;
      player.vel.x *= scale;
      player.vel.y *= scale;
    }
    const damp = Math.max(0, 1 - (TUNING.friction * dt) / (speed + 1e-6));
    player.vel.x *= damp;
    player.vel.y *= damp;
  }

  player.pos.x += player.vel.x * dt;
  player.pos.y += player.vel.y * dt;
  clampToArena(player);

  if (commands.intents.dash && player.dashCooldown <= 0) {
    player.dashTime = TUNING.dashDurationSec;
    player.dashCooldown = TUNING.dashCooldownSec;
    const dx = commands.intents.moveX;
    const dy = commands.intents.moveY;
    if (dx !== 0 || dy !== 0) {
      const length = Math.hypot(dx, dy);
      player.dashDir.x = dx / length;
      player.dashDir.y = dy / length;
      player.facing.x = player.dashDir.x;
      player.facing.y = player.dashDir.y;
    } else {
      player.dashDir.x = player.facing.x;
      player.dashDir.y = player.facing.y;
    }
    events.push({ type: "dash.start", x: player.pos.x, y: player.pos.y });
  }
}

function clampToArena(player: PlayerState): void {
  const r = Math.hypot(player.pos.x, player.pos.y);
  const maxR = TUNING.arenaRadius;
  if (r > maxR && r > 0) {
    const scale = maxR / r;
    player.pos.x *= scale;
    player.pos.y *= scale;
    const radial =
      (player.vel.x * player.pos.x + player.vel.y * player.pos.y) / maxR;
    if (radial > 0) {
      player.vel.x -= (player.pos.x / maxR) * radial;
      player.vel.y -= (player.pos.y / maxR) * radial;
    }
  }
}

function updateShards(world: WorldState, dt: number): number[] {
  const time = world.time;
  const pulsed: number[] = [];
  for (const shard of world.shards) {
    if (!shard.alive) continue;
    if (shard.kind === "pulsar") {
      if (shard.pulseTimer > 0) shard.pulseTimer -= dt;
      // A non-positive timer discharges the very next step — a pulsar placed
      // exactly at zero must not spin forever on an off-by-one.
      if (shard.pulseTimer <= 0) {
        shard.pulseTimer = TUNING.pulseCooldownSec;
        pulsed.push(shard.id);
      }
    }
    if (shard.grace > 0) shard.grace = Math.max(0, shard.grace - dt);
    const speed = shard.speed * speedFactorAt(shard.pos);
    const bx = Math.cos(shard.bearing);
    const by = Math.sin(shard.bearing);
    let vx = bx * speed;
    let vy = by * speed;
    if (shard.drifter) {
      const wobble =
        Math.cos(shard.driftPhase + time * TUNING.driftFrequency) *
        TUNING.driftAmplitude *
        TUNING.driftFrequency;
      vx += -by * wobble;
      vy += bx * wobble;
    }
    shard.pos.x += vx * dt;
    shard.pos.y += vy * dt;
  }
  return pulsed;
}

/**
 * The step's expired pulsar timers become live ring events here, only for
 * pulsars that are still on the board — a pulsar killed by a dash this step
 * never fires. A ring that reaches the player knocks back (a shove, never
 * integrity loss) unless a recent bite is still protecting them.
 */
function firePulses(
  world: WorldState,
  pulsedIds: readonly number[],
  events: ArcadeEvent[]
): void {
  const player = world.player;
  const reach = TUNING.pulseMaxRadius;
  for (const id of pulsedIds) {
    const shard = world.shards.find(
      (candidate) => candidate.alive && candidate.id === id
    );
    if (!shard) continue;
    events.push({
      type: "pulsar.pulse",
      id: shard.id,
      x: shard.pos.x,
      y: shard.pos.y,
    });
    if (player.stun > 0 || player.invuln > 0) continue;
    const d = Math.hypot(
      shard.pos.x - player.pos.x,
      shard.pos.y - player.pos.y
    );
    if (d > reach) continue;
    const dx = player.pos.x - shard.pos.x;
    const dy = player.pos.y - shard.pos.y;
    const length = Math.max(1e-6, Math.hypot(dx, dy));
    player.vel.x = (dx / length) * TUNING.pulseKnockbackStrength;
    player.vel.y = (dy / length) * TUNING.pulseKnockbackStrength;
    player.pos.x += player.vel.x * TUNING.pulseStunSec;
    player.pos.y += player.vel.y * TUNING.pulseStunSec;
    clampToArena(player);
    player.stun = Math.max(player.stun, TUNING.pulseStunSec);
    player.invuln = Math.max(player.invuln, TUNING.pulseGraceSec);
    events.push({ type: "player.knockback", x: player.pos.x, y: player.pos.y });
  }
}

/**
 * True when `pos` sits inside the shield cone of a shielded shard — the cone
 * faces the core, so a player must contact a shielded shard from the flank.
 */
export function inShieldCone(
  shard: Pick<Shard, "pos">,
  pos: Pick<Vec2, "x" | "y">
): boolean {
  const toCoreX = -shard.pos.x;
  const toCoreY = -shard.pos.y;
  const coreLen = Math.max(1e-6, Math.hypot(toCoreX, toCoreY));
  const px = pos.x - shard.pos.x;
  const py = pos.y - shard.pos.y;
  const pLen = Math.max(1e-6, Math.hypot(px, py));
  const cosine = Math.min(
    1,
    Math.max(
      -1,
      (toCoreX / coreLen) * (px / pLen) + (toCoreY / coreLen) * (py / pLen)
    )
  );
  return Math.acos(cosine) < TUNING.shieldHalfAngle;
}

function speedFactorAt(pos: Vec2): number {
  const r = Math.hypot(pos.x, pos.y);
  return r < TUNING.slowZoneRadius ? TUNING.slowZoneFactor : 1;
}

function resolveContacts(
  world: WorldState,
  dt: number,
  events: ArcadeEvent[],
  approach: Vec2
): void {
  const player = world.player;
  const dashing = player.dashTime > 0;
  const dashR = TUNING.dashRadius * TUNING.dashRadius;
  const hitR = TUNING.hitRadius * TUNING.hitRadius;

  for (const shard of world.shards) {
    if (!shard.alive) continue;
    if (Math.hypot(shard.pos.x, shard.pos.y) < TUNING.coreRadius) {
      shard.alive = false;
      if (shard.kind === "heart") {
        resolveHeartReach(
          world,
          { kind: shard.kind, x: shard.pos.x, y: shard.pos.y },
          events
        );
        continue;
      }
      world.integrity -= 1;
      events.push({
        type: "core.breach",
        integrity: world.integrity,
        x: shard.pos.x,
        y: shard.pos.y,
      });
      continue;
    }
    // A freshly cracked mini is spared from instantly clipping the player who
    // just broke its parent — but it always stays a threat to the core.
    if (shard.grace > 0) continue;

    const dSq = distanceSq(shard.pos, player.pos);
    if (dashing && dSq <= dashR) {
      if (shard.kind === "shielded" && inShieldCone(shard, approach)) {
        events.push({
          type: "shard.blocked",
          id: shard.id,
          x: shard.pos.x,
          y: shard.pos.y,
        });
        continue;
      }
      destroyShard(world, shard, events);
    } else if (
      !dashing &&
      player.invuln <= 0 &&
      player.stun <= 0 &&
      dSq <= hitR
    ) {
      player.stun = TUNING.stunSec;
      player.invuln = TUNING.invulnSec;
      const dx = player.pos.x - shard.pos.x;
      const dy = player.pos.y - shard.pos.y;
      const length = Math.max(1e-6, Math.hypot(dx, dy));
      player.vel.x = (dx / length) * TUNING.knockbackImpulse;
      player.vel.y = (dy / length) * TUNING.knockbackImpulse;
      player.pos.x += player.vel.x * TUNING.stunSec;
      player.pos.y += player.vel.y * TUNING.stunSec;
      clampToArena(player);
      events.push({
        type: "player.knockback",
        x: player.pos.x,
        y: player.pos.y,
      });
    }
  }

  world.shards = world.shards.filter((shard) => shard.alive);
  if (world.chainWindow > 0) {
    world.chainWindow = Math.max(0, world.chainWindow - dt);
    if (world.chainWindow <= 0) {
      world.chain = 0;
      events.push({ type: "chain.reset" });
    }
  }
}

function pointsFor(kind: ShardKind): number {
  if (kind === "mini") return TUNING.miniPoints;
  if (kind === "shielded") return TUNING.shieldedPoints;
  return TUNING.pointsPerShard;
}

function destroyShard(
  world: WorldState,
  shard: Shard,
  events: ArcadeEvent[]
): void {
  shard.alive = false;
  if (shard.kind === "heart") {
    resolveHeartReach(
      world,
      { kind: shard.kind, x: shard.pos.x, y: shard.pos.y },
      events
    );
    return;
  }
  world.chain += 1;
  world.chainWindow = TUNING.chainWindowSec;
  const gained =
    pointsFor(shard.kind) + (world.chain - 1) * TUNING.chainPointsPerLevel;
  world.score += gained;
  events.push({
    type: "shard.destroy",
    id: shard.id,
    x: shard.pos.x,
    y: shard.pos.y,
    kind: shard.kind,
  });
  events.push({
    type: "score.change",
    score: world.score,
    gained,
    chain: world.chain,
  });
  if (shard.kind === "splitter") crackSplitter(world, shard, events);
}

function resolveHeartReach(
  world: WorldState,
  shard: { readonly kind: ShardKind; x: number; y: number },
  events: ArcadeEvent[]
): void {
  if (world.integrity < TUNING.maxIntegrity) {
    world.integrity += 1;
  } else {
    world.score += TUNING.healBonusPoints;
    events.push({
      type: "score.change",
      score: world.score,
      gained: TUNING.healBonusPoints,
      chain: world.chain,
    });
  }
  events.push({
    type: "core.heal",
    integrity: world.integrity,
    x: shard.x,
    y: shard.y,
  });
}

function crackSplitter(
  world: WorldState,
  shard: Shard,
  events: ArcadeEvent[]
): void {
  const alive = world.shards.reduce(
    (count, other) => count + (other.alive ? 1 : 0),
    0
  );
  const room = TUNING.maxShardsOnScreen - alive;
  for (
    let index = 0;
    index < TUNING.splitMiniCount && index < room;
    index += 1
  ) {
    const speed = Math.min(
      TUNING.shardSpeedMax * TUNING.splitMiniSpeedCapFactor,
      shard.speed * TUNING.splitMiniSpeedFactor
    );
    // The two minis erupt side-by-side from where their parent popped, both
    // still aimed at the core. The arena is tiny and the core smaller still —
    // a rotated bearing would graze past the ring forever instead of pressing
    // the player, so the scatter lives in the spawn offset, not the aim.
    const spawnBearing =
      shard.bearing +
      (index === 0
        ? -TUNING.splitMiniAngleOffset
        : TUNING.splitMiniAngleOffset);
    const pos = {
      x: shard.pos.x + Math.cos(spawnBearing) * TUNING.splitMiniOffset,
      y: shard.pos.y + Math.sin(spawnBearing) * TUNING.splitMiniOffset,
    };
    const bearing = Math.atan2(-pos.y, -pos.x);
    const mini: Shard = {
      id: shard.id * 10 + index + 1,
      pos,
      bearing,
      speed,
      drifter: false,
      driftPhase: 0,
      variant: 0,
      kind: "mini",
      grace: TUNING.miniGraceSec,
      pulseTimer: 0,
      alive: true,
    };
    world.shards.push(mini);
    events.push({
      type: "shard.spawn",
      id: mini.id,
      x: mini.pos.x,
      y: mini.pos.y,
      bearing: mini.bearing,
      variant: 0,
      drifter: false,
      kind: "mini",
    });
  }
}

function updateWave(world: WorldState, events: ArcadeEvent[]): void {
  if (world.phase !== "play") return;
  if (world.waveTime < TUNING.waveLengthSec) return;

  if (world.wave >= TUNING.gauntletWaves) {
    // The final wave only clears when the field is empty; otherwise it rolls
    // over for another wave-clock cycle of pressure.
    if (world.shards.some((shard) => shard.alive)) {
      world.waveTime = 0;
      return;
    }
    finishVictory(world, events);
    return;
  }

  world.wave += 1;
  world.waveTime = 0;
  events.push({ type: "wave.start", wave: world.wave });
}

function finishVictory(world: WorldState, events: ArcadeEvent[]): void {
  const bonus = world.integrity * TUNING.integrityBonusPoints;
  const final = world.score + bonus;
  world.score = final;
  if (final > world.best) world.best = final;
  world.phase = "victory";
  world.ghostDriving = false;
  events.push({
    type: "game.over",
    victory: true,
    score: final,
    bonus,
    wave: world.wave,
    best: world.best,
  });
}

function pickSpawnKind(world: WorldState): ShardKind {
  if (
    world.wave >= TUNING.heartStartWave &&
    world.rng.next() <
      TUNING.heartChanceBase +
        (world.wave - TUNING.heartStartWave) * TUNING.heartChancePerWave
  ) {
    return "heart";
  }
  if (
    world.wave >= TUNING.splitterStartWave &&
    world.rng.next() < TUNING.splitterChance
  ) {
    return "splitter";
  }
  const pulsarsOnScreen = world.shards.reduce(
    (count, shard) => count + (shard.alive && shard.kind === "pulsar" ? 1 : 0),
    0
  );
  if (
    world.wave >= TUNING.pulsarStartWave &&
    pulsarsOnScreen < TUNING.maxPulsarsOnScreen &&
    world.rng.next() <
      TUNING.pulsarChanceBase +
        (world.wave - TUNING.pulsarStartWave) * TUNING.pulsarChancePerWave
  ) {
    return "pulsar";
  }
  if (
    world.wave >= TUNING.shieldStartWave &&
    world.rng.next() <
      TUNING.shieldChanceBase +
        (world.wave - TUNING.shieldStartWave) * TUNING.shieldChancePerWave
  ) {
    return "shielded";
  }
  return "standard";
}

function updateSpawning(
  world: WorldState,
  dt: number,
  events: ArcadeEvent[]
): void {
  world.nextSpawnIn -= dt;
  if (world.nextSpawnIn > 0) return;
  // The final gauntlet stops raining shards: it clears the field already on
  // the board, so victory is earned by mopping up, not by outlasting spawns.
  if (world.wave >= TUNING.gauntletWaves) {
    world.nextSpawnIn = TUNING.waveLengthSec;
    return;
  }
  if (
    world.shards.filter((shard) => shard.alive).length >=
    TUNING.maxShardsOnScreen
  ) {
    world.nextSpawnIn = 0.1;
    return;
  }

  const angle = world.rng.next() * Math.PI * 2;
  const variant = world.rng.int(3);
  const kind = pickSpawnKind(world);
  const isDrifter =
    kind !== "heart" &&
    kind !== "splitter" &&
    kind !== "pulsar" &&
    world.wave >= TUNING.drifterStartWave &&
    world.rng.next() <
      TUNING.drifterChanceBase + world.wave * TUNING.drifterChancePerWave;

  world.shards.push({
    id: world.steps,
    pos: {
      x: Math.cos(angle) * (TUNING.arenaRadius - 0.02),
      y: Math.sin(angle) * (TUNING.arenaRadius - 0.02),
    },
    bearing: Math.atan2(-Math.sin(angle), -Math.cos(angle)),
    speed: Math.min(
      TUNING.shardSpeedMax,
      TUNING.shardBaseSpeed + (world.wave - 1) * TUNING.shardSpeedPerWave
    ),
    drifter: isDrifter,
    driftPhase: world.rng.next() * Math.PI * 2,
    variant,
    kind,
    grace: 0,
    // A staggered first ring so hazards never pulse in lockstep.
    pulseTimer:
      kind === "pulsar"
        ? TUNING.pulseCooldownSec * (0.6 + world.rng.next() * 0.4)
        : 0,
    alive: true,
  });

  const spawnPoint = world.shards[world.shards.length - 1] as Shard;
  events.push({
    type: "shard.spawn",
    id: spawnPoint.id,
    x: spawnPoint.pos.x,
    y: spawnPoint.pos.y,
    bearing: spawnPoint.bearing,
    variant,
    drifter: isDrifter,
    kind,
  });

  world.nextSpawnIn = Math.max(
    TUNING.shardIntervalMinSec,
    TUNING.shardIntervalBaseSec - (world.wave - 1) * TUNING.shardIntervalPerWave
  );
}

/** The autopilot decides whether a human is effectively idle right now. */
export function anyHumanActive(intents: Intents): boolean {
  return (
    intents.moveX !== 0 ||
    intents.moveY !== 0 ||
    intents.dash ||
    intents.act ||
    intents.pause
  );
}
