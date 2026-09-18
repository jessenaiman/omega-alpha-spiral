/**
 * The fixed-step loop.
 *
 * One update order, one step size. Simulation advances in whole fixed steps and
 * rendering receives the leftover fraction, so the same seed and the same inputs
 * produce the same run whatever the frame times were.
 *
 * `advance(deltaMs)` is the whole loop. `start()` only supplies real frames; a
 * test drives `advance` directly and never needs a browser.
 */

export interface FixedLoopOptions {
  /** Simulation step, in milliseconds. Defaults to 1000/60. */
  readonly fixedStepMs?: number;
  /** Most whole steps allowed to catch up in one frame. Older time is dropped. */
  readonly maxStepsPerFrame?: number;
  /** One simulation step. */
  readonly update: (stepMs: number) => void;
  /** Draw after the steps, with the fraction of a step left over. */
  readonly render?: (alpha: number) => void;
  readonly schedule?: (callback: (timestampMs: number) => void) => number;
  readonly cancel?: (handle: number) => void;
  readonly now?: () => number;
}

export interface FixedLoop {
  readonly running: boolean;
  /** Whole simulation steps taken so far. */
  readonly steps: number;
  /** Simulated time in milliseconds. */
  readonly elapsedMs: number;
  start(): void;
  stop(): void;
  /** Advance by a real delta. Returns how many whole steps ran. */
  advance(deltaMs: number): number;
  dispose(): void;
}

export const DEFAULT_FIXED_STEP_MS = 1000 / 60;
export const DEFAULT_MAX_STEPS_PER_FRAME = 5;

function defaultSchedule(callback: (timestampMs: number) => void): number {
  if (typeof globalThis.requestAnimationFrame === 'function') {
    return globalThis.requestAnimationFrame(callback);
  }
  return setTimeout(() => callback(Date.now()), DEFAULT_FIXED_STEP_MS) as unknown as number;
}

function defaultCancel(handle: number): void {
  if (typeof globalThis.cancelAnimationFrame === 'function') {
    globalThis.cancelAnimationFrame(handle);
    return;
  }
  clearTimeout(handle as unknown as ReturnType<typeof setTimeout>);
}

export function createFixedLoop(options: FixedLoopOptions): FixedLoop {
  const fixedStepMs = options.fixedStepMs ?? DEFAULT_FIXED_STEP_MS;
  const maxStepsPerFrame = Math.max(1, options.maxStepsPerFrame ?? DEFAULT_MAX_STEPS_PER_FRAME);
  const schedule = options.schedule ?? defaultSchedule;
  const cancel = options.cancel ?? defaultCancel;
  const now = options.now ?? (() => Date.now());

  let running = false;
  let handle: number | null = null;
  let lastTimestampMs = 0;
  let accumulatorMs = 0;
  let steps = 0;
  let elapsedMs = 0;

  const frame = (timestampMs: number): void => {
    if (!running) return;
    const deltaMs = Math.max(0, timestampMs - lastTimestampMs);
    lastTimestampMs = timestampMs;
    advance(deltaMs);
    handle = schedule(frame);
  };

  const advance = (deltaMs: number): number => {
    const clampedMs = Math.min(Math.max(deltaMs, 0), fixedStepMs * maxStepsPerFrame);
    accumulatorMs += clampedMs;
    let taken = 0;
    while (accumulatorMs >= fixedStepMs && taken < maxStepsPerFrame) {
      accumulatorMs -= fixedStepMs;
      taken += 1;
      steps += 1;
      elapsedMs += fixedStepMs;
      options.update(fixedStepMs);
    }
    if (accumulatorMs > fixedStepMs) accumulatorMs = 0;
    options.render?.(accumulatorMs / fixedStepMs);
    return taken;
  };

  const start = (): void => {
    if (running) return;
    running = true;
    lastTimestampMs = now();
    handle = schedule(frame);
  };

  const stop = (): void => {
    running = false;
    if (handle !== null) {
      cancel(handle);
      handle = null;
    }
  };

  return {
    get running(): boolean {
      return running;
    },
    get steps(): number {
      return steps;
    },
    get elapsedMs(): number {
      return elapsedMs;
    },
    advance,
    start,
    stop,
    dispose: stop,
  };
}
