/**
 * The boot wiring, checked without a browser.
 *
 * `src/main.ts` is the only integration point between the page shell and the
 * foundation spine in `src/core`. This test constructs the boot with a fake
 * document, window, and renderer, then asserts the things the loop contract
 * requires of a live page: the host is built from the seeded generator and
 * started, both acceptance surfaces are installed, `setState('ghost-terminal')`
 * is reached through real state ownership, and the settings hooks drive the one
 * store the player will use.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  BOOT_QUESTIONS,
  DEFAULT_SEED,
  bootScene,
  type AcceptanceTarget,
  type BootDocumentLike,
  type BootRenderer,
  type BootWindowLike,
} from '../../src/main';

function fakeDocument(elements: Record<string, unknown>): BootDocumentLike {
  return {
    querySelector: (selector: string) => elements[selector] ?? null,
  };
}

function fakeWindow(): BootWindowLike & { listeners: string[] } {
  const listeners: string[] = [];
  return {
    listeners,
    devicePixelRatio: 1,
    addEventListener: (type: string) => {
      listeners.push(type);
    },
    removeEventListener: () => {},
  };
}

interface StubRenderer extends BootRenderer {
  readonly renders: number;
  readonly calls: number;
  readonly pixelRatio: number;
  readonly clearColour: number | null;
  readonly sizes: ReadonlyArray<readonly [number, number]>;
}

function stubRenderer(): StubRenderer {
  const state = {
    renders: 0,
    calls: 0,
    pixelRatio: 0,
    clearColour: null as number | null,
    sizes: [] as Array<readonly [number, number]>,
  };
  return {
    get renders() {
      return state.renders;
    },
    get calls() {
      return state.calls;
    },
    get pixelRatio() {
      return state.pixelRatio;
    },
    get clearColour() {
      return state.clearColour;
    },
    get sizes() {
      return state.sizes;
    },
    get info() {
      return {
        render: { calls: state.calls, triangles: 0, points: 0, lines: 64 },
        memory: { geometries: 1, textures: 0 },
      };
    },
    setPixelRatio(value: number) {
      state.pixelRatio = value;
    },
    setSize(width: number, height: number) {
      state.sizes.push([width, height]);
    },
    setClearColor(colour: number) {
      state.clearColour = colour;
    },
    render() {
      state.renders += 1;
      state.calls += 3;
    },
    dispose() {},
  };
}

function shell(): Record<string, unknown> {
  return {
    '[data-game-canvas]': { clientWidth: 1280, clientHeight: 720 },
    '[data-game-status]': {},
    '[data-game-error]': {},
  };
}

function boot(options: { elements?: Record<string, unknown>; seed?: string } = {}) {
  const target: AcceptanceTarget = {};
  const renderer = stubRenderer();
  const view = fakeWindow();
  const scene = bootScene({
    document: fakeDocument(options.elements ?? shell()),
    window: view,
    target,
    seed: options.seed,
    createRenderer: () => renderer,
  });
  return { scene, target, renderer, view };
}

test('boot builds the host off the seeded generator, starts it, and installs both surfaces', () => {
  const { scene, target, renderer, view } = boot();

  assert.equal(scene.host.state.seed, DEFAULT_SEED, 'the run starts on the default seed');
  assert.equal(scene.host.state.question, BOOT_QUESTIONS.openingQuestion);
  assert.equal(scene.host.state.phase, 'omega-first');
  assert.equal(scene.host.loop.running, true, 'the loop is started, not merely constructed');
  assert.ok(scene.host.update(20) >= 1, 'the loop advances whole fixed steps');

  assert.equal(typeof target.__THREE_GAME_TEST_HOOKS__?.setState, 'function');
  assert.ok(target.__THREE_GAME_DIAGNOSTICS__, 'the diagnostics surface exists');
  assert.equal(target.__THREE_GAME_DIAGNOSTICS__?.runId, `${DEFAULT_SEED}:1`);
  assert.equal(target.__THREE_GAME_DIAGNOSTICS__?.phase, 'omega-first');
  assert.deepEqual(target.__THREE_GAME_DIAGNOSTICS__?.errors, []);

  assert.ok(scene.scene.children.includes(scene.signal), 'the frame is not an empty scene');
  assert.ok(renderer.renders >= 1, 'a frame was drawn');
  assert.equal(target.__THREE_GAME_DIAGNOSTICS__?.renderer?.calls, renderer.calls);
  assert.ok((target.__THREE_GAME_DIAGNOSTICS__?.renderer?.calls ?? 0) > 0, 'draw calls are reported');
  assert.deepEqual(target.__THREE_GAME_DIAGNOSTICS__?.canvas, {
    width: 1280,
    height: 720,
    pixelRatio: 1,
  });
  assert.equal(renderer.clearColour, 0x070908, 'the inherited house clear colour is unchanged');
  assert.deepEqual(view.listeners, ['resize']);

  scene.dispose();
  assert.equal(scene.host.loop.running, false, 'dispose stops the loop');
  assert.equal(target.__THREE_GAME_TEST_HOOKS__, undefined, 'dispose releases the surfaces');
});

test('the live hook reaches ghost-terminal through real state ownership and rejects an unknown name', () => {
  const { scene, target } = boot();
  const hooks = target.__THREE_GAME_TEST_HOOKS__;
  assert.ok(hooks);

  scene.host.choose('shadow');
  assert.equal(scene.host.state.phase, 'dreamweaver-turn');
  assert.equal(scene.host.state.speaker, 'shadow');

  assert.equal(hooks.setState('ghost-terminal'), 'ghost-terminal', 'it reports what it applied');
  assert.equal(scene.host.state.phase, 'omega-first');
  assert.equal(scene.host.state.speaker, 'omega');
  assert.equal(target.__THREE_GAME_DIAGNOSTICS__?.phase, 'omega-first');

  assert.throws(() => hooks.setState('archive-crossing'), /unknown capture state/);
  scene.dispose();
});

test('reduced motion and debug hiding drive the one settings store the player uses', () => {
  const { scene, target } = boot();
  const hooks = target.__THREE_GAME_TEST_HOOKS__;
  assert.ok(hooks);

  assert.equal(hooks.setReducedMotion(true), true);
  assert.equal(scene.host.settings.value.reducedMotion, true);
  assert.equal(target.__THREE_GAME_DIAGNOSTICS__?.accessibility.reducedMotion, true);

  scene.host.update(40);
  assert.equal(scene.signal.rotation.z, 0, 'reduced motion holds the signal still');

  assert.equal(hooks.setReducedMotion(false), false);
  scene.host.update(40);
  assert.notEqual(scene.signal.rotation.z, 0, 'otherwise the signal advances with the loop');

  assert.equal(hooks.setDebugHidden(true), true);
  assert.equal(scene.host.settings.value.debugHidden, true);
  assert.equal(target.__THREE_GAME_DIAGNOSTICS__?.accessibility.debugHidden, true);

  assert.equal(hooks.setPausedForScreenshot(true), true);
  assert.equal(target.__THREE_GAME_DIAGNOSTICS__?.paused, true);
  assert.equal(hooks.setPausedForScreenshot(false), false);
  scene.dispose();
});

test('an incomplete shell fails loudly instead of booting a blank page', () => {
  assert.throws(
    () => bootScene({ document: fakeDocument({}) }),
    /Game shell is incomplete/,
  );
  assert.throws(
    () =>
      bootScene({
        document: fakeDocument({ '[data-game-canvas]': {}, '[data-game-error]': {} }),
      }),
    /Game shell is incomplete/,
  );
});