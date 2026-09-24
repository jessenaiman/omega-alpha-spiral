import type { ObjectKind } from "../rooms";
import { createRng } from "../../core/random";

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
  readonly trigger:
    "floor-enter" | "route-near-exit" | "seam-warning" | "exit-crossed";
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
  /** Stable layout variant selected from the journey seed. */
  readonly variationIndex: number;
}

export function earlyFloorVariation(seed: number, floor: string): number {
  return createRng(seed).fork(`${floor}:layout`).int(3);
}

/** Keep each safe physical corridor attached to its slot while permuting object kinds. */
export function permuteEarlyFloorExits(
  exits: readonly EarlyFloorExit[],
  routes: Readonly<Record<ObjectKind, readonly FloorPoint[]>>,
  seed: number,
  floor: string
): { exits: EarlyFloorExit[]; routes: Record<ObjectKind, FloorPoint[]> } {
  const kinds: ObjectKind[] = ["door", "monster", "chest"];
  const slots = createRng(seed).fork(`${floor}:exit-slots`).shuffle(exits);
  const shuffledRoutes = { ...routes } as Record<ObjectKind, FloorPoint[]>;
  const shuffledExits = kinds.map((kind, index): EarlyFloorExit => {
    const slot = slots[index];
    const route = [...(routes[slot.kind] ?? [])];
    if (route.length > 0) {
      route[route.length - 1] = { ...slot.position };
      shuffledRoutes[kind] = route;
      // Route waypoints guide movement; replace only the old physical endpoint.
    }
    return { ...slot, kind };
  });
  return { exits: shuffledExits, routes: shuffledRoutes };
}
