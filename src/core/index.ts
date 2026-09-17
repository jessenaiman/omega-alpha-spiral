/**
 * `src/core` — the host, one fixed-step loop, one seeded generator, input
 * intents, typed events, and the acceptance surfaces.
 *
 * Import from this module rather than reaching into its files, so the seam the
 * other Scene 1 tickets depend on stays one shape.
 */

export { createRng, normalizeSeed, type SeededRng } from './random';
export {
  createEventBus,
  emitAll,
  type EventBus,
  type SceneEvent,
  type SceneEventOf,
  type SceneEventHandler,
  type SceneEventType,
  type SceneSpeaker,
  type Unsubscribe,
} from './events';
export { createFixedLoop, DEFAULT_FIXED_STEP_MS, DEFAULT_MAX_STEPS_PER_FRAME, type FixedLoop, type FixedLoopOptions } from './loop';
export {
  createInputController,
  IDLE_INTENTS,
  type EventTargetLike,
  type GamepadLike,
  type InputController,
  type InputControllerOptions,
  type Intents,
} from './input';
export { createSettings, type SceneSettings, type SettingsStore } from './settings';
export {
  captureRuntimeErrors,
  createDiagnostics,
  createStateRegistry,
  type AcceptanceTarget,
  type Diagnostics,
  type DiagnosticsPatch,
  type DiagnosticsSnapshot,
  type SceneTestHooks,
  type StateRegistry,
} from './acceptance';
export { createSceneHost, type HostFrame, type SceneHost, type SceneHostOptions } from './host';
