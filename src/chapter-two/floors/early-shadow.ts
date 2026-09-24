import type { EarlyFloorLayout } from "./early-layout";
import { earlyFloorVariation, permuteEarlyFloorExits } from "./early-layout";

const VARIANT_OFFSETS = [
  { west: 0, east: 0 },
  { west: -0.45, east: 0.35 },
  { west: 0.35, east: -0.45 },
] as const;

/** Shadow keeps Floor One's kit and breaks its straight approach into oblique reads. */
export function createFloor2ShadowLayout(seed: number): EarlyFloorLayout {
  const variationIndex = earlyFloorVariation(seed, "floor-2-shadow");
  const offset = VARIANT_OFFSETS[variationIndex] ?? VARIANT_OFFSETS[0];
  const layout: EarlyFloorLayout = {
    id: "floor-2-shadow",
    heroStart: { x: 0, z: 12 },
    bounds: { halfWidth: 14, halfDepth: 16 },
    exits: [
      { kind: "chest", position: { x: -9, z: -4 }, headingRadians: -0.5 },
      { kind: "door", position: { x: 0, z: -10 }, headingRadians: 0 },
      { kind: "monster", position: { x: 9, z: -4 }, headingRadians: 0.5 },
    ],
    routes: {
      chest: [
        { x: 0, z: 12 },
        { x: -10, z: 12 },
        { x: -10, z: 0 },
        { x: -9, z: -4 },
      ],
      door: [
        { x: 0, z: 12 },
        { x: -12, z: 12 },
        { x: -12, z: -10 },
        { x: 0, z: -10 },
      ],
      monster: [
        { x: 0, z: 12 },
        { x: 10, z: 12 },
        { x: 10, z: 0 },
        { x: 9, z: -4 },
      ],
    },
    collisionBlocks: [
      {
        id: "shadow-west-rake",
        center: { x: -4 + offset.west, z: 5 },
        width: 0.7,
        depth: 8,
        rotationRadians: 0.55,
        form: "bar",
      },
      {
        id: "shadow-east-rake",
        center: { x: 4 + offset.east, z: 4 },
        width: 0.7,
        depth: 8,
        rotationRadians: -0.55,
        form: "bar",
      },
      {
        id: "shadow-shortcut-seam",
        center: { x: 0, z: 0.5 },
        width: 5,
        depth: 0.65,
        rotationRadians: 0.08,
        form: "bar",
      },
      {
        id: "shadow-guardian-cover",
        center: { x: 5.5, z: -0.5 },
        width: 0.65,
        depth: 3.5,
        rotationRadians: -0.42,
        form: "pillar",
      },
    ],
    effectCues: [
      {
        id: "shadow-syntax-ash",
        trigger: "route-near-exit",
        target: "code-join",
        durationMs: 700,
        intensity: 0.35,
        motion: "shed sparse amber square fragments from repaired bar joins",
        reducedMotion: "brief amber edge highlight at the join",
      },
      {
        id: "shadow-route-splice",
        trigger: "seam-warning",
        target: "route",
        durationMs: 250,
        intensity: 0.55,
        motion:
          "telegraph the shifting diagonal shortcut seam with a short amber burst",
        reducedMotion: "steady amber band and wider visible bypass gap",
      },
    ],
    variationIndex,
  };
  const permuted = permuteEarlyFloorExits(
    layout.exits,
    layout.routes,
    seed,
    layout.id
  );
  return { ...layout, ...permuted };
}

export const FLOOR_2_SHADOW_LAYOUT = createFloor2ShadowLayout(0);
