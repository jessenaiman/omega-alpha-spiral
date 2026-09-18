/**
 * Input intents.
 *
 * Nothing downstream reads a key or a button. Keyboard, gamepad, and anything
 * added later emit the same intents, so every input method reaches the same
 * outcome — the loop contract's parity requirement, kept in one place.
 *
 * Mapping is the loop contract's, not a new decision:
 *   Move  — WASD, arrow keys, left stick
 *   Dash  — Space, south gamepad button
 *   Act   — E, Enter, west gamepad button
 *   Pause — Escape, gamepad menu button
 *
 * `dash`, `act`, and `pause` are edges: true on the step they were pressed.
 * `move` is held state.
 */

export interface Intents {
  /** -1, 0, or 1 on each axis. */
  readonly moveX: number;
  readonly moveY: number;
  /** Pressed this step. */
  readonly dash: boolean;
  /** Pressed this step. Contextual Act. */
  readonly act: boolean;
  /** Pressed this step. */
  readonly pause: boolean;
}

export const IDLE_INTENTS: Intents = Object.freeze({
  moveX: 0,
  moveY: 0,
  dash: false,
  act: false,
  pause: false,
});

/** The subset of `EventTarget` this module needs; a test may fake it. */
export interface EventTargetLike {
  addEventListener(type: string, listener: (event: Event) => void): void;
  removeEventListener(type: string, listener: (event: Event) => void): void;
}

export interface GamepadLike {
  readonly axes: readonly number[];
  readonly buttons: readonly { readonly pressed: boolean }[];
}

export interface InputController {
  /** The intents for this step. Edge flags clear as they are read. */
  readIntents(): Intents;
  attach(target: EventTargetLike): void;
  /** Forget every held key; used when a window blurs or the scene resets. */
  releaseAll(): void;
  detach(): void;
  dispose(): void;
}

export interface InputControllerOptions {
  /** Attached immediately when given. */
  readonly target?: EventTargetLike;
  /** Reads the first connected gamepad. Defaults to the browser's gamepad list. */
  readonly gamepad?: () => GamepadLike | null;
  /** Stick travel needed before it reads as movement. */
  readonly deadZone?: number;
}

const MOVE_CODES: Record<string, readonly [number, number]> = {
  KeyW: [0, 1],
  ArrowUp: [0, 1],
  KeyS: [0, -1],
  ArrowDown: [0, -1],
  KeyA: [-1, 0],
  ArrowLeft: [-1, 0],
  KeyD: [1, 0],
  ArrowRight: [1, 0],
};

const DASH_CODES = ['Space'];
const ACT_CODES = ['KeyE', 'Enter'];
const PAUSE_CODES = ['Escape'];

const GAMEPAD_DASH_BUTTON = 0; // south
const GAMEPAD_ACT_BUTTON = 2; // west
const GAMEPAD_PAUSE_BUTTON = 9; // menu / start

function defaultGamepad(): GamepadLike | null {
  if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return null;
  for (const pad of navigator.getGamepads()) {
    if (pad) return pad;
  }
  return null;
}

const sign = (value: number, threshold: number): number =>
  value > threshold ? 1 : value < -threshold ? -1 : 0;

export function createInputController(options: InputControllerOptions = {}): InputController {
  const deadZone = options.deadZone ?? 0.35;
  const readGamepad = options.gamepad ?? defaultGamepad;

  const heldKeys = new Set<string>();
  const edges = new Set<'dash' | 'act' | 'pause'>();
  let previousGamepadButtons: boolean[] = [];
  let attached: EventTargetLike | null = null;

  const onKeyDown = (event: Event): void => {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.repeat) return;
    const code = keyboardEvent.code;
    if (MOVE_CODES[code]) heldKeys.add(code);
    if (DASH_CODES.includes(code)) edges.add('dash');
    if (ACT_CODES.includes(code)) edges.add('act');
    if (PAUSE_CODES.includes(code)) edges.add('pause');
  };

  const onKeyUp = (event: Event): void => {
    heldKeys.delete((event as KeyboardEvent).code);
  };

  const onBlur = (): void => {
    heldKeys.clear();
  };

  const releaseAll = (): void => {
    heldKeys.clear();
    edges.clear();
    previousGamepadButtons = [];
  };

  const detach = (): void => {
    if (!attached) return;
    attached.removeEventListener('keydown', onKeyDown);
    attached.removeEventListener('keyup', onKeyUp);
    attached.removeEventListener('blur', onBlur);
    attached = null;
    releaseAll();
  };

  const attach = (target: EventTargetLike): void => {
    detach();
    attached = target;
    target.addEventListener('keydown', onKeyDown);
    target.addEventListener('keyup', onKeyUp);
    target.addEventListener('blur', onBlur);
  };

  const readIntents = (): Intents => {
    let moveX = 0;
    let moveY = 0;
    for (const code of heldKeys) {
      const axis = MOVE_CODES[code];
      if (axis) {
        moveX += axis[0];
        moveY += axis[1];
      }
    }

    const pad = readGamepad();
    if (pad) {
      moveX += sign(pad.axes[0] ?? 0, deadZone);
      moveY -= sign(pad.axes[1] ?? 0, deadZone);
      const buttons = pad.buttons.map(button => button.pressed);
      const pressedNow = (index: number): boolean =>
        Boolean(buttons[index]) && !Boolean(previousGamepadButtons[index]);
      if (pressedNow(GAMEPAD_DASH_BUTTON)) edges.add('dash');
      if (pressedNow(GAMEPAD_ACT_BUTTON)) edges.add('act');
      if (pressedNow(GAMEPAD_PAUSE_BUTTON)) edges.add('pause');
      previousGamepadButtons = buttons;
    }

    return {
      moveX: sign(moveX, 0.5),
      moveY: sign(moveY, 0.5),
      dash: edges.delete('dash'),
      act: edges.delete('act'),
      pause: edges.delete('pause'),
    };
  };

  if (options.target) attach(options.target);

  return {
    readIntents,
    attach,
    releaseAll,
    detach,
    dispose: detach,
  };
}
