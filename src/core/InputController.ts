export interface InputFrame {
  move: Readonly<{ x: number; y: number }>;
  dashPressed: boolean;
  actPressed: boolean;
  pausePressed: boolean;
}

export interface ButtonState {
  readonly dash: boolean;
  readonly act: boolean;
  readonly pause: boolean;
}

export const EMPTY_BUTTONS: ButtonState = Object.freeze({
  dash: false,
  act: false,
  pause: false,
});

const GAMEPLAY_KEYS = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight',
  'Space', 'KeyE', 'Enter', 'Escape',
]);

function buttonState(keys: ReadonlySet<string>, pad: Gamepad | null): ButtonState {
  return {
    dash: keys.has('Space') || Boolean(pad?.buttons[0]?.pressed),
    act: keys.has('KeyE') || keys.has('Enter') || Boolean(pad?.buttons[2]?.pressed),
    pause: keys.has('Escape') || Boolean(pad?.buttons[9]?.pressed),
  };
}

export function mapInput(keys: ReadonlySet<string>, pad: Gamepad | null, previous: ButtonState): InputFrame {
  const rawX = Math.max(-1, Math.min(1, pad?.axes[0] ?? 0));
  const rawY = Math.max(-1, Math.min(1, pad?.axes[1] ?? 0));
  const axisX = Math.abs(rawX) >= 0.18 ? rawX : 0;
  const axisY = Math.abs(rawY) >= 0.18 ? rawY : 0;
  const x = Number(keys.has('KeyD') || keys.has('ArrowRight'))
    - Number(keys.has('KeyA') || keys.has('ArrowLeft')) + axisX;
  const y = Number(keys.has('KeyS') || keys.has('ArrowDown'))
    - Number(keys.has('KeyW') || keys.has('ArrowUp')) + axisY;
  const length = Math.hypot(x, y);
  const move = length > 1 ? { x: x / length, y: y / length } : { x, y };
  const current = buttonState(keys, pad);

  return {
    move,
    dashPressed: current.dash && !previous.dash,
    actPressed: current.act && !previous.act,
    pausePressed: current.pause && !previous.pause,
  };
}

interface InputEnvironment {
  keyboard: EventTarget;
  visibility: EventTarget;
  activeElement: () => Element | null;
  visibilityHidden: () => boolean;
  getGamepad: () => Gamepad | null;
}

function browserEnvironment(): InputEnvironment {
  return {
    keyboard: window,
    visibility: document,
    activeElement: () => document.activeElement,
    visibilityHidden: () => document.visibilityState === 'hidden',
    getGamepad: () => Array.from(navigator.getGamepads()).find((pad) => pad?.connected && pad.mapping === 'standard') ?? null,
  };
}

export class InputController {
  private readonly keys = new Set<string>();
  private previous: ButtonState = EMPTY_BUTTONS;
  private readonly environment: InputEnvironment;

  private readonly onKeyDown = (event: Event): void => {
    const key = event as KeyboardEvent;
    this.keys.add(key.code);
    if (GAMEPLAY_KEYS.has(key.code) && this.environment.activeElement() === this.canvas) event.preventDefault();
  };

  private readonly onKeyUp = (event: Event): void => {
    const key = event as KeyboardEvent;
    this.keys.delete(key.code);
    if (GAMEPLAY_KEYS.has(key.code) && this.environment.activeElement() === this.canvas) event.preventDefault();
  };

  private readonly clearKeys = (): void => {
    this.keys.clear();
  };

  private readonly onVisibilityChange = (): void => {
    if (this.environment.visibilityHidden()) this.clearKeys();
  };

  constructor(private readonly canvas: HTMLCanvasElement, environment: InputEnvironment = browserEnvironment()) {
    this.environment = environment;
    environment.keyboard.addEventListener('keydown', this.onKeyDown);
    environment.keyboard.addEventListener('keyup', this.onKeyUp);
    environment.keyboard.addEventListener('blur', this.clearKeys);
    environment.visibility.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  sample(): InputFrame {
    const pad = this.environment.getGamepad();
    const frame = mapInput(this.keys, pad, this.previous);
    this.previous = buttonState(this.keys, pad);
    return frame;
  }

  dispose(): void {
    this.environment.keyboard.removeEventListener('keydown', this.onKeyDown);
    this.environment.keyboard.removeEventListener('keyup', this.onKeyUp);
    this.environment.keyboard.removeEventListener('blur', this.clearKeys);
    this.environment.visibility.removeEventListener('visibilitychange', this.onVisibilityChange);
    this.keys.clear();
  }
}
