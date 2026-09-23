/**
 * Spiral Breaker — fixed tuning values.
 *
 * One tuning table, named constants. Feel changes land here, not in the step.
 * Anything that varies per wave or per shard is a pure function of these.
 */

export const TUNING = {
  /** Simulation step. Matches the core contract's 60Hz fixed step. */
  fixedStepMs: 1000 / 60,

  arenaRadius: 1,
  /** A shard reaching this inner radius is a breach. */
  coreRadius: 0.16,
  /** Inside this ring, inbound shards slow — the late-save grace band. */
  slowZoneRadius: 0.28,
  slowZoneFactor: 0.55,
  /** Anything at or inside this distance from the player's center is a dash contact. */
  dashRadius: 0.11,
  /** Non-dash contact radius. Wider than dash so the sting is more generous than the kill. */
  hitRadius: 0.13,

  dashSpeed: 6.2,
  dashDurationSec: 0.17,
  /** One dash every ~0.4s: fast enough to catch a sister mini, slow enough to ration. */
  dashCooldownSec: 0.4,
  /** The ghost commits a dash once its target is inside this radius. */
  dashChargeFromRadius: 0.55,

  baseAccel: 46,
  friction: 12,
  maxPlayerSpeed: 3.4,
  spawnWaypointRadius: 0.5,

  shardBaseSpeed: 0.34,
  shardSpeedPerWave: 0.055,
  shardSpeedMax: 0.85,
  shardIntervalBaseSec: 2.1,
  shardIntervalPerWave: 0.13,
  shardIntervalMinSec: 0.55,
  maxShardsOnScreen: 10,
  waveLengthSec: 15,

  /** Wave at which wobbling "drifters" appear. */
  drifterStartWave: 3,
  drifterChanceBase: 0.2,
  drifterChancePerWave: 0.06,
  driftAmplitude: 0.06,
  driftFrequency: 2.4,

  /** Encounter kinds — one new decision per wave, then they mix. */
  splitterStartWave: 2,
  splitterChance: 0.15,
  splitMiniCount: 2,
  splitMiniOffset: 0.05,
  splitMiniAngleOffset: 0.28,
  splitMiniSpeedFactor: 1.5,
  splitMiniSpeedCapFactor: 1.3,
  /** Fresh minis are ignored by collision for a beat so a late crack cannot self-pop. */
  miniGraceSec: 0.26,
  miniPoints: 5,

  /** Hearts arrive with the splitters, so hurt cores get a tool in the same wave the minis start biting. */
  heartStartWave: 2,
  heartChanceBase: 0.08,
  heartChancePerWave: 0.02,
  /** A heart hit or arrival heals one pip; a full core instead pays this. */
  healBonusPoints: 25,

  shieldStartWave: 5,
  shieldChanceBase: 0.12,
  shieldChancePerWave: 0.02,
  /** A dash from inside this frontal cone (facing the core) bounces instead of breaking. */
  shieldHalfAngle: 0.62,
  shieldedPoints: 15,

  /** Pulsars emit a full 360° pulse ring on a rhythm; linger and it shoves you. */
  pulsarStartWave: 3,
  pulsarChanceBase: 0.07,
  pulsarChancePerWave: 0.01,
  /** One charging hazard on the field is plenty. */
  maxPulsarsOnScreen: 1,
  pulseCooldownSec: 1.5,
  /** Nothing inside this reach avoids the ring's shove when it fires. */
  pulseMaxRadius: 0.5,
  /** A hair gentler than a graze knockback, so a dodge is survivable. */
  pulseKnockbackStrength: 2.3,
  pulseStunSec: 0.16,
  /** After a bite, a beat of immunity so a nearby second ring cannot chain you. */
  pulseGraceSec: 0.22,

  /** Clear this many waves to win; the final wave needs an empty field at the clock. */
  gauntletWaves: 6,
  /** Integrity left on a cleared run banks this many points per pip. */
  integrityBonusPoints: 100,

  maxIntegrity: 3,
  chainWindowSec: 2.5,
  pointsPerShard: 10,
  chainPointsPerLevel: 5,

  knockbackImpulse: 2.4,
  stunSec: 0.35,
  invulnSec: 0.9,

  /** Seconds of no human input before the ghost takes the wheel. */
  ghostIdleTriggerSec: 4,
} as const;

export type Vec2 = { x: number; y: number };

export function vec(x: number, y: number): Vec2 {
  return { x, y };
}

export const distanceSq = (a: Vec2, b: Vec2): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return dx * dx + dy * dy;
};
