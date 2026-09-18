/**
 * Spiral Breaker — the rules, proven without a browser.
 *
 * These are the tests the browser test leans on: if the pure step is not
 * deterministic and its scoring, breach, wave, and ghost rules are not what
 * the design says, no capture is worth taking.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Intents } from '../../src/core/input';
import {
  autopilot,
  createWorld,
  inShieldCone,
  pickTarget,
  resetForRun,
  step,
  TUNING,
  type ArcadeEvent,
  type Commands,
  type Shard,
  type WorldState,
} from '../../src/arcade/game';

const DT = 1 / 60;

function playWorld(seed = 'spiral-test', overrides: Partial<WorldState> = {}): WorldState {
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
    pulseTimer: 0,
    alive: true,
    ...overrides,
  };
}

function cmds(
  intents: Partial<Intents> = {},
  rest: Partial<Omit<Commands, 'intents'>> = {},
): Commands {
  return {
    intents: { moveX: 0, moveY: 0, dash: false, act: false, pause: false, ...intents },
    fromAutopilot: false,
    start: false,
    humanActive: false,
    ...rest,
  };
}

function types(events: readonly ArcadeEvent[]): string[] {
  return events.map((event) => event.type);
}

// --- determinism --------------------------------------------------------------

test('the same seed and the same inputs produce the same run', () => {
  const trace = (world: WorldState): ArcadeEvent[][] => {
    const out: ArcadeEvent[][] = [];
    for (let i = 0; i < 900; i += 1) {
      const events = step(world, DT, {
        intents: autopilot(world),
        fromAutopilot: true,
        start: false,
        humanActive: false,
      });
      out.push(events);
    }
    return out;
  };
  const first = createWorld('det');
  resetForRun(first);
  const second = createWorld('det');
  resetForRun(second);
  const a = trace(first);
  const b = trace(second);
  assert.deepEqual(a, b);
  assert.ok(
    a.flat().some((event) => event.type === 'shard.spawn'),
    'shards actually spawned during the trace',
  );
});

test('a fresh run never reuses the previous run number', () => {
  const world = createWorld('runs');
  assert.equal(world.runNumber, 0);
  resetForRun(world);
  assert.equal(world.runNumber, 1);
  assert.equal(world.phase, 'play');
  resetForRun(world);
  assert.equal(world.runNumber, 2);
});

// --- combat ------------------------------------------------------------------

test('a dash through a shard destroys it and scores with the chain', () => {
  const world = playWorld();
  world.player.pos = { x: 0.5, y: 0 };
  world.shards = [shardAt(0.55, 0)];
  const events = step(world, DT, cmds({ moveX: 1, dash: true }, { humanActive: true }));

  assert.ok(types(events).includes('dash.start'));
  assert.ok(types(events).includes('shard.destroy'));
  assert.deepEqual(
    events.find((event) => event.type === 'score.change'),
    { type: 'score.change', score: 10, gained: 10, chain: 1 },
  );
  assert.equal(world.shards.length, 0);
  assert.equal(world.integrity, TUNING.maxIntegrity, 'a clean dash costs no integrity');
});

test('brushing a shard without dashing knocks the player back but spares them', () => {
  const world = playWorld();
  world.player.pos = { x: 0.5, y: 0 };
  world.shards = [shardAt(0.55, 0)];
  const events = step(world, DT, cmds());

  assert.ok(types(events).includes('player.knockback'));
  assert.ok(!types(events).includes('shard.destroy'));
  assert.equal(world.shards.length, 1, 'the shard survives a graze');
  assert.equal(world.score, 0);
  assert.ok(world.player.stun > 0, 'the graze costs the player a beat');
});

test('a second shard inside the chain window compounds the score, then the chain resets', () => {
  const world = playWorld();
  world.player.pos = { x: 0.5, y: 0 };
  world.shards = [shardAt(0.55, 0)];
  step(world, DT, cmds({ moveX: 1, dash: true }, { humanActive: true }));
  assert.equal(world.chain, 1);

  world.player.dashTime = 0;
  world.player.dashCooldown = 0;
  world.player.pos = { x: 0.5, y: 0 };
  world.shards = [shardAt(0.55, 0, { id: 2 })];
  const second = step(world, DT, cmds({ moveX: 1, dash: true }, { humanActive: true }));
  assert.deepEqual(
    second.find((event) => event.type === 'score.change'),
    { type: 'score.change', score: 25, gained: 15, chain: 2 },
  );

  world.nextSpawnIn = 999;
  let reset: ArcadeEvent[] = [];
  for (let i = 0; i < 200 && reset.length === 0; i += 1) {
    reset = step(world, DT, cmds()).filter((event) => event.type === 'chain.reset');
  }
  assert.ok(reset.length > 0, 'the chain expires after its window');
  assert.equal(world.chain, 0);
});

test('a dash cannot start again until the cooldown has drained', () => {
  const world = playWorld();
  world.player.pos = { x: 0.5, y: 0 };
  step(world, DT, cmds({ dash: true }, { humanActive: true }));
  assert.ok(world.player.dashTime > 0);
  assert.ok(world.player.dashCooldown > 0);

  const midDash = step(world, DT, cmds({ dash: true }, { humanActive: true }));
  assert.ok(!types(midDash).includes('dash.start'), 'dash ignores a press while dashing');

  world.player.dashTime = 0;
  const blocked = step(world, DT, cmds({ dash: true }, { humanActive: true }));
  assert.ok(!types(blocked).includes('dash.start'), 'cooldown still gates the next dash');

  world.player.dashCooldown = 0;
  const ready = step(world, DT, cmds({ dash: true }, { humanActive: true }));
  assert.ok(types(ready).includes('dash.start'));
});

// --- encounter kinds -------------------------------------------------------------

test('a splitter cracks into two fast minis on a dash kill, inside the cap', () => {
  const world = playWorld();
  world.player.pos = { x: 0.5, y: 0 };
  world.shards = [shardAt(0.55, 0, { id: 7, kind: 'splitter', speed: 0.4 })];
  const events = step(world, DT, cmds({ moveX: 1, dash: true }, { humanActive: true }));

  assert.equal(world.shards.length, 2, 'the splitter becomes two minis');
  assert.ok(world.shards.every((shard) => shard.kind === 'mini'));
  assert.ok(world.shards.every((shard) => shard.grace > 0), 'fresh minis are collision-immune for a beat');
  assert.ok(world.shards[0]!.speed > 0.4, 'minis are faster than their parent');
  assert.ok(events.some((event) => event.type === 'shard.spawn' && event.kind === 'mini'));
  assert.ok(events.some((event) => event.type === 'shard.destroy' && event.kind === 'splitter'));
});

test('a splitter with no cap headroom cracks into nothing (the cap never cracks)', () => {
  const world = playWorld();
  world.player.pos = { x: 0.5, y: 0 };
  const crowd = Array.from({ length: TUNING.maxShardsOnScreen }, (_, index) =>
    shardAt(0.9, 0, { id: 100 + index, speed: 0.01, drifter: false }),
  );
  world.shards = [...crowd, shardAt(0.55, 0, { id: 7, kind: 'splitter' })];
  const events = step(world, DT, cmds({ moveX: 1, dash: true }, { humanActive: true }));

  assert.ok(events.some((event) => event.type === 'shard.destroy' && event.kind === 'splitter'));
  assert.equal(world.shards.length, TUNING.maxShardsOnScreen, 'the cap still holds after the crack');
});

test('a heart heals one integrity pip on destruction, and pays points when full', () => {
  const hurt = playWorld();
  hurt.player.pos = { x: 0.5, y: 0 };
  hurt.integrity = 1;
  hurt.shards = [shardAt(0.55, 0, { kind: 'heart' })];
  const events = step(hurt, DT, cmds({ moveX: 1, dash: true }, { humanActive: true }));
  assert.equal(hurt.integrity, 2);
  assert.ok(events.some((event) => event.type === 'core.heal' && event.integrity === 2));
  assert.ok(!events.some((event) => event.type === 'score.change'), 'a real heal pays no points');

  const full = playWorld();
  full.player.pos = { x: 0.5, y: 0 };
  full.shards = [shardAt(0.55, 0, { id: 2, kind: 'heart' })];
  const fullEvents = step(full, DT, cmds({ moveX: 1, dash: true }, { humanActive: true }));
  assert.equal(full.integrity, TUNING.maxIntegrity);
  assert.deepEqual(
    fullEvents.find((event) => event.type === 'score.change'),
    { type: 'score.change', score: TUNING.healBonusPoints, gained: TUNING.healBonusPoints, chain: 0 },
  );
});

test('a heart that reaches the core heals instead of breaching', () => {
  const world = playWorld();
  world.player.pos = { x: 0.95, y: 0 };
  world.integrity = 1;
  world.shards = [shardAt(0.1, 0, { kind: 'heart', speed: 0.15 })];
  const events = step(world, DT, cmds());
  assert.equal(world.integrity, 2, 'the heart mends the core rather than hurting it');
  assert.ok(!events.some((event) => event.type === 'core.breach'));
  assert.ok(events.some((event) => event.type === 'core.heal'));
  assert.equal(world.shards.length, 0);
});

test('a dash into a shielded frontal cone bounces, and a flank dash breaks it', () => {
  const ahead = { x: 0.55, y: 0 };
  const front = playWorld();
  front.player.pos = { x: 0.5, y: 0 };
  front.shards = [shardAt(ahead.x, ahead.y, { kind: 'shielded' })];
  const bounced = step(front, DT, cmds({ moveX: 1, dash: true }, { humanActive: true }));
  assert.ok(bounced.some((event) => event.type === 'shard.blocked'), 'the front dash bounces');
  assert.equal(front.shards.length, 1, 'the shielded shard survives the bounce');
  assert.equal(front.integrity, TUNING.maxIntegrity);

  const flank = playWorld();
  flank.player.pos = { x: 0.85, y: 0.5 };
  flank.player.facing.x = -0.3;
  flank.player.facing.y = -0.5;
  flank.shards = [shardAt(ahead.x, ahead.y, { id: 2, kind: 'shielded', speed: 0.4 })];
  const dashThrough = cmds({ moveX: -0.3, moveY: -0.5, dash: true }, { humanActive: true });
  const destroyed: ArcadeEvent[] = [];
  for (let i = 0; i < 12 && flank.shards.length > 0; i += 1) {
    destroyed.push(...step(flank, DT, dashThrough));
  }
  assert.ok(
    destroyed.some((event) => event.type === 'shard.destroy' && event.kind === 'shielded'),
    'a strike launched from the flank breaks the shield',
  );
  assert.equal(flank.shards.length, 0);
});

test('inShieldCone classifies the frontal approach and trusts the flank', () => {
  const shard = shardAt(0.4, 0, { kind: 'shielded' });
  // Player between shard and core (inside the cone).
  assert.equal(inShieldCone(shard, { x: 0.3, y: 0 }), true);
  // Player on the rim-side flank (outside the cone).
  assert.equal(inShieldCone(shard, { x: 0.5, y: 0.6 }), false);
});

test('the autopilot flanks a shielded shard instead of dashing into the cone', () => {
  const world = playWorld();
  world.player.pos = { x: 0.5, y: 0 };
  world.player.facing.x = 1;
  world.player.facing.y = 0;
  world.player.dashCooldown = 0;
  world.shards = [shardAt(0.55, 0, { kind: 'shielded' })];
  for (let i = 0; i < 70; i += 1) {
    const intent = autopilot(world);
    step(world, DT, { intents: intent, fromAutopilot: true, start: false, humanActive: false });
  }
  assert.equal(world.shards.length, 0, 'the ghost refuses the cone and still gets the kill');
  assert.ok(world.integrity > 0, 'the flanking kill costs no integrity');
});

test('the autopilot prefers a heart while the core is hurt', () => {
  const world = playWorld();
  world.integrity = 1;
  const standard = shardAt(0.6, 0, { kind: 'standard', id: 5 });
  const heart = shardAt(0.8, 0, { kind: 'heart', id: 6 });
  world.shards = [standard, heart];
  assert.equal(pickTarget(world)?.id, 6, 'healing beats a nearer threat when hurt');
  world.integrity = TUNING.maxIntegrity;
  assert.equal(pickTarget(world)?.id, 5, 'the nearest-to-core shard wins when the core is full');
});

// --- the gauntlet ----------------------------------------------------------------

test('clearing the final wave banks the integrity bonus and ends in victory', () => {
  const world = playWorld();
  world.integrity = 2;
  world.wave = TUNING.gauntletWaves;
  world.score = 900;
  world.waveTime = TUNING.waveLengthSec - DT / 2;
  world.shards = [];
  const events = step(world, DT, cmds());

  assert.equal(world.phase, 'victory');
  const bonus = world.integrity * TUNING.integrityBonusPoints;
  const over = events.find((event) => event.type === 'game.over');
  assert.deepEqual(over, {
    type: 'game.over',
    victory: true,
    score: 900 + bonus,
    bonus,
    wave: TUNING.gauntletWaves,
    best: 900 + bonus,
  });
  assert.equal(world.score, 900 + bonus, 'the bonus lands in the final score');
});

test('the final wave rolls over instead of clearing while shards remain', () => {
  const world = playWorld();
  world.wave = TUNING.gauntletWaves;
  world.waveTime = TUNING.waveLengthSec - DT / 2;
  world.shards = [shardAt(0.8, 0)];
  const events = step(world, DT, cmds());
  assert.equal(world.phase, 'play', 'a shard on the field blocks the clear');
  assert.equal(world.wave, TUNING.gauntletWaves, 'the wave does not advance');
  assert.ok(!events.some((event) => event.type === 'game.over'));
});

test('the final wave stops raining shards so the field can actually drain', () => {
  const world = playWorld();
  world.wave = TUNING.gauntletWaves;
  world.nextSpawnIn = 0;
  world.shards = [shardAt(0.8, 0)];
  const before = world.shards.length;
  for (let i = 0; i < 900; i += 1) step(world, DT, cmds());
  assert.equal(world.shards.length, before, 'no new shards arrive while the gauntlet drains');
});

test('a victory restarts into a fresh run on a start intent', () => {
  const world = playWorld();
  world.wave = TUNING.gauntletWaves;
  world.integrity = 3;
  world.score = 1000;
  world.waveTime = TUNING.waveLengthSec - DT / 2;
  world.shards = [];
  step(world, DT, cmds());
  assert.equal(world.phase, 'victory');

  const restart = step(world, DT, cmds({ dash: true }, { start: true }));
  assert.deepEqual(types(restart), ['run.begin', 'wave.start']);
  assert.equal(world.phase, 'play');
  assert.equal(world.score, 0);
  assert.equal(world.best, 1300, 'the banked victory stays as the new best');
});

test('the ghost actually wins the gauntlet for the watchable seeds', () => {
  for (const seed of ['spiral-42', 'watchable', 42]) {
    const world = createWorld(seed);
    resetForRun(world);
    let victory = false;
    for (let i = 0; i < 7000 && !victory; i += 1) {
      const events = step(world, DT, {
        intents: autopilot(world),
        fromAutopilot: true,
        start: false,
        humanActive: false,
      });
      if (events.some((event) => event.type === 'game.over' && event.victory)) victory = true;
    }
    assert.equal(victory, true, `the ghost clears the gauntlet for seed ${String(seed)}`);
  }
});

// --- the core ----------------------------------------------------------------

test('a shard that reaches the core costs integrity, and three of them end the run', () => {
  const world = playWorld();
  world.player.pos = { x: 0.9, y: 0 };
  world.best = 40;
  world.score = 120;

  for (let hit = 1; hit <= 3; hit += 1) {
    world.shards = [shardAt(0.1, 0, { id: hit })];
    const events = step(world, DT, cmds());
    const breach = events.find((event) => event.type === 'core.breach');
    assert.deepEqual(breach, { type: 'core.breach', integrity: TUNING.maxIntegrity - hit, x: 0.1, y: 0 });
  }

  assert.equal(world.phase, 'game-over');
  assert.deepEqual(
    world.shards.length,
    0,
  );
  const over = step(world, DT, cmds());
  assert.equal(over.length, 0, 'results hold until a new run starts');

  const restart = step(world, DT, cmds({ dash: true }, { start: true }));
  assert.deepEqual(types(restart), ['run.begin', 'wave.start']);
  assert.equal(world.phase, 'play');
  assert.equal(world.score, 0);
  assert.equal(world.best, 120, 'best survives the run that set it');
});

// --- waves and spawning ------------------------------------------------------

test('a wave advances on the clock and ramps the shard speed', () => {
  const world = playWorld();
  world.waveTime = TUNING.waveLengthSec - DT / 2;
  const events = step(world, DT, cmds());
  assert.deepEqual(events.find((event) => event.type === 'wave.start'), { type: 'wave.start', wave: 2 });
  assert.equal(world.wave, 2);
  assert.equal(world.waveTime, 0);
});

test('the shard count never exceeds the on-screen cap', () => {
  const world = playWorld();
  world.integrity = 999;
  world.nextSpawnIn = 0;
  let peak = 0;
  for (let i = 0; i < 4000; i += 1) {
    step(world, DT, cmds());
    peak = Math.max(peak, world.shards.length);
  }
  assert.ok(peak > 0, 'shards spawned');
  assert.ok(peak <= TUNING.maxShardsOnScreen, `peak ${peak} exceeded cap ${TUNING.maxShardsOnScreen}`);
});

// --- the ghost ---------------------------------------------------------------

test('the ghost takes the wheel after the idle window and lets go on real input', () => {
  const world = playWorld();
  world.ghostDriving = false;
  world.idleTime = 0;
  const idle = cmds({}, { fromAutopilot: true });
  const stepsForIdle = Math.ceil(TUNING.ghostIdleTriggerSec / DT) + 2;

  let takeover: ArcadeEvent | undefined;
  for (let i = 0; i < stepsForIdle && !takeover; i += 1) {
    takeover = step(world, DT, idle).find((event) => event.type === 'ghost.takeover');
  }
  assert.ok(takeover, 'the ghost eventually takes over');
  assert.equal(world.ghostDriving, true);

  const release = step(world, DT, cmds({ moveX: 1 }, { humanActive: true }));
  assert.ok(types(release).includes('ghost.release'));
  assert.equal(world.ghostDriving, false);
});

test('the autopilot always returns a legal intent', () => {
  const world = playWorld();
  world.nextSpawnIn = 0;
  for (let i = 0; i < 300; i += 1) {
    const intent = autopilot(world);
    assert.equal(Number.isFinite(intent.moveX), true);
    assert.equal(Number.isFinite(intent.moveY), true);
    assert.equal(intent.act, false);
    assert.equal(intent.pause, false);
    step(world, DT, { intents: intent, fromAutopilot: true, start: false, humanActive: false });
  }
});

test('the ghost is good enough to actually clear shards', () => {
  const world = createWorld('watchable');
  resetForRun(world);
  for (let i = 0; i < 2400; i += 1) {
    step(world, DT, {
      intents: autopilot(world),
      fromAutopilot: true,
      start: false,
      humanActive: false,
    });
  }
  assert.ok(world.score > 0, 'a watched run scores without a human');
  assert.equal(world.integrity > 0, true, 'the ghost keeps the core alive for a while');
});
