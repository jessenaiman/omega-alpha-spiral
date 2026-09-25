import {
  resolveMiddleFloor,
  type MiddleFloorDefinition,
  type MiddleFloorLayout,
} from "./middle-types";

const definition: MiddleFloorDefinition = {
  floor: 5,
  overallFloor: 9,
  sceneId: "never-go-alone-floor-02",
  eraShaderId: "ibm-pc-vga",
  era: "16-bit",
  bounds: { minX: -22, maxX: 22, minZ: -20, maxZ: 22 },
  spawn: { x: 0, z: 19 },
  exit: { x: 0, z: -17 },
  routes: [
    {
      id: "second-test-route",
      label: "Second Test",
      points: [
        { x: 0, z: 19 },
        { x: 0, z: 11 },
        { x: 6, z: 6 },
        { x: 6, z: 0 },
        { x: 0, z: -5 },
        { x: 0, z: -17 },
      ],
      width: 5.5,
      destinationLandmarkId: "second-test-exit",
    },
    {
      id: "second-reflection-branch",
      label: "Second Reflection",
      points: [
        { x: 6, z: 6 },
        { x: 13, z: 9 },
        { x: 14, z: 13 },
      ],
      width: 3.5,
      destinationLandmarkId: "second-reflection-mirror",
    },
    {
      id: "dreamweaver-answer-route",
      label: "Dreamweaver Answers",
      points: [
        { x: 0, z: 19 },
        { x: -3, z: 17 },
        { x: 0, z: 16 },
      ],
      width: 4,
      destinationLandmarkId: "dreamweaver-answers",
    },
  ],
  landmarks: [
    {
      id: "second-test-entry",
      role: "orientation",
      position: { x: 0, z: 15 },
      reach: 2,
      visual: "wide floor arrows point from the second reflection toward its test",
    },
    {
      id: "second-reflection-mirror",
      role: "discovery",
      position: { x: 14, z: 13 },
      reach: 2.5,
      visual: "the second reflection waits inside a distorted mirror",
    },
    {
      id: "dreamweaver-answers",
      role: "offer",
      position: { x: 0, z: 16 },
      reach: 3.2,
      visual:
        "three small moving emblems imply future companions without assigning them",
    },
    {
      id: "second-test-exit",
      role: "exit",
      position: { x: 0, z: -17 },
      reach: 3,
      visual: "deep blue portal with a bright floor approach",
    },
  ],
  collision: [
    { kind: "rect", center: { x: -9, z: 13 }, width: 1.4, depth: 9 },
    { kind: "rect", center: { x: 20.4, z: 10 }, width: 1, depth: 8 },
    { kind: "rect", center: { x: 14, z: 4 }, width: 8, depth: 1.4 },
    { kind: "rect", center: { x: -8, z: 0 }, width: 1.4, depth: 9 },
    { kind: "rect", center: { x: 8, z: -10 }, width: 1.4, depth: 8 },
    { kind: "rect", center: { x: 10, z: -14 }, width: 2, depth: 1.4 },
  ],
  encounter: {
    id: "second-test",
    required: true,
    checkpoint: { x: 0, z: 9 },
    arena: {
      center: { x: 6, z: 1 },
      width: 15,
      depth: 12,
      recoveryZones: [
        { center: { x: 0, z: 2 }, radius: 2.4 },
        { center: { x: 11, z: -3 }, radius: 2.4 },
      ],
    },
    enemies: [
      {
        id: "wolf-claw-hybrid",
        role: "charger",
        spawn: { x: 6, z: 0 },
        health: 3,
        attackRange: 2.1,
        windupMs: 950,
        cooldownMs: 1350,
        damage: 1,
        telegraph: "a bright horizontal band points down its short charge lane",
      },
      {
        id: "code-fragment",
        role: "ranged",
        spawn: { x: 12, z: 5 },
        health: 2,
        attackRange: 7,
        windupMs: 1250,
        cooldownMs: 1900,
        damage: 1,
        telegraph:
          "three color bars gather over the aimed floor tile before a slow pulse",
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
      id: "code-fragment-telegraph",
      trigger: "enemy-telegraph",
      enemyId: "code-fragment",
      encounterId: "second-test",
      visual: {
        treatment:
          "three bright bands gather on the targeted tile, leaving the approach route visible",
        durationMs: 1250,
        intensity: 0.25,
      },
      gameplay: {
        response:
          "marks the aimed tile for the full windup so Run can move the player clear",
        durationMs: 1250,
      },
      audio: {
        source: "web-audio-synthesis",
        waveform: "triangle",
        frequencyHz: 523,
        durationMs: 320,
        rhythmMs: [0, 110, 230],
        gain: 0.11,
      },
    },
    {
      id: "second-test-outcome",
      trigger: "encounter-resolved",
      encounterId: "second-test",
      visual: {
        treatment:
          "the second test settles into a steady marker toward the open exit",
        durationMs: 950,
        intensity: 0.26,
      },
      gameplay: {
        response:
          "stores won or fallen and unlocks the exit while retaining discovered landmarks",
        durationMs: 950,
      },
      audio: {
        source: "web-audio-synthesis",
        waveform: "sine",
        frequencyHz: 392,
        durationMs: 500,
        rhythmMs: [0, 170],
        gain: 0.1,
      },
    },
  ],
  variationOptions: [
    { surface: "layered 16-bit color bands", accent: "cobalt" },
    { surface: "dense 16-bit dither panels", accent: "lime" },
    { surface: "warm 16-bit mosaic bands", accent: "violet" },
  ],
};

export function createMiddleFloor5(seed: number): MiddleFloorLayout {
  return resolveMiddleFloor(definition, seed);
}
