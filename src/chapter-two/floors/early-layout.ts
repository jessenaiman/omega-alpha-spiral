import type { ObjectKind } from "../rooms";

export type EarlyFloorId = "floor-2-shadow" | "floor-3-ambition";

export interface FloorPoint {
  readonly x: number;
  readonly z: number;
}

export interface EarlyFloorExit {
  /** The exit commits the alignment attached to this existing room object. */
  readonly kind: ObjectKind;
  readonly position: FloorPoint;
  readonly headingRadians: number;
}

export interface EarlyFloorCollisionBlock {
  readonly id: string;
  readonly center: FloorPoint;
  readonly width: number;
  readonly depth: number;
  /** Rotation in the XZ plane; visuals and collision use the same angle. */
  readonly rotationRadians: number;
  readonly form: "bar" | "code-step" | "pillar";
}

export interface EarlyFloorEffectCue {
  readonly id: string;
  readonly trigger: "floor-enter" | "route-near-exit" | "seam-warning" | "exit-crossed";
  readonly target: "route" | "code-join" | "choice-exit";
  readonly durationMs: number;
  readonly intensity: number;
  readonly motion: string;
  readonly reducedMotion: string;
}

export interface EarlyFloorLayout {
  readonly id: EarlyFloorId;
  readonly heroStart: FloorPoint;
  readonly bounds: { readonly halfWidth: number; readonly halfDepth: number };
  readonly exits: readonly EarlyFloorExit[];
  readonly routes: Readonly<Record<ObjectKind, readonly FloorPoint[]>>;
  readonly collisionBlocks: readonly EarlyFloorCollisionBlock[];
  readonly effectCues: readonly EarlyFloorEffectCue[];
  /** Stable small-layout variation. Exits and choice identities never move. */
  readonly variationIndex: number;
}

export function earlyFloorVariation(seed: number): number {
  const safeSeed = Number.isFinite(seed) ? Math.trunc(seed) : 0;
  let value = safeSeed | 0;
  value ^= value >>> 16;
  value = Math.imul(value, 0x7feb352d);
  value ^= value >>> 15;
  value = Math.imul(value, 0x846ca68b);
  value ^= value >>> 16;
  return (value >>> 0) % 3;
}
