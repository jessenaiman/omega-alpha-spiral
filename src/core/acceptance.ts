/**
 * Acceptance surfaces — what the loop contract requires the running scene to
 * expose, so that evidence can be taken from the real game and not from a mock.
 *
 *   window.__THREE_GAME_TEST_HOOKS__   deterministic seed selection, named state
 *                                      entry, an immediate pause for captures,
 *                                      reduced motion, and debug hiding
 *   window.__THREE_GAME_DIAGNOSTICS__  a live readout of the run
 *
 * `docs/game/core-loop-contract.md` names every field below. Fields whose owner
 * does not exist yet stay `null` rather than reporting a value nobody produced.
 */

import type { Dreamweaver } from '../game/affinity';

export interface DiagnosticsSnapshot {
  readonly runId: string;
  /** The seeded three-digit base instance. Owned by session lineage. */
  readonly instance: number | null;
  readonly loop: number;
  readonly phase: string;
  readonly checkpoint: string | null;
  readonly objective: string | null;
  readonly targetVerb: string | null;
  readonly playerState: string | null;
  readonly party: readonly string[];
  readonly route: string | null;
  readonly pairing: Dreamweaver | null;
  readonly era: string | null;
  readonly paused: boolean;
  readonly accessibility: {
    readonly reducedMotion: boolean;
    readonly debugHidden: boolean;
  };
  readonly audio: { readonly unlocked: boolean };
  readonly canvas: {
    readonly width: number;
    readonly height: number;
    readonly pixelRatio: number;
  } | null;
  readonly renderer: {
    readonly calls: number;
    readonly triangles: number;
    readonly geometries: number;
    readonly textures: number;
  } | null;
  readonly errors: readonly string[];
}

export type DiagnosticsPatch = Partial<Omit<DiagnosticsSnapshot, 'errors'>>;

export interface Diagnostics {
  snapshot(): DiagnosticsSnapshot;
  update(patch: DiagnosticsPatch): void;
  recordError(error: unknown): void;
  clearErrors(): void;
}

export function createDiagnostics(initial: DiagnosticsPatch = {}): Diagnostics {
  const errors: string[] = [];
  let snapshot: DiagnosticsSnapshot = {
    runId: 'unstarted',
    instance: null,
    loop: 0,
    phase: 'unstarted',
    checkpoint: null,
    objective: null,
    targetVerb: null,
    playerState: null,
    party: [],
    route: null,
    pairing: null,
    era: null,
    paused: false,
    accessibility: { reducedMotion: false, debugHidden: false },
    audio: { unlocked: false },
    canvas: null,
    renderer: null,
    ...initial,
    errors,
  };

  return {
    snapshot(): DiagnosticsSnapshot {
      return snapshot;
    },
    update(patch: DiagnosticsPatch): void {
      snapshot = { ...snapshot, ...patch, errors };
    },
    recordError(error: unknown): void {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(message);
      snapshot = { ...snapshot, errors };
    },
    clearErrors(): void {
      errors.length = 0;
      snapshot = { ...snapshot, errors };
    },
  };
}

/** Fold a thrown error into a diagnostics readout without losing it. */
export function captureError(diagnostics: Diagnostics, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  diagnostics.recordError(error);
  return message;
}

/**
 * Listen for uncaught browser errors so the readout can report an empty list
 * rather than an absent one.
 */
export function captureRuntimeErrors(
  diagnostics: Diagnostics,
  target: { addEventListener(type: string, listener: (event: Event) => void): void } | undefined,
): void {
  if (!target) return;
  target.addEventListener('error', (event: Event) => {
    diagnostics.recordError((event as ErrorEvent).message ?? 'error');
  });
  target.addEventListener('unhandledrejection', (event: Event) => {
    diagnostics.recordError((event as PromiseRejectionEvent).reason ?? 'unhandled rejection');
  });
}

// --- named capture states ----------------------------------------------------

/**
 * The contract's named states. A named state must be reached through the state
 * that really owns it, so each owner registers itself here; `apply` returns the
 * name it actually applied and throws when it cannot.
 */
export interface StateRegistry {
  register(name: string, apply: () => string): void;
  names(): readonly string[];
  apply(name: string): string;
}

export function createStateRegistry(): StateRegistry {
  const states = new Map<string, () => string>();

  return {
    register(name: string, apply: () => string): void {
      states.set(name, apply);
    },
    names(): readonly string[] {
      return [...states.keys()].sort();
    },
    apply(name: string): string {
      const state = states.get(name);
      if (!state) {
        throw new Error(
          `unknown capture state "${name}"; this scene declares: ${[...states.keys()].sort().join(', ') || 'none'}`,
        );
      }
      return state();
    },
  };
}

// --- test hooks --------------------------------------------------------------

/**
 * The contract's hook names, and nothing else. `seed` and `setState` go through
 * the host's own state ownership; the settings hooks go through the store the
 * player uses.
 */
export interface SceneTestHooks {
  seed(value: string | number): string;
  setState(name: string): string | { readonly state: string };
  setPausedForScreenshot(paused: boolean): boolean;
  setReducedMotion(enabled: boolean): boolean;
  setDebugHidden(hidden: boolean): boolean;
}

export interface AcceptanceTarget {
  __THREE_GAME_TEST_HOOKS__?: SceneTestHooks;
  __THREE_GAME_DIAGNOSTICS__?: DiagnosticsSnapshot;
}
