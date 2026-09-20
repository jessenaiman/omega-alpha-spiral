import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  captureRuntimeErrors,
  createDiagnostics,
  createEventBus,
  createFixedLoop,
  createInputController,
  createRng,
  createSceneHost,
  createSettings,
  createStateRegistry,
} from '../../src/core';

// --- seeded randomness --------------------------------------------------------
//NOTE: THIS SHIT IS NOT A REAL TEST. NOT A USER REQUIREMENT SCOPE CREEP
test('the same seed produces the same sequence', () => {
  const first = createRng('ghost-terminal');
  const second = createRng('ghost-terminal');
  const draw = (rng: ReturnType<typeof createRng>): number[] =>
    Array.from({ length: 8 }, () => rng.next());
  assert.deepEqual(draw(first), draw(second));
});

test('a different seed produces a different sequence', () => {
  const a = Array.from({ length: 8 }, () => createRng('alpha').next());
  const b = Array.from({ length: 8 }, () => createRng('beta').next());
  assert.notDeepEqual(a, b);
});
// NOT A USER REQUIREMENT SCOPE CREEP WTF
test('a fork is deterministic and independent of the parent draw', () => {
  const draw = (rng: ReturnType<typeof createRng>): number[] =>
    Array.from({ length: 6 }, () => rng.next());
  assert.deepEqual(
    draw(createRng('spiral').fork('shadow-direction')),
    draw(createRng('spiral').fork('shadow-direction')),
  );
  // Drawing from the parent after forking does not disturb the fork.
  const parent = createRng('spiral');
  const forked = parent.fork('shadow-direction');
  parent.next();
  parent.next();
  assert.equal(forked.next(), createRng('spiral').fork('shadow-direction').next());
});

test('shuffle keeps every element and is reproducible for a seed', () => {
  const items = ['dw-a', 'dw-b', 'dw-c', 'dw-d'];
  const once = createRng('seed-1').shuffle(items);
  const twice = createRng('seed-1').shuffle(items);
  assert.deepEqual(once, twice);
  assert.deepEqual([...once].sort(), [...items].sort());
});

test('rng.int rejects a non-positive bound rather than returning nonsense', () => {
  assert.throws(() => createRng('x').int(0), RangeError);
  assert.throws(() => createRng('x').pick([]), RangeError);
});

test('no gameplay or state code reaches for Math.random', () => {
  const root = fileURLToPath(new URL('../../src/', import.meta.url));
  const offenders: string[] = [];
  const walk = (directory: string): void => {
    for (const entry of readdirSync(directory)) {
      const path = join(directory, entry);
      if (statSync(path).isDirectory()) {
        walk(path);
        continue;
      }
      if (!path.endsWith('.ts')) continue;
      if (readFileSync(path, 'utf8').includes('Math.random')) offenders.push(path);
    }
  };
  walk(root);
  assert.deepEqual(offenders, []);
});

// --- typed events -------------------------------------------------------------

test('the bus delivers only the type a handler subscribed to', () => {
  const bus = createEventBus();
  const seen: string[] = [];
  const stop = bus.on('ladder.advance', event => seen.push(`${event.rung}:${event.step}`));
  bus.emit({ type: 'run.begin', seed: 's', echo: 1 });
  bus.emit({ type: 'ladder.advance', step: 2, rung: 'box' });
  assert.deepEqual(seen, ['box:2']);
  stop();
  bus.emit({ type: 'ladder.advance', step: 3, rung: 'icon' });
  assert.deepEqual(seen, ['box:2']);
  assert.equal(bus.count('ladder.advance'), 0);
});

test('a handler may unsubscribe itself while an event is being emitted', () => {
  const bus = createEventBus();
  const seen: string[] = [];
  const stop = bus.on('name.submit', event => {
    seen.push(event.value);
    stop();
  });
  bus.emit({ type: 'name.submit', value: 'first' });
  bus.emit({ type: 'name.submit', value: 'second' });
  assert.deepEqual(seen, ['first']);
});

// --- the fixed-step loop ------------------------------------------------------

test('the loop advances in whole fixed steps and drops older time', () => {
  const steps: number[] = [];
  const loop = createFixedLoop({
    fixedStepMs: 10,
    maxStepsPerFrame: 3,
    update: stepMs => steps.push(stepMs),
  });
  assert.equal(loop.advance(10), 1);
  assert.equal(loop.advance(25), 2);
  assert.equal(loop.advance(1000), 3, 'a long frame takes at most maxStepsPerFrame');
  assert.equal(loop.steps, 6);
  assert.deepEqual(steps, [10, 10, 10, 10, 10, 10]);
});

//No faking user gameplay read the skills or your work and you end

// --- settings -----------------------------------------------------------------

test('settings change once, notify, and hold the same value players read', () => {
  const settings = createSettings({}, { prefersReducedMotion: () => false });
  const seen: boolean[] = [];
  settings.subscribe(value => seen.push(value.reducedMotion));
  assert.equal(settings.set({ reducedMotion: true }).reducedMotion, true);
  assert.equal(settings.set({ reducedMotion: true }).reducedMotion, true);
  assert.deepEqual(seen, [true], 'an unchanged value does not notify');
  assert.equal(settings.value.reducedMotion, true);
});

test('settings follow the operating system preference by default', () => {
  assert.equal(createSettings({}, { prefersReducedMotion: () => true }).value.reducedMotion, true);
});

// --- diagnostics --------------------------------------------------------------

test('diagnostics reports unowned fields as absent rather than inventing them', () => {
  const diagnostics = createDiagnostics();
  const snapshot = diagnostics.snapshot();
  assert.equal(snapshot.instance, null);
  assert.equal(snapshot.checkpoint, null);
  assert.equal(snapshot.party.length, 0);
  assert.deepEqual(snapshot.errors, []);
});

test('diagnostics records and clears runtime errors', () => {
  const diagnostics = createDiagnostics();
  captureRuntimeErrors(diagnostics, undefined);
  diagnostics.recordError(new Error('decode failed'));
  diagnostics.recordError('plain string failure');
  assert.deepEqual(diagnostics.snapshot().errors, ['decode failed', 'plain string failure']);
  diagnostics.clearErrors();
  assert.deepEqual(diagnostics.snapshot().errors, []);
});

test('the state registry refuses a name nobody declared', () => {
  const states = createStateRegistry();
  states.register('ghost-terminal', () => 'ghost-terminal');
  assert.deepEqual(states.names(), ['ghost-terminal']);
  assert.equal(states.apply('ghost-terminal'), 'ghost-terminal');
  assert.throws(() => states.apply('archive-crossing'), /unknown capture state/);
});


test('the acceptance hooks reach real state and reject what they cannot', () => {
  const target: Parameters<ReturnType<typeof createSceneHost>['installAcceptanceSurfaces']>[0] = {};
  const host = testHost();
  host.installAcceptanceSurfaces(target);

  const hooks = target.__THREE_GAME_TEST_HOOKS__;
  assert.ok(hooks, 'test hooks are installed');
  assert.equal(hooks.setState('ghost-terminal'), 'ghost-terminal');
  assert.throws(() => hooks.setState('archive-crossing'), /unknown capture state/);

  assert.equal(hooks.seed('witness-3'), 'witness-3');
  assert.equal(host.state.seed, 'witness-3');

  assert.equal(hooks.setPausedForScreenshot(true), true);
  assert.equal(target.__THREE_GAME_DIAGNOSTICS__?.paused, true);
  assert.equal(hooks.setReducedMotion(true), true);
  assert.equal(target.__THREE_GAME_DIAGNOSTICS__?.accessibility.reducedMotion, true);
  assert.equal(target.__THREE_GAME_DIAGNOSTICS__?.paused, false, 'a settings change releases the capture');
  assert.equal(host.settings.value.reducedMotion, true, 'the hooks drive the settings players use');
  assert.equal(hooks.setDebugHidden(true), true);
  assert.equal(host.settings.value.debugHidden, true);
  assert.equal(target.__THREE_GAME_DIAGNOSTICS__?.phase, 'omega-first');
  assert.equal(target.__THREE_GAME_DIAGNOSTICS__?.loop, 1);

  host.dispose();
  assert.equal(target.__THREE_GAME_TEST_HOOKS__, undefined);
});
