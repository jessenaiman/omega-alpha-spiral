/** Shared data contract for the Floor 4–6 traversal modules. */
export type MiddleFloorNumber = 4 | 5 | 6;
export type FloorEra = "8-bit-nintendo" | "16-bit" | "early-3d";

export interface FloorPoint { x: number; z: number }
export type FloorCollisionShape =
  | { kind: "rect"; center: FloorPoint; width: number; depth: number }
  | { kind: "circle"; center: FloorPoint; radius: number };
export interface FloorLandmark {
  id: string;
  role: "orientation" | "discovery" | "offer" | "exit";
  position: FloorPoint;
  /** Suggested interaction radius in world units; this is not a collision. */
  reach: number;
  visual: string;
}
export interface FloorRoute {
  id: string;
  label: string;
  /** Ordered center-line points for a readable, traversable route. */
  points: readonly FloorPoint[];
  width: number;
  destinationLandmarkId: string;
}
export interface ProceduralAudioCue {
  source: "web-audio-synthesis";
  waveform: "square" | "triangle" | "sine" | "sawtooth";
  frequencyHz: number;
  durationMs: number;
  /** Short rhythm in milliseconds; runtime should schedule after a user gesture. */
  rhythmMs: readonly number[];
  gain: number;
}
export interface FloorEffectCue {
  id: string;
  trigger: "enter-zone" | "discover-landmark" | "reach-exit" | "enemy-telegraph" | "encounter-resolved";
  landmarkId?: string;
  enemyId?: string;
  encounterId?: string;
  visual: { treatment: string; durationMs: number; intensity: number };
  gameplay: { response: string; durationMs: number };
  audio: ProceduralAudioCue;
}
export interface EncounterEnemy {
  id: string;
  role: "charger" | "ranged" | "flanker";
  spawn: FloorPoint;
  health: number;
  attackRange: number;
  windupMs: number;
  cooldownMs: number;
  damage: number;
  telegraph: string;
}
export interface EncounterRecoveryZone { center: FloorPoint; radius: number }
export interface MiddleFloorEncounter {
  id: string;
  required: true;
  checkpoint: FloorPoint;
  arena: { center: FloorPoint; width: number; depth: number; recoveryZones: readonly EncounterRecoveryZone[] };
  enemies: readonly EncounterEnemy[];
  playerVerbs: readonly [
    { verb: "Hit"; effect: "damage-nearest-in-range-enemy" },
    { verb: "Run"; effect: "reposition-outside-threat-range" }
  ];
  resolution: {
    exitUnlocksOn: "encounter-resolution";
    winState: "won";
    fallenState: "fallen";
    outcomePersistence: "retain-as-echo-choice-state";
    bothStatesUnlockExit: true;
    recovery: "return-to-checkpoint-and-resume-progression";
  };
}
export interface MiddleFloorLayout {
  floor: MiddleFloorNumber;
  title: string;
  era: FloorEra;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  spawn: FloorPoint;
  exit: FloorPoint;
  routes: readonly FloorRoute[];
  landmarks: readonly FloorLandmark[];
  collision: readonly FloorCollisionShape[];
  encounter: MiddleFloorEncounter;
  effects: readonly [FloorEffectCue, FloorEffectCue];
  variation: { seed: number; index: number; surface: string; accent: string };
}
export interface MiddleFloorDefinition extends Omit<MiddleFloorLayout, "variation"> {
  variationOptions: readonly { surface: string; accent: string }[];
}

/** Stable unsigned hash; equal inputs always choose the same cosmetic variant. */
export function deterministicVariantIndex(seed: number, floor: MiddleFloorNumber, optionCount: number): number {
  if (!Number.isInteger(optionCount) || optionCount < 1) return 0;
  let hash = (seed >>> 0) ^ Math.imul(floor, 0x9e3779b1);
  hash ^= hash >>> 16;
  hash = Math.imul(hash, 0x7feb352d);
  hash ^= hash >>> 15;
  hash = Math.imul(hash, 0x846ca68b);
  hash ^= hash >>> 16;
  return (hash >>> 0) % optionCount;
}

export function resolveMiddleFloor(definition: MiddleFloorDefinition, seed: number): MiddleFloorLayout {
  const index = deterministicVariantIndex(seed, definition.floor, definition.variationOptions.length);
  const selected = definition.variationOptions[index] ?? { surface: "stable-grid", accent: "warm-white" };
  const { variationOptions: _options, ...layout } = definition;
  return { ...layout, variation: { seed: seed >>> 0, index, ...selected } };
}
