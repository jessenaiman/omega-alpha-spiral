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

// --- input intents ------------------------------------------------------------

interface FakeTarget {
  addEventListener(type: string, listener: (event: Event) => void): void;
  removeEventListener(type: string, listener: (event: Event) => void): void;
  dispatch(type: string, event: Partial<KeyboardEvent>): void;
}

function fakeTarget(): FakeTarget {
  const listeners = new Map<string, Set<(event: Event) => void>>();
  return {
    addEventListener(type, listener) {
      let set = listeners.get(type);
      if (!set) {
        set = new Set();
        listeners.set(type, set);
      }
      set.add(listener);
    },
    removeEventListener(type, listener) {
      listeners.get(type)?.delete(listener);
    },
    dispatch(type, event) {
      for (const listener of [...(listeners.get(type) ?? [])]) {
        listener(event as unknown as Event);
      }
    },
  };
}

test('keyboard emits intents, not keys, and edges clear as they are read', () => {
  const target = fakeTarget();
  const input = createInputController({ target, gamepad: () => null });

  target.dispatch('keydown', { code: 'KeyD' });
  target.dispatch('keydown', { code: 'Space' });
  const first = input.readIntents();
  assert.deepEqual(first, { moveX: 1, moveY: 0, dash: true, act: false, pause: false });
  const second = input.readIntents();
  assert.equal(second.dash, false, 'dash is an edge, not a held state');
  assert.equal(second.moveX, 1, 'movement is held state');

  target.dispatch('keyup', { code: 'KeyD' });
  assert.equal(input.readIntents().moveX, 0);
  input.dispose();
});

test('a gamepad reaches the same intents as the keyboard', () => {
  let buttons = [{ pressed: false }, { pressed: false }, { pressed: false }];
  const axes = [0, 0, 0, 0];
  axes[0] = -1;
  buttons = [{ pressed: false }, { pressed: false }, { pressed: true }];
  const input = createInputController({
    target: fakeTarget(),
    gamepad: () => ({ axes, buttons }),
  });
  const intents = input.readIntents();
  assert.equal(intents.moveX, -1);
  assert.equal(intents.act, true);
  assert.equal(input.readIntents().act, false, 'the west button is an edge too');
  input.dispose();
});

test('losing focus releases every held key', () => {
  const target = fakeTarget();
  const input = createInputController({ target, gamepad: () => null });
  target.dispatch('keydown', { code: 'KeyW' });
  assert.equal(input.readIntents().moveY, 1);
  target.dispatch('blur', {});
  assert.equal(input.readIntents().moveY, 0);
  input.dispose();
});

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

// --- the host -----------------------------------------------------------------

function testHost(options: { seed?: string } = {}) {
  return createSceneHost({
    seed: options.seed ?? 'ghost-472',
    openingQuestion: 'omega.opening',
    closingQuestion: 'omega.name',
    dreamweaverQuestions: ['dw.a', 'dw.b', 'dw.c', 'dw.d'],
    inputTarget: fakeTarget(),
    gamepad: () => null,
  });
}

test('the host starts on Omega asking the opening question', () => {
  const host = testHost();
  const kinds = host.log.map(event => event.type);
  assert.deepEqual(kinds, ['run.begin', 'question.ask']);
  assert.equal(host.state.speaker, 'omega');
  assert.equal(host.state.question, 'omega.opening');
  assert.equal(host.state.rung, 'dot');
  host.dispose();
});

test('a choice emits the beat, the score, the ladder step, and the next ask', () => {
  const host = testHost();
  const events = host.choose('shadow');
  assert.deepEqual(
    events.map(event => event.type),
    ['choice.commit', 'affinity.change', 'ladder.advance', 'dreamweaver.ask-to-speak', 'question.ask'],
  );
  assert.deepEqual(host.state.affinity, { light: 0, shadow: 1, ambition: 0 });
  assert.equal(host.state.speaker, 'shadow');
  assert.equal(host.state.rung, 'line');
  assert.equal(host.state.questionOrder.length, 3);
  host.dispose();
});

test('a Dreamweaver that has already spoken hands the turn on, and all three speak once', () => {
  const host = testHost();
  host.choose('light');
  host.choose('light');
  host.choose('light');
  host.choose('light');
  assert.deepEqual([...host.state.rotation], ['light', 'shadow', 'ambition']);
  assert.equal(new Set(host.state.rotation).size, host.state.rotation.length);
  assert.equal(host.state.phase, 'omega-last');
  assert.equal(host.state.speaker, 'omega');
  assert.equal(host.state.question, 'omega.name');
  host.dispose();
});

test('the closing name completes the run and attaches the pairing', () => {
  const host = testHost();
  host.choose('light');
  host.choose('light');
  host.choose('light');
  host.choose('light');
  const events = host.submitName('  Wren  ');
  assert.deepEqual(events.map(event => event.type), ['name.submit', 'run.complete']);
  assert.equal(host.state.phase, 'complete');
  assert.equal(host.state.playerName, 'Wren');
  assert.equal(host.state.pairing, 'light');
  assert.throws(() => host.choose('shadow'), /complete/);
  host.dispose();
});

test('the ladder never regresses across a whole run', () => {
  const order = ['dot', 'line', 'box', 'icon'];
  const host = testHost();
  let previous = 0;
  for (const pick of ['ambition', 'light', 'shadow', 'ambition'] as const) {
    host.choose(pick);
    const index = order.indexOf(host.state.rung);
    assert.ok(index >= previous, `ladder regressed at ${host.state.rung}`);
    previous = index;
  }
  host.dispose();
});

test('a paused scene stops simulating but keeps rendering', () => {
  const frames: Array<{ paused: boolean; alpha: number }> = [];
  const host = createSceneHost({
    seed: 'capture',
    openingQuestion: 'omega.opening',
    closingQuestion: 'omega.name',
    dreamweaverQuestions: ['dw.a', 'dw.b', 'dw.c'],
    inputTarget: fakeTarget(),
    onFrame: frame => frames.push({ paused: frame.paused, alpha: frame.alpha }),
  });
  host.update(17);
  assert.equal(host.loop.steps, 1);
  host.setPaused(true);
  assert.equal(host.update(17), 0);
  assert.equal(host.loop.steps, 1, 'no simulation while paused for capture');
  assert.equal(frames.at(-1)?.paused, true);
  assert.equal(frames.at(-1)?.alpha, 1, 'the scene stays renderable');
  assert.deepEqual(host.choose('light'), [], 'a paused scene accepts no choice');
  host.setPaused(false);
  assert.equal(host.update(17), 1);
  assert.equal(host.choose('light').length > 0, true);
  host.dispose();
});

test('the escape intent pauses the scene and the next one resumes it', () => {
  const target = fakeTarget();
  const host = createSceneHost({
    seed: 'pause',
    openingQuestion: 'omega.opening',
    closingQuestion: 'omega.name',
    dreamweaverQuestions: ['dw.a', 'dw.b', 'dw.c'],
    inputTarget: target,
    gamepad: () => null,
  });
  target.dispatch('keydown', { code: 'Escape' });
  host.update(17);
  assert.equal(host.paused, true);
  target.dispatch('keydown', { code: 'Escape' });
  host.update(17);
  assert.equal(host.paused, false);
  host.dispose();
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
