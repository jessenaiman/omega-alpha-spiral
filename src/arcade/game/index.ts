/**
 * Spiral Breaker — the game module's public surface.
 *
 * Presentation imports from here and nowhere deeper: tuning constants, the
 * pure rules, and the autopilot. Keeping the surface this narrow is what lets
 * the rules stay testable and the visuals stay swappable.
 */

export { TUNING, vec, distanceSq } from './tuning';
export type { Vec2 } from './tuning';
export {
  createWorld,
  createPlayer,
  resetForRun,
  step,
  anyHumanActive,
  inShieldCone,
  IDLE_COMMANDS,
} from './rules';
export type {
  Phase,
  Shard,
  ShardKind,
  PlayerState,
  ArcadeEvent,
  Commands,
  WorldState,
} from './rules';
export { autopilot, pickTarget, pickThreat } from './autopilot';
