import assert from 'node:assert/strict';
import test from 'node:test';

import { EMPTY_BUTTONS, InputController, mapInput, type ButtonState } from '../../src/core/InputController';

function fakePad(axes: number[], pressed: Record<number, boolean>): Gamepad {
  return {
    axes,
    buttons: Array.from({ length: 10 }, (_, index) => ({
      pressed: Boolean(pressed[index]),
      touched: Boolean(pressed[index]),
      value: pressed[index] ? 1 : 0,
    })),
    connected: true,
    id: 'test pad',
    index: 0,
    mapping: 'standard',
    timestamp: 0,
    vibrationActuator: null,
  } as unknown as Gamepad;
}

function keyEvent(type: string, code: string): Event {
  const event = new Event(type, { cancelable: true });
  Object.defineProperty(event, 'code', { value: code });
  return event;
}

test('keyboard maps Move, Dash, Act, and Pause with pressed edges', () => {
  const state = mapInput(new Set(['KeyW', 'KeyD', 'Space', 'KeyE', 'Escape']), null, EMPTY_BUTTONS);
  assert.ok(Math.abs(state.move.x - Math.SQRT1_2) < 0.001);
  assert.ok(Math.abs(state.move.y + Math.SQRT1_2) < 0.001);
  assert.equal(state.dashPressed, true);
  assert.equal(state.actPressed, true);
  assert.equal(state.pausePressed, true);
});

test('standard gamepad uses left stick, south Dash, west Act, menu Pause', () => {
  const pad = fakePad([0.5, -1], { 0: true, 2: true, 9: true });
  const state = mapInput(new Set(), pad, EMPTY_BUTTONS);
  assert.deepEqual(state.move, { x: 0.4472135954999579, y: -0.8944271909999159 });
  assert.equal(state.dashPressed, true);
  assert.equal(state.actPressed, true);
  assert.equal(state.pausePressed, true);
});

test('clamps noisy and out-of-range gamepad axes', () => {
  assert.deepEqual(mapInput(new Set(), fakePad([0.1, -0.1], {}), EMPTY_BUTTONS).move, { x: 0, y: 0 });
  assert.deepEqual(mapInput(new Set(), fakePad([2, 0], {}), EMPTY_BUTTONS).move, { x: 1, y: 0 });
});

test('held buttons only produce one pressed edge', () => {
  const held: ButtonState = { dash: true, act: true, pause: true };
  const state = mapInput(new Set(['Space', 'KeyE', 'Escape']), null, held);
  assert.equal(state.dashPressed, false);
  assert.equal(state.actPressed, false);
  assert.equal(state.pausePressed, false);
});

test('sample advances prior button state and clears held keys on focus loss', () => {
  const keyboard = new EventTarget();
  const visibility = new EventTarget();
  const canvas = {} as HTMLCanvasElement;
  let activeElement: Element | null = canvas;
  let hidden = false;
  const controller = new InputController(canvas, {
    keyboard,
    visibility,
    activeElement: () => activeElement,
    visibilityHidden: () => hidden,
    getGamepad: () => null,
  });

  const dashDown = keyEvent('keydown', 'Space');
  keyboard.dispatchEvent(dashDown);
  assert.equal(dashDown.defaultPrevented, true);
  assert.equal(controller.sample().dashPressed, true);
  assert.equal(controller.sample().dashPressed, false);

  keyboard.dispatchEvent(keyEvent('keydown', 'KeyW'));
  keyboard.dispatchEvent(new Event('blur'));
  assert.deepEqual(controller.sample().move, { x: 0, y: 0 });

  keyboard.dispatchEvent(keyEvent('keydown', 'KeyD'));
  hidden = true;
  visibility.dispatchEvent(new Event('visibilitychange'));
  assert.deepEqual(controller.sample().move, { x: 0, y: 0 });

  activeElement = null;
  const unfocused = keyEvent('keydown', 'ArrowUp');
  keyboard.dispatchEvent(unfocused);
  assert.equal(unfocused.defaultPrevented, false);
  const unrelated = keyEvent('keydown', 'KeyQ');
  activeElement = canvas;
  keyboard.dispatchEvent(unrelated);
  assert.equal(unrelated.defaultPrevented, false);

  controller.dispose();
  keyboard.dispatchEvent(keyEvent('keydown', 'KeyS'));
  assert.deepEqual(controller.sample().move, { x: 0, y: 0 });
});
