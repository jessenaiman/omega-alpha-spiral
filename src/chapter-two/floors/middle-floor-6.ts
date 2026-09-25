import {
  resolveMiddleFloor,
  type MiddleFloorDefinition,
  type MiddleFloorLayout,
} from "./middle-types";

const definition: MiddleFloorDefinition = {
  floor: 6,
  overallFloor: 10,
  sceneId: "never-go-alone-floor-03",
  eraShaderId: "xerox-star-bitmap-gui",
  era: "early-3d",
  bounds: { minX: -24, maxX: 24, minZ: -22, maxZ: 24 },
  spawn: { x: 0, z: 21 },
  exit: { x: 0, z: -19 },
  routes: [
    {
      id: "depth-passage",
      label: "Depth Passage",
      points: [
        { x: 0, z: 21 },
        { x: -5, z: 14 },
        { x: -5, z: 7 },
        { x: 4, z: 0 },
        { x: 4, z: -8 },
        { x: 0, z: -19 },
      ],
      width: 6,
      destinationLandmarkId: "depth-exit",
    },
    {
      id: "lookout-loop",
      label: "Lookout",
      points: [
        { x: -5, z: 14 },
        { x: -14, z: 10 },
        { x: -15, z: 4 },
        { x: -5, z: 7 },
      ],
      width: 4,
      destinationLandmarkId: "depth-lookout",
    },
    {
      id: "offer-terrace",
      label: "Unfinished Forms",
      points: [
        { x: 4, z: -8 },
        { x: 12, z: -12 },
        { x: 14, z: -17 },
      ],
      width: 4,
      destinationLandmarkId: "future-forms",
    },
  ],
  landmarks: [
    {
      id: "depth-entry",
      role: "orientation",
      position: { x: 0, z: 17 },
      reach: 2,
      visual: "large faceted floor arrow and repeating perspective ribs",
    },
    {
      id: "depth-lookout",
      role: "discovery",
      position: { x: -15, z: 4 },
      reach: 2.6,
      visual:
        "open rail frames a distant layered vista; no gameplay platform is implied",
    },
    {
      id: "future-forms",
      role: "offer",
      position: { x: 0, z: 21 },
      reach: 3.2,
      visual: "three low-poly silhouettes stand apart on a lit terrace",
    },
    {
      id: "depth-exit",
      role: "exit",
      position: { x: 0, z: -19 },
      reach: 3,
      visual: "grounded doorway in a faceted frame with a bright floor strip",
    },
  ],
  collision: [
    { kind: "rect", center: { x: -11, z: 17 }, width: 1.5, depth: 9 },
    { kind: "rect", center: { x: 10, z: 14 }, width: 1.5, depth: 10 },
    { kind: "rect", center: { x: -12, z: -2 }, width: 8, depth: 1.5 },
    { kind: "rect", center: { x: 12, z: -3 }, width: 8, depth: 1.5 },
    { kind: "rect", center: { x: -7, z: -12 }, width: 1.5, depth: 8 },
    { kind: "rect", center: { x: 7, z: -15 }, width: 1.5, depth: 7 },
  ],
  encounter: {
    id: "depth-passage-encounter",
    required: true,
    checkpoint: { x: -5, z: 9 },
    arena: {
      center: { x: 4, z: -2 },
      width: 17,
      depth: 16,
      recoveryZones: [
        { center: { x: -2, z: -5 }, radius: 2.6 },
        { center: { x: 10, z: 2 }, radius: 2.6 },
      ],
    },
    enemies: [
      {
        id: "depth-charger",
        role: "charger",
        spawn: { x: 4, z: -1 },
        health: 3,
        attackRange: 2.2,
        windupMs: 900,
        cooldownMs: 1300,
        damage: 1,
        telegraph:
          "a faceted floor strip traces its charge lane before it moves",
      },
      {
        id: "depth-slinger",
        role: "ranged",
        spawn: { x: 11, z: -6 },
        health: 2,
        attackRange: 7,
        windupMs: 1150,
        cooldownMs: 1800,
        damage: 1,
        telegraph:
          "a flat-shaded target tile rises in contrast before a slow pulse",
      },
    ],
    playerVerbs: [
      { verb: "Hit", effect: "damage-nearest-in-range-enemy" },
      { verb: "Run", effect: "reposition-outside-threat-range" },
    ],
    resolution: {
      exitUnlocksOn: "encounter-resolution",
      winState: "won",
      fallenState: "fallen",
      outcomePersistence: "retain-as-echo-choice-state",
      bothStatesUnlockExit: true,
      recovery: "return-to-checkpoint-and-resume-progression",
    },
  },
  effects: [
    {
      id: "depth-charger-lane",
      trigger: "enemy-telegraph",
      enemyId: "depth-charger",
      encounterId: "depth-passage-encounter",
      visual: {
        treatment:
          "a floor strip and the charger's forward silhouette mark the attack lane",
        durationMs: 900,
        intensity: 0.25,
      },
      gameplay: {
        response:
          "preserves the visible recovery zones and gives the player the full windup to respond",
        durationMs: 900,
      },
      audio: {
        source: "web-audio-synthesis",
        waveform: "sawtooth",
        frequencyHz: 196,
        durationMs: 380,
        rhythmMs: [0, 130],
        gain: 0.08,
      },
    },
    {
      id: "depth-outcome-threshold",
      trigger: "encounter-resolved",
      encounterId: "depth-passage-encounter",
      visual: {
        treatment:
          "faceted frame pieces settle into a square doorway; floor strip remains bright",
        durationMs: 1000,
        intensity: 0.3,
      },
      gameplay: {
        response:
          "stores won or fallen as the encounter outcome and unlocks the next-floor handoff",
        durationMs: 1000,
      },
      audio: {
        source: "web-audio-synthesis",
        waveform: "sine",
        frequencyHz: 261,
        durationMs: 650,
        rhythmMs: [0, 210, 420],
        gain: 0.1,
      },
    },
  ],
  variationOptions: [
    { surface: "faceted low-resolution texture blocks", accent: "ultraviolet" },
    { surface: "fog-banded flat-shaded polygons", accent: "teal" },
    { surface: "dithered polygon panels", accent: "copper" },
  ],
};

export function createMiddleFloor6(seed: number): MiddleFloorLayout {
  return resolveMiddleFloor(definition, seed);
}
