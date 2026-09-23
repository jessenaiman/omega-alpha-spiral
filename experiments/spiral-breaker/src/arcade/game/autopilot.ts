/**
 * Spiral Breaker — the ghost.
 *
 * A pure policy: read the world, return Intents. No randomness, no state,
 * no DOM. The ghost is what makes the game watchable — it takes the wheel
 * in the menu demo and whenever the player goes quiet.
 *
 * The policy is deliberately simple and strong: chase whichever inbound shard
 * is about to reach the core, and dash through it once the kill is lined up.
 * Two situation rules make it respect the kinds: it prioritises a heart when
 * the core is hurt, and it never dashes a shielded shard from inside the
 * frontal cone — first it steers out to the flank, then it strikes.
 */

import type { Intents } from "../../../../src/core/input";
import { TUNING } from "./tuning";
import { inShieldCone, type Shard, type WorldState } from "./rules";

const ZERO: Intents = {
  moveX: 0,
  moveY: 0,
  dash: false,
  act: false,
  pause: false,
};
/** The dash carries the player this far; commit once the target is in range. */
const DASH_REACH =
  TUNING.dashRadius + TUNING.dashSpeed * TUNING.dashDurationSec * 0.9;
const SWAY = 0.28;
/** A pulsar this close to firing cannot be safely approached on foot. */
const PULSAR_AVOID = TUNING.dashDurationSec + 0.3;

export function autopilot(world: WorldState): Intents {
  const player = world.player;
  const target = pickTarget(world);

  if (!target) {
    // Nothing inbound: orbit the core at a lazy radius so the ship stays alive.
    const angle = world.time * 1.6;
    const radius = 0.42;
    return steerTo(
      player.pos,
      { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius },
      0,
      world.time
    );
  }

  const d = dist(player.pos, target.pos);

  // A shielded shard must be struck from the flank, not the frontal cone.
  if (target.kind === "shielded") {
    if (inShieldCone(target, player.pos)) {
      return steerTo(player.pos, flankPoint(target), d, world.time);
    }
    // Out of the cone: line up a clean dash THROUGH the shard and take it.
    const strike = leadPoint(target);
    const sd = dist(player.pos, strike);
    const ready = player.dashCooldown <= 0 && player.dashTime <= 0;
    return {
      ...steerTo(player.pos, strike, sd, world.time),
      dash: ready && sd <= DASH_REACH,
    };
  }

  const base = steerTo(player.pos, target.pos, d, world.time);
  const aligned =
    (target.pos.x - player.pos.x) * player.facing.x +
      (target.pos.y - player.pos.y) * player.facing.y >
    0;
  const killReady =
    aligned &&
    d <= DASH_REACH &&
    player.dashCooldown <= 0 &&
    player.dashTime <= 0;

  // A charging pulsar is killed before its ring fires only when the strike is
  // already lined up; otherwise back off outside its reach and wait it out.
  if (
    target.kind === "pulsar" &&
    target.pulseTimer <= PULSAR_AVOID &&
    !killReady
  ) {
    return steerTo(
      player.pos,
      standoffPoint(target, player.pos),
      d,
      world.time
    );
  }

  if (killReady) {
    return { ...base, dash: true };
  }

  return base;
}

/**
 * The shard worth chasing right now: a heart when the core is hurt (healing
 * beats scoring), otherwise whichever inbound shard is closest to the core.
 */
export function pickTarget(world: WorldState): Shard | undefined {
  const wantHeal = world.integrity < TUNING.maxIntegrity;

  // 1. Imminent breach: a shard already inside the commit radius cannot wait.
  let urgent: Shard | undefined;
  let urgentR = Infinity;
  for (const shard of world.shards) {
    if (!shard.alive || shard.kind === "heart") continue;
    const radius = Math.hypot(shard.pos.x, shard.pos.y);
    if (radius < TUNING.dashChargeFromRadius && radius < urgentR) {
      urgent = shard;
      urgentR = radius;
    }
  }
  if (urgent) return urgent;

  // 2. Healing: a heart waits for nobody once the core is hurt.
  if (wantHeal) {
    let heart: Shard | undefined;
    let heartR = Infinity;
    for (const shard of world.shards) {
      if (!shard.alive || shard.kind !== "heart") continue;
      const radius = Math.hypot(shard.pos.x, shard.pos.y);
      if (radius < heartR) {
        heart = shard;
        heartR = radius;
      }
    }
    if (heart) return heart;
  }

  // 3. A splitter anywhere is a time bomb: crack the one already deepest so
  //    its minis hatch as far from the core as possible.
  let splitter: Shard | undefined;
  let splitterR = Infinity;
  for (const shard of world.shards) {
    if (!shard.alive || shard.kind !== "splitter") continue;
    const radius = Math.hypot(shard.pos.x, shard.pos.y);
    if (radius < splitterR) {
      splitter = shard;
      splitterR = radius;
    }
  }
  if (splitter) return splitter;

  // 4. Otherwise pressure the nearest-to-core shard.
  let best: Shard | undefined;
  let bestScore = Infinity;
  for (const shard of world.shards) {
    if (!shard.alive) continue;
    const radius = Math.hypot(shard.pos.x, shard.pos.y);
    if (radius < bestScore) {
      best = shard;
      bestScore = radius;
    }
  }
  return best;
}

/** The shard closest to the core — that is the one the core is about to lose. */
export function pickThreat(shards: readonly Shard[]): Shard | undefined {
  let best: Shard | undefined;
  let bestRadius = Infinity;
  for (const shard of shards) {
    if (!shard.alive) continue;
    const radius = Math.hypot(shard.pos.x, shard.pos.y);
    if (radius < bestRadius) {
      best = shard;
      bestRadius = radius;
    }
  }
  return best;
}

/**
 * A point outside a shielded shard's frontal cone: the inbound heading rotated
 * far enough to the flank that a dash from there is a clean kill. The side is
 * deterministic (shard id parity) so the ghost cannot ping-pong.
 */
function flankPoint(shard: Shard): { x: number; y: number } {
  const toCoreX = -shard.pos.x;
  const toCoreY = -shard.pos.y;
  const length = Math.max(1e-6, Math.hypot(toCoreX, toCoreY));
  const ux = toCoreX / length;
  const uy = toCoreY / length;
  const turn = (shard.id % 2 === 0 ? 1 : -1) * (TUNING.shieldHalfAngle + 0.35);
  const cos = Math.cos(turn);
  const sin = Math.sin(turn);
  const rx = ux * cos - uy * sin;
  const ry = ux * sin + uy * cos;
  const reach = DASH_REACH * 0.45;
  const px = shard.pos.x + rx * reach;
  const py = shard.pos.y + ry * reach;
  // Shards spawn at the arena rim, where an unclamped flank goal sits outside
  // the ring — the wall then wrestles the ghost forever. Keep the goal inside.
  const maxR = TUNING.arenaRadius - 0.05;
  const r = Math.hypot(px, py);
  if (r > maxR && r > 1e-6) return { x: (px / r) * maxR, y: (py / r) * maxR };
  return { x: px, y: py };
}

/**
 * A point just outside a charging pulsar's ring reach, on the player's side,
 * so the ghost can wait out the pulse without eating it.
 */
function standoffPoint(
  shard: Shard,
  playerPos: { x: number; y: number }
): { x: number; y: number } {
  const dx = playerPos.x - shard.pos.x;
  const dy = playerPos.y - shard.pos.y;
  const length = Math.max(1e-6, Math.hypot(dx, dy));
  const reach = TUNING.pulseMaxRadius * 1.25;
  const px = shard.pos.x + (dx / length) * reach;
  const py = shard.pos.y + (dy / length) * reach;
  const maxR = TUNING.arenaRadius - 0.05;
  const r = Math.hypot(px, py);
  if (r > maxR && r > 1e-6) return { x: (px / r) * maxR, y: (py / r) * maxR };
  return { x: px, y: py };
}

/**
 * A point just ahead of a moving shard, so a strike from the flank still hits
 * it as it drifts inward.
 */
function leadPoint(shard: Shard): { x: number; y: number } {
  const lead = shard.speed * 0.22;
  return {
    x: shard.pos.x + Math.cos(shard.bearing) * lead,
    y: shard.pos.y + Math.sin(shard.bearing) * lead,
  };
}

function steerTo(
  from: { x: number; y: number },
  to: { x: number; y: number },
  distance: number,
  time: number
): Intents {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < 1e-4) return ZERO;

  // Sway only while the target is far; go straight in for the kill.
  const swayScale = Math.min(1, Math.max(0, (distance - DASH_REACH) / 0.6));
  const angle = Math.atan2(dy, dx) + Math.cos(time * 3.1) * SWAY * swayScale;
  return {
    moveX: Math.cos(angle),
    moveY: Math.sin(angle),
    dash: false,
    act: false,
    pause: false,
  };
}

function dist(
  a: { x: number; y: number },
  b: { x: number; y: number }
): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
