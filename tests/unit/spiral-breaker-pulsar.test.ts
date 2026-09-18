/**
 * Spiral Breaker — the pulsar enemy kind, proven without a browser.
 *
 * A pulsar is a dashable shard carrying a 360° pulse ring on a fixed-step
 * rhythm. Lingering inside its reach when the ring fires shoves the player
 * outward (knockback, no integrity loss); dashing the pulsar kills it before
 * it can ever fire. The ghost waits out a charging pulse it cannot reach, but
 * strikes a pulsar it can kill or one that has released.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Intents } from '../../src/core/input';
import {
  autopilot,
  createWorld,
  resetForRun,
  step,
  TUNING,
  type ArcadeEvent,
  type Commands,
  type Shard,
  type WorldState,
} from '../../src/arcade/game';

const DT = 1 / 60;

function playWorld(seed = 'pulsar-test', overrides: Partial<WorldState> = {}): WorldState {
  const world = createWorld(seed);
  resetForRun(world);
  world.shards = [];
  world.nextSpawnIn = 999;
  world.waveTime = 0;
  Object.assign(world, overrides);
  return world;
}

function shardAt(x: number, y: number, overrides: Partial<Shard> = {}): Shard {
  return {
    id: overrides.id ?? 1,
    pos: { x, y },
    bearing: Math.atan2(-y, -x),
    speed: 0,
    drifter: false,
    driftPhase: 0,
    variant: 0,
    kind: 'standard',
    grace: 0,
    alive: true,
    pulseTimer: 0,
    ...overrides,
  };
}

function idle(): Commands {
  return {
    intents: { moveX: 0, moveY: 0, dash: false, act: false, pause: false },
    fromAutopilot: false,
    start: false,
    humanActive: false,
  };
}

function eventsOf(world: WorldState, commands: Commands, steps = 1): ArcadeEvent[] {
  const all: ArcadeEvent[] = [];
  for (let index = 0; index < steps; index += 1) {
    all.push(...step(world, DT, commands));
  }
  return all;
}

function eventsOfType(events: readonly ArcadeEvent[], type: ArcadeEvent['type']): ArcadeEvent[] {
  return events.filter((event) => event.type === type);
}

// --- the pulse --------------------------------------------------------------

test('a pulsar counts down its timer and fires a pulse event, then resets', () => {
  const world = playWorld();
  world.shards.push(shardAt(0.3, 0, { kind: 'pulsar', id: 8, pulseTimer: 0.02 }));
  const events = eventsOf(world, idle(), 4);
  assert.equal(eventsOfType(events, 'pulsar.pulse').length, 1);
  const pulse = eventsOfType(events, 'pulsar.pulse')[0] as { id: number; x: number; y: number };
  assert.equal(pulse.id, 8);
  // The timer was reset to the cooldown on fire, then the remaining steps of
  // the window ticked it down again — it must be back on a fresh cycle.
  const timer = (world.shards[0] as Shard).pulseTimer;
  assert.ok(timer > 0 && timer <= TUNING.pulseCooldownSec, 'the shard must return to its cooldown cycle');
});

test('a pulse fires exactly once per cooldown cycle', () => {
  const world = playWorld();
  world.shards.push(shardAt(0.3, 0, { kind: 'pulsar', id: 8, pulseTimer: 0.0 }));
  const window = Math.floor(TUNING.pulseCooldownSec / DT);
  assert.equal(eventsOfType(eventsOf(world, idle(), window), 'pulsar.pulse').length, 1);
  assert.equal(eventsOfType(eventsOf(world, idle(), window), 'pulsar.pulse').length, 1);
});

// --- the bite ---------------------------------------------------------------

test('a pulse bite shoves the player out of the ring with a knockback', () => {
  const world = playWorld();
  // Player sits at the spawn waypoint (0.5, 0); the pulsar fires 0.3 units to
  // its left, well inside the pulse reach.
  world.shards.push(shardAt(0.2, 0, { kind: 'pulsar', id: 8, pulseTimer: 0.001 }));
  const before = { x: world.player.pos.x, y: world.player.pos.y };
  const events = eventsOf(world, idle(), 3);
  assert.equal(eventsOfType(events, 'player.knockback').length, 1, 'the pulse must bite once');
  assert.ok(world.player.pos.x > before.x, 'the shove must push the player away from the pulsar');
  assert.ok(world.player.stun > 0, 'the bite must stun briefly so the push reads');
});

test('a player outside the pulse reach is not affected', () => {
  const world = playWorld();
  world.shards.push(shardAt(-0.6, 0, { kind: 'pulsar', id: 8, pulseTimer: 0.001 }));
  const before = { x: world.player.pos.x, y: world.player.pos.y };
  const events = eventsOf(world, idle(), 3);
  assert.equal(eventsOfType(events, 'player.knockback').length, 0);
  assert.deepEqual({ x: world.player.pos.x, y: world.player.pos.y }, before);
});

test('a recent bite protects the player from the next pulse', () => {
  const world = playWorld();
  world.shards.push(
    shardAt(0.2, 0, { kind: 'pulsar', id: 8, pulseTimer: 0.001 }),
    shardAt(0.25, 0.12, { kind: 'pulsar', id: 9, pulseTimer: 0.002 }),
  );
  const events = eventsOf(world, idle(), 3);
  assert.equal(eventsOfType(events, 'pulsar.pulse').length, 2, 'both pulses expire in the same step');
  assert.equal(eventsOfType(events, 'player.knockback').length, 1, 'the grace window must swallow the second bite');
});

// --- dashing / breaching ----------------------------------------------------

test('dashing through a pulsar kills it cleanly and never lets it pulse', () => {
  const world = playWorld();
  // The pulse is still charging (fires well after the dash lands), so the dive
  // must take the kill and the ring must never go off.
  world.shards.push(shardAt(0.3, 0, { kind: 'pulsar', id: 8, pulseTimer: 0.2 }));
  const dash = {
    intents: { moveX: -1, moveY: 0, dash: true, act: false, pause: false },
    fromAutopilot: false,
    start: false,
    humanActive: true,
  };
  const events = eventsOf(world, dash, 16);
  assert.equal(eventsOfType(events, 'shard.destroy').length, 1);
  assert.equal(eventsOfType(events, 'pulsar.pulse').length, 0, 'a dashed pulsar must never fire');
  assert.equal(world.score, TUNING.pointsPerShard, 'a pulsar is worth standard points');
  assert.equal(world.chain, 1, 'the dash counts the kill in the chain');
});

test('a dash that connects in the exact step the pulse fires still beats it', () => {
  const world = playWorld();
  // The player is already inside dash reach (0.11) of the pulsar when the dash
  // starts and the pulse expires in the same step. Contacts resolve before the
  // pulse, so the kill wins and no ring event is emitted.
  world.shards.push(shardAt(0.49, 0, { kind: 'pulsar', id: 8, pulseTimer: 0.001 }));
  const dash = {
    intents: { moveX: -1, moveY: 0, dash: true, act: false, pause: false },
    fromAutopilot: false,
    start: false,
    humanActive: true,
  };
  const events = eventsOf(world, dash, 3);
  assert.equal(eventsOfType(events, 'shard.destroy').length, 1, 'the dash must connect at fire time');
  assert.equal(eventsOfType(events, 'pulsar.pulse').length, 0, 'the kill must suppress the ring');
});

test('a pulsar that reaches the core breaches like any other shard', () => {
  const world = playWorld();
  world.shards.push(shardAt(0.17, 0, { kind: 'pulsar', id: 8, pulseTimer: 10, speed: TUNING.shardBaseSpeed }));
  const events = eventsOf(world, idle(), 40);
  assert.equal(world.integrity, TUNING.maxIntegrity - 1);
  assert.equal(eventsOfType(events, 'core.breach').length, 1);
});

// --- spawning ---------------------------------------------------------------

test('pulsars spawn only from their start wave, never before it', () => {
  const world = createWorld('pulsar-gate');
  resetForRun(world);
  world.nextSpawnIn = 0;
  let pulsarSpawns = 0;

  // Flood spawns on a cleared board at waves 1 and 2: the gate is a hard
  // zero before the start wave, so not a single pulsar may slip through.
  for (const wave of [1, 2]) {
    world.wave = wave;
    for (let index = 0; index < 200; index += 1) {
      const events = step(world, DT, idle());
      for (const event of events) {
        if (event.type === 'shard.spawn') {
          assert.notEqual(event.kind, 'pulsar', 'no pulsar may spawn before its start wave');
        }
      }
      world.shards.length = 0;
      world.nextSpawnIn = 0;
    }
  }

  // The same flood at a late wave must now yield pulsars (chance to draw none
  // across 200+ spawns is negligible, so this is safe on any seed).
  world.wave = TUNING.gauntletWaves - 1;
  for (let index = 0; index < 200; index += 1) {
    const events = step(world, DT, idle());
    for (const event of events) {
      if (event.type === 'shard.spawn' && event.kind === 'pulsar') pulsarSpawns += 1;
    }
    world.shards.length = 0;
    world.nextSpawnIn = 0;
  }
  assert.ok(pulsarSpawns > 0, 'the post-start-wave flood must produce pulsars');
});

// --- the ghost --------------------------------------------------------------

test('the ghost waits out a charging pulsar it cannot reach, and strikes one it can kill', () => {
  const build = (pulseTimer: number, pulsarX: number): WorldState => {
    const world = playWorld('ghost-pulsar');
    world.player.pos = { x: -0.5, y: 0 };
    world.player.facing.x = 1;
    world.player.facing.y = 0;
    world.shards.push(shardAt(pulsarX, 0, { kind: 'pulsar', id: 8, pulseTimer }));
    return world;
  };

  // Out of kill range and charging -> hold at the standoff, never dash in.
  const far = autopilot(build(0.1, 0.9));
  assert.equal(far.dash, false, 'the ghost must not dash into a charging pulsar from beyond reach');

  // In kill range, pulsar released -> commit the dash like any shard.
  const inside = autopilot(build(1.0, -0.2));
  assert.equal(inside.dash, true, 'a pulsar in dash range that is not charging must be struck');

  // In kill range and charging -> the dash still lands before the pulse fires.
  const chargingButReachable = autopilot(build(0.1, -0.2));
  assert.equal(chargingButReachable.dash, true, 'a reachable charging pulsar is killed mid-charge');
});

test('the ghost clears the gauntlet while pulsars spawn and die on the field', () => {
  const world = playWorld('bot-ghost');
  world.nextSpawnIn = 0;
  let pulsarSpawned = 0;
  let pulsarKilled = 0;
  let victory = false;
  for (let index = 0; index < 16000 && world.phase === 'play'; index += 1) {
    // Regular natural spawning is sparing, so also feed a fresh pulsar on a
    // cadence — the ghost must keep playing around them, not luck past them.
    if (index % 600 === 0 && world.wave >= TUNING.pulsarStartWave) {
      const angle = index * 1.7;
      world.shards.push(
        shardAt(Math.cos(angle) * 0.75, Math.sin(angle) * 0.75, {
          kind: 'pulsar',
          id: 9000000 + index,
          pulseTimer: TUNING.pulseCooldownSec * 0.8,
        }),
      );
      pulsarSpawned += 1;
    }
    const events = step(world, DT, {
      intents: autopilot(world),
      fromAutopilot: true,
      start: false,
      humanActive: false,
    });
    for (const event of events) {
      if (event.type === 'shard.spawn' && event.kind === 'pulsar') pulsarSpawned += 1;
      if (event.type === 'shard.destroy' && event.kind === 'pulsar') pulsarKilled += 1;
      if (event.type === 'game.over') {
        assert.equal(event.victory, true, 'the ghost must clear the gauntlet with pulsars present');
        victory = true;
      }
    }
  }
  assert.ok(pulsarSpawned >= 3, 'the gauntlet must involve several pulsars');
  assert.ok(pulsarKilled >= 3, 'the ghost must sweep the pulsars too');
  assert.ok(victory, 'the ghost must finish the run');
});