import {
  resolveMiddleFloor,
  type MiddleFloorDefinition,
  type MiddleFloorLayout,
} from "./middle-types";

const definition: MiddleFloorDefinition = {
  floor: 4,
  overallFloor: 8,
  sceneId: "never-go-alone-floor-01",
  eraShaderId: "ansi-bbs-dos-art",
  title: "First Reflection",
  era: "8-bit-nintendo",
  bounds: { minX: -20, maxX: 20, minZ: -18, maxZ: 22 },
  spawn: { x: 0, z: 18 },
  exit: { x: 0, z: -15 },
  routes: [
    {
      id: "vault-spine",
      label: "Vault Spine",
      points: [
        { x: 0, z: 18 },
        { x: 0, z: 12 },
        { x: -4, z: 8 },
        { x: -4, z: 2 },
        { x: 0, z: -3 },
        { x: 0, z: -15 },
      ],
      width: 5,
      destinationLandmarkId: "vault-exit",
    },
    {
      id: "echo-niche",
      label: "Echo Niche",
      points: [
        { x: -4, z: 8 },
        { x: -11, z: 5 },
        { x: -11, z: 1 },
      ],
      width: 3.5,
      destinationLandmarkId: "echo-record",
    },
    {
      id: "offer-arc",
      label: "Three Imprints",
      points: [
        { x: 0, z: -3 },
        { x: 7, z: -5 },
        { x: 11, z: -10 },
      ],
      width: 3.5,
      destinationLandmarkId: "future-offers",
    },
  ],
  landmarks: [
    {
      id: "entry-mark",
      role: "orientation",
      position: { x: 0, z: 14 },
      reach: 2,
      visual: "large stepped floor chevron points down the vault spine",
    },
    {
      id: "echo-record",
      role: "discovery",
      position: { x: -11, z: 1 },
      reach: 2.4,
      visual: "three compact memory tiles; glyphs stay abstract at a distance",
    },
    {
      id: "future-offers",
      role: "offer",
      position: { x: 0, z: 18 },
      reach: 3.2,
      visual:
        "three distinct empty silhouettes with no roster or recruitment UI",
    },
    {
      id: "vault-exit",
      role: "exit",
      position: { x: 0, z: -15 },
      reach: 3,
      visual: "bright rectangular threshold framed by stable tile columns",
    },
  ],
  collision: [
    { kind: "rect", center: { x: -7.5, z: 14 }, width: 1.2, depth: 7 },
    { kind: "rect", center: { x: 7.5, z: 14 }, width: 1.2, depth: 7 },
    { kind: "rect", center: { x: -8, z: -4 }, width: 8, depth: 1.2 },
    { kind: "rect", center: { x: 9, z: 1 }, width: 1.2, depth: 8 },
    { kind: "rect", center: { x: 10, z: -12 }, width: 2, depth: 1.2 },
  ],
  encounter: {
    id: "vault-sentinel-encounter",
    required: true,
    checkpoint: { x: 0, z: 7 },
    arena: {
      center: { x: -4, z: 2 },
      width: 12,
      depth: 10,
      recoveryZones: [
        { center: { x: -9, z: 1 }, radius: 2.2 },
        { center: { x: 1, z: 4 }, radius: 2.2 },
      ],
    },
    enemies: [
      {
        id: "vault-sentinel",
        role: "charger",
        spawn: { x: -4, z: 1 },
        health: 3,
        attackRange: 2.1,
        windupMs: 1100,
        cooldownMs: 1500,
        damage: 1,
        telegraph:
          "faces the player, then a broad floor arrow marks its straight charge lane",
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
      id: "sentinel-charge-tell",
      trigger: "enemy-telegraph",
      enemyId: "vault-sentinel",
      encounterId: "vault-sentinel-encounter",
      visual: {
        treatment:
          "large block arrow lights across the charge lane with a two-beat edge pulse",
        durationMs: 1100,
        intensity: 0.28,
      },
      gameplay: {
        response:
          "keeps the charge lane visibly clear and gives the player the full windup to Hit or Run",
        durationMs: 1100,
      },
      audio: {
        source: "web-audio-synthesis",
        waveform: "square",
        frequencyHz: 330,
        durationMs: 300,
        rhythmMs: [0, 180],
        gain: 0.12,
      },
    },
    {
      id: "sentinel-outcome-mark",
      trigger: "encounter-resolved",
      encounterId: "vault-sentinel-encounter",
      visual: {
        treatment: "the encounter seal resolves to a steady exit-facing marker",
        durationMs: 900,
        intensity: 0.24,
      },
      gameplay: {
        response:
          "stores won or fallen as the encounter outcome and unlocks the exit in either case",
        durationMs: 900,
      },
      audio: {
        source: "web-audio-synthesis",
        waveform: "triangle",
        frequencyHz: 440,
        durationMs: 420,
        rhythmMs: [0, 120],
        gain: 0.12,
      },
    },
  ],
  variationOptions: [
    { surface: "large checker tiles", accent: "amber" },
    { surface: "offset dither tiles", accent: "mint" },
    { surface: "two-tone scan tiles", accent: "coral" },
  ],
};

export function createMiddleFloor4(seed: number): MiddleFloorLayout {
  return resolveMiddleFloor(definition, seed);
}
