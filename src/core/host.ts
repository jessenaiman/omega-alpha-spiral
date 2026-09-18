/**
 * The scene host.
 *
 * Owns the run state and every dependency it needs: one seeded generator, one
 * event bus, one fixed-step loop, one intent reader, one settings store, and one
 * diagnostics readout. Nothing else creates them, so there is exactly one update
 * order and one source of randomness in the scene.
 *
 * Update order, once per fixed step:
 *   read intents -> act on pause -> reduce run state -> emit typed events ->
 *   hand the frame to presentation
 *
 * The host does not decide which option a player focused; `choose` takes the
 * option owner. Presentation owns focus, the player owns the choice.
 */

import {
  createDiagnostics,
  createStateRegistry,
  type AcceptanceTarget,
  type Diagnostics,
  type SceneTestHooks,
  type StateRegistry,
} from './acceptance';
import { createEventBus, emitAll, type EventBus, type SceneEvent } from './events';
import { createFixedLoop, type FixedLoop } from './loop';
import { createInputController, IDLE_INTENTS, type EventTargetLike, type GamepadLike, type InputController, type Intents } from './input';
import { createSettings, type SceneSettings, type SettingsStore } from './settings';
import { beginRun, reduceRun, type RunAction, type RunConfig, type RunState } from '../game/run-state';
import type { Dreamweaver } from '../game/affinity';

export interface HostFrame {
  readonly state: RunState;
  readonly intents: Intents;
  /** Fraction of a step left over, for presentation smoothing. */
  readonly alpha: number;
  readonly paused: boolean;
}

export interface SceneHostOptions {
  readonly seed: string | number;
  readonly echo?: number;
  readonly openingQuestion: string;
  readonly closingQuestion: string;
  readonly dreamweaverQuestions: readonly string[];
  readonly fixedStepMs?: number;
  readonly maxStepsPerFrame?: number;
  readonly inputTarget?: EventTargetLike;
  readonly gamepad?: () => GamepadLike | null;
  readonly onFrame?: (frame: HostFrame) => void;
  readonly settings?: Partial<SceneSettings>;
}

export interface SceneHost {
  readonly events: EventBus;
  readonly diagnostics: Diagnostics;
  readonly settings: SettingsStore;
  readonly states: StateRegistry;
  readonly input: InputController;
  readonly loop: FixedLoop;
  readonly state: RunState;
  readonly paused: boolean;
  /** Events the run has emitted, oldest first. Useful for evidence, not gameplay. */
  readonly log: readonly SceneEvent[];
  start(): void;
  stop(): void;
  /** Fixed-step advance. Returns the whole steps taken; zero while paused. */
  update(deltaMs: number): number;
  /** Commit a choice. Returns the events it produced, or none while paused. */
  choose(optionOwner: Dreamweaver): readonly SceneEvent[];
  /** Answer the closing question. Returns the events it produced, or none while paused. */
  submitName(value: string): readonly SceneEvent[];
  setPaused(paused: boolean): boolean;
  /** Start the scene again from its opening beat. */
  restart(overrides?: { readonly seed?: string | number; readonly echo?: number }): RunState;
  installAcceptanceSurfaces(target?: AcceptanceTarget): void;
  dispose(): void;
}

function defaultInputTarget(): EventTargetLike | undefined {
  const candidate = globalThis as unknown as Partial<EventTargetLike>;
  return typeof candidate.addEventListener === 'function'
    ? (candidate as EventTargetLike)
    : undefined;
}

export function createSceneHost(options: SceneHostOptions): SceneHost {
  const events = createEventBus();
  const diagnostics = createDiagnostics();
  const settings = createSettings(options.settings ?? {});
  const states = createStateRegistry();
  const input = createInputController({
    target: options.inputTarget ?? defaultInputTarget(),
    gamepad: options.gamepad,
  });

  const log: SceneEvent[] = [];
  let config: RunConfig = {
    seed: options.seed,
    echo: options.echo ?? 1,
    openingQuestion: options.openingQuestion,
    closingQuestion: options.closingQuestion,
    dreamweaverQuestions: options.dreamweaverQuestions,
  };
  let run = beginRun(config);
  let paused = false;
  let started = false;
  let lastIntents: Intents = IDLE_INTENTS;
  let acceptanceTarget: AcceptanceTarget | null = null;

  for (const event of run.events) log.push(event);

  const publishDiagnostics = (): void => {
    diagnostics.update({
      runId: `${run.state.seed}:${run.state.echo}`,
      loop: run.state.echo,
      phase: run.state.phase,
      pairing: run.state.pairing,
      paused,
      accessibility: {
        reducedMotion: settings.value.reducedMotion,
        debugHidden: settings.value.debugHidden,
      },
    });
    if (!acceptanceTarget) return;
    const snapshot = diagnostics.snapshot();
    if (acceptanceTarget.__THREE_GAME_DIAGNOSTICS__) {
      Object.assign(acceptanceTarget.__THREE_GAME_DIAGNOSTICS__, snapshot);
    } else {
      acceptanceTarget.__THREE_GAME_DIAGNOSTICS__ = snapshot;
    }
  };

  const emitFrame = (alpha: number): void => {
    options.onFrame?.({
      state: run.state,
      intents: paused ? IDLE_INTENTS : lastIntents,
      alpha,
      paused,
    });
    publishDiagnostics();
  };

  const commit = (action: RunAction): readonly SceneEvent[] => {
    if (paused) return [];
    const transition = reduceRun(run.state, action);
    run = transition;
    for (const event of transition.events) log.push(event);
    publishDiagnostics();
    emitAll(events, transition.events);
    return transition.events;
  };

  const step = (): void => {
    if (paused) return;
    const intents = input.readIntents();
    lastIntents = intents;
    if (intents.pause) paused = !paused;
  };

  const loop = createFixedLoop({
    fixedStepMs: options.fixedStepMs,
    maxStepsPerFrame: options.maxStepsPerFrame,
    update: (): void => {
      try {
        step();
      } catch (error) {
        diagnostics.recordError(error);
        paused = true;
        loop.stop();
      }
    },
    render: emitFrame,
  });

  const restart = (overrides: { readonly seed?: string | number; readonly echo?: number } = {}): RunState => {
    config = { ...config, ...overrides };
    run = beginRun(config);
    log.length = 0;
    for (const event of run.events) log.push(event);
    input.releaseAll();
    lastIntents = IDLE_INTENTS;
    publishDiagnostics();
    if (started) emitAll(events, run.events);
    return run.state;
  };

  // The one named capture state this layer owns. The contract's other names
  // belong to the console, the journey, and the presence tickets; they register
  // their own once they exist rather than claiming a state they cannot reach.
  states.register('ghost-terminal', () => {
    restart();
    paused = false;
    return 'ghost-terminal';
  });

  const hooks: SceneTestHooks = {
    seed(value: string | number): string {
      return restart({ seed: value }).seed;
    },
    setState(name: string): string {
      return states.apply(name);
    },
    setPausedForScreenshot(value: boolean): boolean {
      return host.setPaused(value);
    },
    setReducedMotion(enabled: boolean): boolean {
      const applied = settings.set({ reducedMotion: enabled }).reducedMotion;
      host.setPaused(false);
      return applied;
    },
    setDebugHidden(hidden: boolean): boolean {
      const applied = settings.set({ debugHidden: hidden }).debugHidden;
      host.setPaused(false);
      return applied;
    },
  };

  const host: SceneHost = {
    events,
    diagnostics,
    settings,
    states,
    input,
    loop,
    get state(): RunState {
      return run.state;
    },
    get paused(): boolean {
      return paused;
    },
    get log(): readonly SceneEvent[] {
      return log;
    },
    update(deltaMs: number): number {
      if (paused) {
        // A paused scene still reads intents, or the pause could never be
        // released. It simulates nothing until the pause intent clears it.
        lastIntents = input.readIntents();
        if (lastIntents.pause) paused = false;
        emitFrame(1);
        return 0;
      }
      return loop.advance(deltaMs);
    },
    start(): void {
      if (started) return;
      started = true;
      emitAll(events, run.events);
      publishDiagnostics();
      loop.start();
    },
    stop(): void {
      loop.stop();
    },
    choose(optionOwner: Dreamweaver): readonly SceneEvent[] {
      return commit({ type: 'choose', optionOwner });
    },
    submitName(value: string): readonly SceneEvent[] {
      return commit({ type: 'name', value });
    },
    setPaused(value: boolean): boolean {
      paused = value;
      publishDiagnostics();
      return paused;
    },
    restart,
    installAcceptanceSurfaces(target: AcceptanceTarget = globalThis as AcceptanceTarget): void {
      acceptanceTarget = target;
      target.__THREE_GAME_TEST_HOOKS__ = hooks;
      publishDiagnostics();
    },
    dispose(): void {
      loop.dispose();
      input.dispose();
      events.clear();
      if (acceptanceTarget) {
        delete acceptanceTarget.__THREE_GAME_TEST_HOOKS__;
        delete acceptanceTarget.__THREE_GAME_DIAGNOSTICS__;
        acceptanceTarget = null;
      }
    },
  };

  return host;
}
