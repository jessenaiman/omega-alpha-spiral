/** Floor 8: a short, readable walk into the healing core as the eras converge. */

import type { LateFloorBounds, LateFloorPoint } from "./late-floor-7-town";

export interface FinaleLandmark {
  readonly id: string;
  readonly kind: "threshold" | "core" | "memory" | "exit";
  readonly position: LateFloorPoint;
  readonly label: string;
  readonly eraLayers: readonly ("8-bit" | "16-bit" | "32-bit" | "modern")[];
}

export interface FinaleEffect {
  readonly id: string;
  readonly trigger: "enter-zone" | "near-core" | "core-stabilizes";
  readonly targetId: string;
  readonly cue:
    "layer-convergence" | "memory-echo" | "healing-pulse" | "light-bridge";
  readonly durationSeconds: number;
  readonly intensity: "subtle" | "readable";
  readonly preservesRouteReadability: true;
}

export interface FinaleStructure {
  readonly id: string;
  readonly form:
    "suspended-ribbon" | "prismatic-vault" | "open-halo" | "lightwell-ring";
  readonly position: LateFloorPoint;
  readonly scale: Readonly<{ x: number; y: number; z: number }>;
  readonly material:
    | "translucent-ceramic"
    | "refractive-glass"
    | "soft-emissive-membrane"
    | "brushed-alloy";
  readonly legacyDetail:
    "embedded-pixel-mosaic" | "faceted-linework" | "stepped-curve" | "none";
}

export const FLOOR_8_FINALE = {
  id: "floor-8-healing-core",
  era: "modern-with-visible-legacy-layers",
  bounds: { x: 0, z: 0, width: 32, depth: 48 } satisfies LateFloorBounds,
  start: { x: 0, z: 20 } satisfies LateFloorPoint,
  playerCollision: { shape: "circle", radius: 0.45 },
  route: {
    id: "core-walk",
    from: { x: 0, z: 20 },
    to: { x: 0, z: -19 },
    waypoints: [
      { x: 0, z: 10 },
      { x: 0, z: 0 },
      { x: 0, z: -10 },
    ],
    width: 7,
    movementChallenge: "unhurried-forward-traverse",
  },
  landmarks: [
    {
      id: "final-threshold",
      kind: "threshold",
      position: { x: 0, z: 18 },
      label: "Town threshold",
      eraLayers: ["8-bit", "16-bit", "32-bit", "modern"],
    },
    {
      id: "memory-echoes",
      kind: "memory",
      position: { x: -8, z: 3 },
      label: "Recycled town memories",
      eraLayers: ["8-bit", "16-bit", "32-bit"],
    },
    {
      id: "healing-core",
      kind: "core",
      position: { x: 0, z: -15 },
      label: "Healing core",
      eraLayers: ["8-bit", "16-bit", "32-bit", "modern"],
    },
    {
      id: "final-exit",
      kind: "exit",
      position: { x: 0, z: -21 },
      label: "Finale boundary",
      eraLayers: ["modern"],
    },
  ] satisfies readonly FinaleLandmark[],
  structures: [
    {
      id: "modern-vault-west",
      form: "prismatic-vault",
      position: { x: -12, z: -2 },
      scale: { x: 2.4, y: 7, z: 8 },
      material: "refractive-glass",
      legacyDetail: "faceted-linework",
    },
    {
      id: "modern-vault-east",
      form: "open-halo",
      position: { x: 12, z: -2 },
      scale: { x: 2.4, y: 9, z: 5 },
      material: "translucent-ceramic",
      legacyDetail: "stepped-curve",
    },
    {
      id: "core-lightwell",
      form: "lightwell-ring",
      position: { x: 0, z: -15 },
      scale: { x: 7, y: 3, z: 7 },
      material: "soft-emissive-membrane",
      legacyDetail: "embedded-pixel-mosaic",
    },
    {
      id: "approach-ribbon",
      form: "suspended-ribbon",
      position: { x: 0, z: 5 },
      scale: { x: 12, y: 0.25, z: 1 },
      material: "brushed-alloy",
      legacyDetail: "none",
    },
  ] satisfies readonly FinaleStructure[],
  exits: [
    {
      id: "finale-boundary",
      position: { x: 0, z: -21 },
      bounds: { x: 0, z: -21, width: 7, depth: 3 },
      destination: "chapter-boundary",
    },
  ],
  collision: [
    { id: "west-legacy-rail", x: -11, z: 1, width: 1.5, depth: 34 },
    { id: "east-legacy-rail", x: 11, z: 1, width: 1.5, depth: 34 },
    { id: "memory-bank-west", x: -8, z: 3, width: 2.5, depth: 5 },
    { id: "memory-bank-east", x: 8, z: 3, width: 2.5, depth: 5 },
    { id: "modern-vault-west", x: -12, z: -2, width: 5, depth: 2 },
    { id: "modern-vault-east", x: 12, z: -2, width: 4, depth: 1 },
  ] satisfies readonly (LateFloorBounds & { id: string })[],
  effects: [
    {
      id: "era-layers-meet",
      trigger: "enter-zone",
      targetId: "final-threshold",
      cue: "layer-convergence",
      durationSeconds: 1.8,
      intensity: "readable",
      preservesRouteReadability: true,
    },
    {
      id: "town-memory-echo",
      trigger: "enter-zone",
      targetId: "memory-echoes",
      cue: "memory-echo",
      durationSeconds: 1.2,
      intensity: "subtle",
      preservesRouteReadability: true,
    },
    {
      id: "core-healing-pulse",
      trigger: "near-core",
      targetId: "healing-core",
      cue: "healing-pulse",
      durationSeconds: 2.2,
      intensity: "readable",
      preservesRouteReadability: true,
    },
    {
      id: "core-path-light",
      trigger: "core-stabilizes",
      targetId: "final-exit",
      cue: "light-bridge",
      durationSeconds: 1.4,
      intensity: "subtle",
      preservesRouteReadability: true,
    },
  ] satisfies readonly FinaleEffect[],
  subtext: [
    "Light, Shadow, and Ambition geometry coexist inside one modern illuminated space.",
    "The core can feel restorative while retaining a trace of the town's fragile memory; no explanatory dialogue is authored here.",
  ] as const,
} as const;

export type Floor8Finale = typeof FLOOR_8_FINALE;
