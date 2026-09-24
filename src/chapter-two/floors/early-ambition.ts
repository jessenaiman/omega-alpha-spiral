import type { EarlyFloorLayout } from "./early-layout";
import { earlyFloorVariation, permuteEarlyFloorExits } from "./early-layout";

const VARIANT_OFFSETS = [
  { curve: 0, flank: 0 },
  { curve: 0.35, flank: -0.3 },
  { curve: -0.35, flank: 0.3 },
] as const;

/** Ambition's curves are visibly assembled from discrete raised code blocks. */
export function createFloor3AmbitionLayout(seed: number): EarlyFloorLayout {
  const variationIndex = earlyFloorVariation(seed, "floor-3-ambition");
  const offset = VARIANT_OFFSETS[variationIndex] ?? VARIANT_OFFSETS[0];
  const steps = (id: string, points: readonly [number, number][]) =>
    points.map(([x, z], index) => ({
      id: `${id}-${index + 1}`,
      center: {
        x: x + (index > 2 && index < 7 ? offset.curve : offset.flank),
        z,
      },
      width: 1.05,
      depth: 1.05,
      rotationRadians: ((index % 2) - 0.5) * 0.08,
      form: "code-step" as const,
    }));

  const layout: EarlyFloorLayout = {
    id: "floor-3-ambition",
    heroStart: { x: 0, z: 12 },
    bounds: { halfWidth: 14, halfDepth: 16 },
    exits: [
      { kind: "chest", position: { x: -10, z: -5 }, headingRadians: -0.55 },
      { kind: "door", position: { x: 1, z: -11 }, headingRadians: 0.05 },
      { kind: "monster", position: { x: 10, z: -3 }, headingRadians: 0.55 },
    ],
    routes: {
      chest: [
        { x: 0, z: 12 },
        { x: -11, z: 12 },
        { x: -11, z: 0 },
        { x: -10, z: -5 },
      ],
      door: [
        { x: 0, z: 12 },
        { x: -13, z: 12 },
        { x: -13, z: -11 },
        { x: 1, z: -11 },
      ],
      monster: [
        { x: 0, z: 12 },
        { x: 11, z: 12 },
        { x: 11, z: 0 },
        { x: 10, z: -3 },
      ],
    },
    collisionBlocks: [
      ...steps("ambition-west-curve", [
        [-1.6, 9],
        [-2.5, 8],
        [-3.4, 7],
        [-4.3, 6],
        [-5.2, 5],
        [-6.1, 4],
        [-6.8, 3],
      ]),
      ...steps("ambition-east-curve", [
        [1.6, 9],
        [2.5, 8],
        [3.4, 7],
        [4.3, 6],
        [5.2, 5],
        [6.1, 4],
        [6.8, 3],
      ]),
      ...steps("ambition-inner-step", [
        [0, 4],
        [0.8, 3],
        [1.6, 2],
        [2.2, 1],
        [2.4, 0],
      ]),
    ],
    effectCues: [
      {
        id: "ambition-step-trace",
        trigger: "floor-enter",
        target: "route",
        durationMs: 900,
        intensity: 0.4,
        motion:
          "trace the stepped curves in short, ordered NES-like pulses from entry toward the three exits",
        reducedMotion: "show the full route edges with a stable warm highlight",
      },
      {
        id: "ambition-exit-commit",
        trigger: "exit-crossed",
        target: "choice-exit",
        durationMs: 500,
        intensity: 0.5,
        motion:
          "snap nearby code steps into alignment, then pulse the chosen exit glyph once",
        reducedMotion: "hold a single bright outline on the chosen exit",
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

export const FLOOR_3_AMBITION_LAYOUT = createFloor3AmbitionLayout(0);
