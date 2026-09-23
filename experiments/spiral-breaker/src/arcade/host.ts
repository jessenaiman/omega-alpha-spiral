/**
 * Spiral Breaker — the runtime host.
 *
 * Owns the things the rules must not: the fixed-step loop, keyboard/gamepad
 * input, player settings, diagnostics, and the acceptance surfaces. The rules
 * stay a pure function this host feeds.
 *
 * The naming follows `docs/game/core-loop-contract.md` so the same canvas
 * inspector that captures the Ghost Terminal scene can capture this one.
 */

import {
  createDiagnostics,
  createFixedLoop,
  createInputController,
  createSettings,
  normalizeSeed,
  type Diagnostics,
  type DiagnosticsPatch,
  type EventTargetLike,
  type FixedLoop,
  type GamepadLike,
  type InputController,
  type SettingsStore,
} from "../../../src/core";
import {
  anyHumanActive,
  autopilot,
  createWorld,
  pickThreat,
  resetForRun,
  step,
  TUNING,
  type ArcadeEvent,
  type Commands,
  type WorldState,
} from "./game";

export interface ArcadeFrame {
  readonly alpha: number;
  readonly paused: boolean;
  readonly dtMs: number;
}

export interface ArcadeHostOptions {
  readonly seed?: string | number;
  readonly inputTarget?: EventTargetLike;
  readonly gamepad?: () => GamepadLike | null;
  readonly reducedMotion?: boolean;
  /** Called after every fixed step with that step's events. */
  readonly onStep?: (events: readonly ArcadeEvent[], world: WorldState) => void;
  /** Called once per rendered frame; the presentation lives here. */
  readonly onFrame?: (frame: ArcadeFrame) => void;
  readonly schedule?: (callback: (timestampMs: number) => void) => number;
  readonly cancel?: (handle: number) => void;
  readonly now?: () => number;
}

export interface ArcadeHost {
  world: WorldState;
  readonly settings: SettingsStore;
  readonly diagnostics: Diagnostics;
  readonly seed: string;
  readonly paused: boolean;
  setPaused(paused: boolean): boolean;
  /** Drive the loop for a real frame delta. Returns whole steps taken. */
  update(deltaMs: number): number;
  /** Fold live renderer numbers into the diagnostics readout. */
  reportRender(patch: DiagnosticsPatch): void;
  installAcceptanceSurfaces(target: ArcadeAcceptanceTarget): void;
  dispose(): void;
}

export interface ArcadeAcceptanceTarget {
  __THREE_GAME_TEST_HOOKS__?: ArcadeTestHooks;
  __THREE_GAME_DIAGNOSTICS__?: unknown;
}

export interface ArcadeTestHooks {
  seed(value: string | number): string;
  setState(name: string): { state: string };
  setPausedForScreenshot(paused: boolean): boolean;
  setReducedMotion(enabled: boolean): boolean;
  setDebugHidden(hidden: boolean): boolean;
  /** The name the canvas inspector looks for. */
  hideDebugUi(hidden: boolean): boolean;
}

/** How many ghost steps to simulate when a capture wants a live "active-play". */
const ACTIVE_PLAY_WARMUP_STEPS = 120;
/** After warm-up, keep stepping only until at least one shard is on screen. */
const ACTIVE_PLAY_FILL_STEPS = 240;

export function createArcadeHost(options: ArcadeHostOptions = {}): ArcadeHost {
  const seed = normalizeSeed(options.seed ?? "spiral");
  let world = createWorld(seed);
  const settings = createSettings({
    reducedMotion: options.reducedMotion ?? false,
  });
  const diagnostics = createDiagnostics({
    runId: seed,
    phase: "menu",
    objective: "Protect the core",
    targetVerb: "Dash",
    playerState: "menu",
  });
  const input = createInputController({
    target: options.inputTarget,
    gamepad: options.gamepad,
  });
  let paused = false;
  let disposed = false;
  const namedStates = new Map<string, () => { state: string }>();
  /** Set once the acceptance surfaces are installed, so snapshots stay live. */
  let publishDiagnostics: (() => void) | null = null;

  const present = (name: string): { state: string } => {
    const apply = namedStates.get(name);
    if (!apply) {
      throw new Error(
        `unknown capture state "${name}"; this game declares: ${[...namedStates.keys()].sort().join(", ")}`
      );
    }
    return apply();
  };

  const syncDiagnostics = (): void => {
    const threat = pickThreat(world.shards);
    diagnostics.update({
      runId: seed,
      loop: loop.steps,
      phase: world.phase,
      objective:
        world.phase === "game-over"
          ? "Press dash to run again"
          : world.phase === "menu"
            ? "Watch, or dash to take the wheel"
            : world.phase === "victory"
              ? "Gauntlet cleared — dash to run again"
              : threat
                ? "Break the shards"
                : "Hold the ring",
      targetVerb: "Dash",
      playerState: describePlayer(world),
      party: [],
      paused,
      accessibility: settings.value,
    });
    publishDiagnostics?.();
  };

  const buildCommands = (): Commands => {
    const human = input.readIntents();
    const humanActive = anyHumanActive(human);
    const start =
      (world.phase === "menu" || world.phase === "game-over") &&
      (human.dash || human.act);
    // With no human input the ghost always steers: that is what lets the idle
    // clock run and the takeover fire, and it keeps a watched run alive.
    const useGhost = !humanActive;
    return {
      intents: useGhost ? autopilot(world) : human,
      fromAutopilot: useGhost,
      start,
      humanActive,
    };
  };

  const runStep = (commands: Commands): readonly ArcadeEvent[] => {
    const events = step(world, TUNING.fixedStepMs / 1000, commands);
    syncDiagnostics();
    options.onStep?.(events, world);
    return events;
  };

  const advanceOne = (): void => {
    runStep(buildCommands());
  };

  const loop: FixedLoop = createFixedLoop({
    fixedStepMs: TUNING.fixedStepMs,
    maxStepsPerFrame: 5,
    update: () => advanceOne(),
    render: (alpha) =>
      options.onFrame?.({ alpha, paused, dtMs: TUNING.fixedStepMs }),
    schedule: options.schedule,
    cancel: options.cancel,
    now: options.now,
  });

  const update = (deltaMs: number): number => {
    if (disposed) return 0;
    if (paused) {
      options.onFrame?.({ alpha: 1, paused: true, dtMs: 0 });
      return 0;
    }
    return loop.advance(deltaMs);
  };

  const resetToMenu = (): { state: string } => {
    world = createWorld(seed, world.best, world.runNumber);
    syncDiagnostics();
    return { state: "menu" };
  };

  const startActivePlay = (): { state: string } => {
    world = createWorld(seed, world.best, world.runNumber);
    resetForRun(world, seed);
    const ghost = (): Commands => ({
      intents: autopilot(world),
      fromAutopilot: true,
      start: false,
      humanActive: false,
    });
    for (let index = 0; index < ACTIVE_PLAY_WARMUP_STEPS; index += 1)
      runStep(ghost());
    // A capture should never frame an empty arena: keep the real spawn clock
    // running until a shard is actually inbound.
    for (
      let index = 0;
      index < ACTIVE_PLAY_FILL_STEPS && world.shards.length === 0;
      index += 1
    ) {
      runStep(ghost());
    }
    world.idleTime = 0;
    world.ghostDriving = false;
    syncDiagnostics();
    return { state: "active-play" };
  };

  const presentGameOver = (): { state: string } => {
    world = createWorld(seed, world.best, world.runNumber);
    resetForRun(world, seed);
    world.score = 480;
    world.wave = 6;
    world.integrity = 0;
    runStep({
      intents: autopilot(world),
      fromAutopilot: true,
      start: false,
      humanActive: false,
    });
    syncDiagnostics();
    return { state: "game-over" };
  };

  const presentVictory = (): { state: string } => {
    world = createWorld(seed, world.best, world.runNumber);
    resetForRun(world, seed);
    world.wave = TUNING.gauntletWaves;
    world.shards = [];
    const ghost = (): Commands => ({
      intents: autopilot(world),
      fromAutopilot: true,
      start: false,
      humanActive: false,
    });
    // Reach the win honestly: let the ghost play out the final wave until the
    // field is empty at the wave clock. Bound the simulation so a capture can
    // never hang, whatever the seed.
    const clockCap =
      Math.ceil(TUNING.waveLengthSec / (TUNING.fixedStepMs / 1000)) + 60;
    const overrunCap = 2400;
    const stepUntilVictory = (steps: number): void => {
      for (let index = 0; index < steps && world.phase === "play"; index += 1)
        runStep(ghost());
    };
    stepUntilVictory(clockCap);
    stepUntilVictory(overrunCap);
    if (world.phase !== "victory") {
      throw new Error(
        `the ghost could not clear the final wave for seed ${JSON.stringify(seed)}`
      );
    }
    syncDiagnostics();
    return { state: "victory" };
  };

  namedStates.set("menu", resetToMenu);
  namedStates.set("active-play", startActivePlay);
  namedStates.set("game-over", presentGameOver);
  namedStates.set("victory", presentVictory);

  const setSeed = (value: string | number): string => {
    // A seed can only change between runs; starting one here keeps it honest.
    const next = normalizeSeed(value);
    world = createWorld(next, world.best, world.runNumber);
    diagnostics.update({ runId: next });
    syncDiagnostics();
    return next;
  };

  const installAcceptanceSurfaces = (target: ArcadeAcceptanceTarget): void => {
    const hooks: ArcadeTestHooks = {
      seed: setSeed,
      setState: (name) => present(name),
      setPausedForScreenshot: (value) => {
        paused = Boolean(value);
        syncDiagnostics();
        return paused;
      },
      setReducedMotion: (enabled) => {
        settings.set({ reducedMotion: Boolean(enabled) });
        syncDiagnostics();
        return settings.value.reducedMotion;
      },
      setDebugHidden: (hidden) => {
        settings.set({ debugHidden: Boolean(hidden) });
        syncDiagnostics();
        return settings.value.debugHidden;
      },
      hideDebugUi: (hidden) => {
        settings.set({ debugHidden: Boolean(hidden) });
        syncDiagnostics();
        return settings.value.debugHidden;
      },
    };
    target.__THREE_GAME_TEST_HOOKS__ = hooks;

    // Keep the diagnostics surface live without re-installing it per frame.
    publishDiagnostics = (): void => {
      target.__THREE_GAME_DIAGNOSTICS__ = diagnostics.snapshot();
    };
    syncDiagnostics();
  };

  syncDiagnostics();

  return {
    get world(): WorldState {
      return world;
    },
    get seed(): string {
      return seed;
    },
    settings,
    diagnostics,
    get paused(): boolean {
      return paused;
    },
    setPaused(value: boolean): boolean {
      paused = Boolean(value);
      syncDiagnostics();
      return paused;
    },
    update,
    reportRender(patch: DiagnosticsPatch): void {
      diagnostics.update(patch);
      publishDiagnostics?.();
    },
    installAcceptanceSurfaces,
    dispose(): void {
      disposed = true;
      input.dispose();
      loop.dispose();
    },
  };

  function describePlayer(state: WorldState): string {
    if (state.phase === "menu") return "menu";
    if (state.phase === "game-over") return "game-over";
    if (state.phase === "victory") return "victory";
    if (state.ghostDriving) return "ghost";
    if (state.player.stun > 0) return "knocked-back";
    if (state.player.dashTime > 0) return "dashing";
    return "manual";
  }
}
