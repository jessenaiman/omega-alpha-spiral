/**
 * Spiral Breaker — bot playtest.
 *
 * Drives the real rules with the game's own autopilot (the ghost) and with a
 * reckless input driver, and measures whether the game actually plays:
 * objective progression to victory, input responsiveness, softlock windows,
 * error-free runtime, and a fail state that can be retried. The metrics are
 * written to artifacts/qa/bot-playtest.json and asserted here, so release-ready
 * gameplay claims rest on measured behavior rather than a screenshot.
 */

import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

import type { Intents } from '../../src/core/input';
import {
  autopilot,
  createWorld,
  resetForRun,
  step,
  TUNING,
  type Commands,
  type WorldState,
} from '../../src/arcade/game';

const DT = TUNING.fixedStepMs / 1000;

interface RunMetrics {
  seed: string;
  driver: string;
  framesAdvanced: number;
  reachedVictory: boolean;
  reachedGameOver: boolean;
  scoreAfter: number;
  stepOfFirstScore: number;
  distanceTravelled: number;
  softlockWindows: number;
  errored: boolean;
}

type Driver = (world: WorldState, stepIndex: number) => Commands;

function sampleOf(world: WorldState): { posX: number; posY: number; progress: number } {
  return {
    posX: world.player.pos.x,
    posY: world.player.pos.y,
    progress: world.score + world.wave * 1_000_000 + world.integrity * 1_000_000_000,
  };
}

function runBot(seed: string | number, driver: Driver, maxSteps = 12_000): RunMetrics {
  const world = createWorld(seed);
  resetForRun(world, seed);

  const WINDOW_STEPS = 450;
  const MOTION_FLOOR = WINDOW_STEPS * 0.0002;

  let framesAdvanced = 0;
  let reachedVictory = false;
  let reachedGameOver = false;
  let stepOfFirstScore = -1;
  let distanceTravelled = 0;
  let softlockWindows = 0;
  let errored = false;

  let last = sampleOf(world);
  let windowMovement = 0;
  let windowStart = last;

  try {
    for (let i = 0; i < maxSteps && !reachedVictory; i += 1) {
      const events = step(world, DT, driver(world, i));

      framesAdvanced += 1;
      const now = sampleOf(world);
      const movement = Math.hypot(now.posX - last.posX, now.posY - last.posY);
      windowMovement += movement;
      distanceTravelled += movement;
      if (stepOfFirstScore < 0 && world.score > 0) stepOfFirstScore = framesAdvanced;

      for (const event of events) {
        if (event.type === 'game.over') {
          if (event.victory) reachedVictory = true;
          else reachedGameOver = true;
        }
      }
      if (i > 0 && i % WINDOW_STEPS === 0) {
        const noMotion = windowMovement < MOTION_FLOOR;
        const noProgress = now.progress === windowStart.progress;
        if (noMotion && noProgress) softlockWindows += 1;
        windowMovement = 0;
        windowStart = now;
      }
      last = now;
    }
  } catch {
    errored = true;
  }

  return {
    seed: String(seed),
    driver: 'unknown',
    framesAdvanced,
    reachedVictory,
    reachedGameOver,
    scoreAfter: world.score,
    stepOfFirstScore,
    distanceTravelled,
    softlockWindows,
    errored,
  };
}

const ghostDriver: Driver = (world) => ({
  intents: autopilot(world),
  fromAutopilot: true,
  start: false,
  humanActive: false,
});

const recklessDriver: Driver = (world) => {
  const player = world.player.pos;
  const threat = world.shards[0] ?? { pos: { x: 1, y: 0 } };
  const toward = { x: threat.pos.x - player.x, y: threat.pos.y - player.y };
  const length = Math.hypot(toward.x, toward.y) || 1;
  return {
    intents: { moveX: toward.x / length, moveY: toward.y / length, dash: true, act: false, pause: false },
    fromAutopilot: false,
    start: false,
    humanActive: true,
  };
};

function retryAfterGameOver(seed: string | number, driver: Driver): Outcome {
  const world = createWorld(seed);
  resetForRun(world, seed);
  let died = false;
  let newRun: WorldState | undefined;
  for (let i = 0; i < 12_000 && !newRun; i += 1) {
    const events = step(world, DT, driver(world, i));
    for (const event of events) {
      if (event.type === 'game.over' && !event.victory) died = true;
    }
    if (died) newRun = world;
  }
  return { died, newRun };
}

interface Outcome {
  died: boolean;
  newRun?: WorldState;
}

function startTheNextRun(world: WorldState): void {
  step(world, DT, {
    intents: { moveX: 0, moveY: 0, dash: true, act: false, pause: false },
    fromAutopilot: false,
    start: true,
    humanActive: true,
  });
}

test('the bot playtest runs real drivers against the rules and reports metrics', () => {
  const ghostRuns = (['spiral-42', 'watchable', 42] as const).map((seed) => {
    const metrics = runBot(seed, ghostDriver);
    metrics.driver = 'ghost';
    return metrics;
  });

  for (const run of ghostRuns) {
    assert.equal(run.errored, false, `${run.seed} ghost must run error-free`);
    assert.equal(run.reachedVictory, true, `${run.seed} ghost must clear the gauntlet`);
    assert.equal(run.reachedGameOver, false, `${run.seed} ghost must not die`);
    assert.ok(run.stepOfFirstScore > 0, `${run.seed} ghost must score on the way`);
    assert.equal(run.softlockWindows, 0, `${run.seed} ghost must never stall`);
  }

  const reckless = runBot(42, recklessDriver, 8_000);
  reckless.driver = 'reckless';
  assert.equal(reckless.errored, false, 'the reckless bot must run error-free');
  assert.equal(reckless.reachedGameOver, true, 'a reckless driver must actually die: the pressure is real');

  const { died, newRun } = retryAfterGameOver(42, recklessDriver);
  assert.equal(died, true);
  assert.ok(newRun, 'the reckless bot must reach a game-over world');
  startTheNextRun(newRun!);
  assert.equal(newRun!.phase, 'play', 'the game-over retry must hand back a live run');
  assert.equal(newRun!.integrity, 3, 'the retry must restore integrity');
  assert.equal(newRun!.score, 0, 'the retry must start a fresh score');

  const report = {
    runId: 'pass-3',
    game: 'Spiral Breaker',
    dtMs: TUNING.fixedStepMs,
    runs: [...ghostRuns, reckless],
    verdict:
      'release-ready gameplay measured: the ghost clears the gauntlet on every watchable seed, a reckless driver hits the fail state fast, and the retry restores play.',
  };

  const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'artifacts', 'qa');
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'bot-playtest.json'), JSON.stringify(report, null, 2) + '\n', 'utf8');
});