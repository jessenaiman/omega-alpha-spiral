/**
 * `src/game` — the pure rules. No DOM, no Three.js, no browser.
 *
 * Affinity, the turn sequence, the ladder, and the run state. Everything here is
 * driven by one action at a time and can be tested without a scene.
 */

export {
  DREAMWEAVER_ORDER,
  emptyAffinity,
  leader,
  scoreChoice,
  type Affinity,
  type Dreamweaver,
} from './affinity';
export {
  advanceLadderStep,
  rungFor,
  rungIndexOf,
  RUNG_ORDER,
  TOP_RUNG_INDEX,
  type Rung,
} from './ladder';
export { nextSpeaker } from './sequence';
export {
  beginRun,
  reduceRun,
  type RunAction,
  type RunConfig,
  type RunState,
  type RunTransition,
  type ScenePhase,
} from './run-state';
