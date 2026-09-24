/**
 * Floor 7: a classic town whose mismatched assets expose the simulation seams.
 * Declarative content only; scene integration owns movement, rendering, and state.
 */

export type LateFloorPoint = Readonly<{ x: number; z: number }>;
export type LateFloorBounds = Readonly<{
  x: number;
  z: number;
  width: number;
  depth: number;
}>;

export interface TownLandmark {
  readonly id: string;
  readonly kind:
    "plaza" | "dreamweaver" | "terminal" | "collector" | "memory" | "route";
  readonly position: LateFloorPoint;
  readonly label: string;
  readonly display: Readonly<{
    aspectRatio: number;
    pixelDensity: number;
    era: "8-bit" | "16-bit" | "32-bit" | "modern";
  }>;
}

export interface TownRoute {
  readonly id: "boulevard" | "alleys" | "core";
  readonly idea: "escort-together" | "slip-through" | "break-the-lock";
  readonly from: LateFloorPoint;
  readonly to: LateFloorPoint;
  readonly waypoints: readonly LateFloorPoint[];
  readonly width: number;
  readonly exitId: string;
}

export interface TownExit {
  readonly id: string;
  readonly routeId: TownRoute["id"];
  readonly position: LateFloorPoint;
  readonly bounds: LateFloorBounds;
  readonly destination: "floor-8-healing-core";
}

export interface TownEffect {
  readonly id: string;
  readonly trigger:
    "periodic" | "enter-zone" | "collector-nearby" | "memory-reclaimed";
  readonly targetId: string;
  readonly cue:
    "asset-drift" | "memory-recycle" | "terminal-restart" | "collector-sweep";
  readonly durationSeconds: number;
  readonly intensity: "subtle" | "readable";
  readonly preservesRouteReadability: true;
}

export interface TownStructure {
  readonly id: string;
  readonly form:
    | "sprite-flat-facade"
    | "curved-plaster"
    | "timber-gable"
    | "market-tent"
    | "organic-root-house"
    | "low-poly-console"
    | "hanging-sign";
  readonly position: LateFloorPoint;
  readonly footprint: Readonly<{ width: number; depth: number }>;
  readonly height: number;
  readonly display: Readonly<{
    aspectRatio: number;
    pixelDensity: number;
    scaleX: number;
    scaleY: number;
    era: "8-bit" | "16-bit" | "32-bit" | "modern";
  }>;
  readonly surface:
    | "painted-card"
    | "lime-plaster"
    | "weathered-wood"
    | "woven-canvas"
    | "bark-and-vine"
    | "faceted-low-poly"
    | "pixel-art";
  readonly collisionId?: string;
}

export interface TownEncounter {
  readonly id: string;
  readonly kind: "npc" | "collector";
  readonly role: string;
  readonly position: LateFloorPoint;
  readonly behavior: string;
  readonly tell: string;
  readonly collision: LateFloorBounds;
  readonly routeIds: readonly TownRoute["id"][];
}

export const FLOOR_7_TOWN = {
  id: "floor-7-town",
  era: "classic-town",
  bounds: { x: 0, z: 0, width: 52, depth: 44 } satisfies LateFloorBounds,
  start: { x: 0, z: 17 } satisfies LateFloorPoint,
  playerCollision: { shape: "circle", radius: 0.45 },
  landmarks: [
    {
      id: "town-plaza",
      kind: "plaza",
      position: { x: 0, z: 1 },
      label: "Town plaza",
      display: { aspectRatio: 1.2, pixelDensity: 1, era: "16-bit" },
    },
    {
      id: "dw-light",
      kind: "dreamweaver",
      position: { x: -16, z: -5 },
      label: "Dreamweaver gathering point: Light",
      display: { aspectRatio: 0.75, pixelDensity: 1.5, era: "8-bit" },
    },
    {
      id: "dw-shadow",
      kind: "dreamweaver",
      position: { x: 15, z: -6 },
      label: "Dreamweaver gathering point: Shadow",
      display: { aspectRatio: 1.8, pixelDensity: 0.8, era: "32-bit" },
    },
    {
      id: "dw-ambition",
      kind: "dreamweaver",
      position: { x: 0, z: -15 },
      label: "Dreamweaver gathering point: Ambition",
      display: { aspectRatio: 1, pixelDensity: 2, era: "modern" },
    },
    {
      id: "local-terminal",
      kind: "terminal",
      position: { x: -21, z: 12 },
      label: "Local town restart terminal",
      display: { aspectRatio: 1.6, pixelDensity: 1, era: "8-bit" },
    },
    {
      id: "memory-well",
      kind: "memory",
      position: { x: 20, z: 11 },
      label: "Recycling memory well",
      display: { aspectRatio: 0.8, pixelDensity: 1.25, era: "16-bit" },
    },
    {
      id: "collector-entry",
      kind: "collector",
      position: { x: -3, z: 20 },
      label: "First garbage collector approach",
      display: { aspectRatio: 1.7, pixelDensity: 0.75, era: "modern" },
    },
    {
      id: "collector-crossing",
      kind: "collector",
      position: { x: 18, z: 1 },
      label: "Memory collector crossing",
      display: { aspectRatio: 0.7, pixelDensity: 1.8, era: "32-bit" },
    },
    {
      id: "exit-boulevard",
      kind: "route",
      position: { x: -17, z: -20 },
      label: "Boulevard exit",
      display: { aspectRatio: 2, pixelDensity: 1.5, era: "32-bit" },
    },
    {
      id: "exit-alleys",
      kind: "route",
      position: { x: 0, z: -21 },
      label: "Alleys exit",
      display: { aspectRatio: 0.65, pixelDensity: 0.8, era: "8-bit" },
    },
    {
      id: "exit-core",
      kind: "route",
      position: { x: 17, z: -20 },
      label: "Core exit",
      display: { aspectRatio: 1.35, pixelDensity: 2, era: "modern" },
    },
  ] satisfies readonly TownLandmark[],
  structures: [
    {
      id: "inn-facade",
      form: "sprite-flat-facade",
      position: { x: -21, z: -2 },
      footprint: { width: 0.8, depth: 0.16 },
      height: 8,
      display: {
        aspectRatio: 0.58,
        pixelDensity: 1,
        scaleX: 1.35,
        scaleY: 1,
        era: "8-bit",
      },
      surface: "painted-card",
      collisionId: "inn-facade",
    },
    {
      id: "merchant-plaster-roundhouse",
      form: "curved-plaster",
      position: { x: 21, z: -5 },
      footprint: { width: 5, depth: 4 },
      height: 5,
      display: {
        aspectRatio: 1.25,
        pixelDensity: 1.6,
        scaleX: 0.8,
        scaleY: 1.25,
        era: "16-bit",
      },
      surface: "lime-plaster",
      collisionId: "merchant-roundhouse",
    },
    {
      id: "west-timber-cottage",
      form: "timber-gable",
      position: { x: -20, z: 7 },
      footprint: { width: 4, depth: 3 },
      height: 4.5,
      display: {
        aspectRatio: 1.8,
        pixelDensity: 0.85,
        scaleX: 1,
        scaleY: 0.7,
        era: "32-bit",
      },
      surface: "weathered-wood",
      collisionId: "west-cottage",
    },
    {
      id: "plaza-market-tent",
      form: "market-tent",
      position: { x: 10, z: 7 },
      footprint: { width: 5, depth: 4 },
      height: 3.3,
      display: {
        aspectRatio: 1.1,
        pixelDensity: 1.1,
        scaleX: 1.25,
        scaleY: 0.8,
        era: "modern",
      },
      surface: "woven-canvas",
      collisionId: "market-tent",
    },
    {
      id: "root-house",
      form: "organic-root-house",
      position: { x: -19, z: -12 },
      footprint: { width: 5, depth: 4 },
      height: 6.5,
      display: {
        aspectRatio: 0.9,
        pixelDensity: 1.9,
        scaleX: 0.85,
        scaleY: 1.4,
        era: "16-bit",
      },
      surface: "bark-and-vine",
      collisionId: "root-house",
    },
    {
      id: "ps1-archive",
      form: "low-poly-console",
      position: { x: 23, z: -3 },
      footprint: { width: 6, depth: 3 },
      height: 7,
      display: {
        aspectRatio: 1.9,
        pixelDensity: 0.65,
        scaleX: 1.4,
        scaleY: 1,
        era: "32-bit",
      },
      surface: "faceted-low-poly",
      collisionId: "ps1-archive",
    },
    {
      id: "floating-sign",
      form: "hanging-sign",
      position: { x: 5, z: -3 },
      footprint: { width: 1.5, depth: 0.5 },
      height: 5.5,
      display: {
        aspectRatio: 2.4,
        pixelDensity: 1.3,
        scaleX: 0.7,
        scaleY: 1.3,
        era: "8-bit",
      },
      surface: "pixel-art",
    },
  ] satisfies readonly TownStructure[],
  encounters: [
    {
      id: "looping-villager",
      kind: "npc",
      role: "looping-townsperson",
      position: { x: -11, z: 7 },
      behavior: "walks a short square loop, then snaps back one step",
      tell: "footprints briefly continue beyond the loop",
      collision: { x: -11, z: 7, width: 0.9, depth: 0.9 },
      routeIds: ["boulevard", "alleys"],
    },
    {
      id: "duplicate-wanderer",
      kind: "npc",
      role: "duplicated-wanderer",
      position: { x: 11, z: -10 },
      behavior:
        "same silhouette appears at either end of a short alley on approach",
      tell: "one faint afterimage remains at the previous spot",
      collision: { x: 11, z: -10, width: 0.9, depth: 0.9 },
      routeIds: ["alleys", "core"],
    },
    {
      id: "collector-sweeper",
      kind: "collector",
      role: "sweeper",
      position: { x: -3, z: 15 },
      behavior: "crosses the open approach and reclaims loose memory props",
      tell: "flat amber scan fan paints the floor before it moves",
      collision: { x: -3, z: 15, width: 2.4, depth: 1.2 },
      routeIds: ["boulevard", "alleys"],
    },
    {
      id: "collector-skimmer",
      kind: "collector",
      role: "memory-skimmer",
      position: { x: 17, z: 2 },
      behavior: "glides along the outer edge of the memory well",
      tell: "thin cyan ground ring advances ahead of its body",
      collision: { x: 17, z: 2, width: 1.4, depth: 2.2 },
      routeIds: ["alleys", "core"],
    },
  ] satisfies readonly TownEncounter[],
  routes: [
    {
      id: "boulevard",
      idea: "escort-together",
      from: { x: 0, z: 5 },
      to: { x: -17, z: -20 },
      waypoints: [
        { x: -8, z: -6 },
        { x: -14, z: -13 },
      ],
      width: 5,
      exitId: "town-exit-boulevard",
    },
    {
      id: "alleys",
      idea: "slip-through",
      from: { x: 0, z: 5 },
      to: { x: 0, z: -21 },
      waypoints: [
        { x: 6, z: -5 },
        { x: -5, z: -11 },
        { x: 1, z: -16 },
      ],
      width: 3,
      exitId: "town-exit-alleys",
    },
    {
      id: "core",
      idea: "break-the-lock",
      from: { x: 0, z: 5 },
      to: { x: 17, z: -20 },
      waypoints: [
        { x: 8, z: -6 },
        { x: 14, z: -13 },
      ],
      width: 4,
      exitId: "town-exit-core",
    },
  ] satisfies readonly TownRoute[],
  exits: [
    {
      id: "town-exit-boulevard",
      routeId: "boulevard",
      position: { x: -17, z: -20 },
      bounds: { x: -17, z: -20, width: 5, depth: 3 },
      destination: "floor-8-healing-core",
    },
    {
      id: "town-exit-alleys",
      routeId: "alleys",
      position: { x: 0, z: -21 },
      bounds: { x: 0, z: -21, width: 3, depth: 3 },
      destination: "floor-8-healing-core",
    },
    {
      id: "town-exit-core",
      routeId: "core",
      position: { x: 17, z: -20 },
      bounds: { x: 17, z: -20, width: 4, depth: 3 },
      destination: "floor-8-healing-core",
    },
  ] satisfies readonly TownExit[],
  collision: [
    { id: "plaza-fountain", x: 0, z: 1, width: 2.5, depth: 2.5 },
    { id: "inn-facade", x: -21, z: -2, width: 0.8, depth: 0.16 },
    { id: "merchant-roundhouse", x: 21, z: -5, width: 5, depth: 4 },
    { id: "west-cottage", x: -20, z: 7, width: 4, depth: 3 },
    { id: "market-tent", x: 10, z: 7, width: 5, depth: 4 },
    { id: "root-house", x: -19, z: -12, width: 5, depth: 4 },
    { id: "ps1-archive", x: 23, z: -3, width: 6, depth: 3 },
    { id: "memory-well", x: 20, z: 11, width: 3, depth: 3 },
    { id: "terminal", x: -21, z: 12, width: 2, depth: 2 },
  ] satisfies readonly (LateFloorBounds & { id: string })[],
  party: {
    memberCount: 4,
    gatherDreamweavers: ["Light", "Shadow", "Ambition"] as const,
    becomesAvailableAt: "town-plaza",
  },
  routeChoice: {
    requiresAllDreamweavers: true,
    choices: ["boulevard", "alleys", "core"] as const,
  },
  garbageCollectors: {
    count: 2,
    patrols: [
      { from: { x: -4, z: 15 }, to: { x: -15, z: 4 } },
      { from: { x: 4, z: 15 }, to: { x: 15, z: 4 } },
    ],
    role: "pressure-and-memory-cleanup",
    contactCue: "visible sweep arc; collision remains separate from decoration",
  },
  effects: [
    {
      id: "town-asset-drift",
      trigger: "periodic",
      targetId: "town-plaza",
      cue: "asset-drift",
      durationSeconds: 0.7,
      intensity: "subtle",
      preservesRouteReadability: true,
    },
    {
      id: "memory-reclaimed",
      trigger: "memory-reclaimed",
      targetId: "memory-well",
      cue: "memory-recycle",
      durationSeconds: 1.1,
      intensity: "readable",
      preservesRouteReadability: true,
    },
    {
      id: "local-restart",
      trigger: "enter-zone",
      targetId: "local-terminal",
      cue: "terminal-restart",
      durationSeconds: 0.9,
      intensity: "readable",
      preservesRouteReadability: true,
    },
    {
      id: "collector-sweep",
      trigger: "collector-nearby",
      targetId: "collector-entry",
      cue: "collector-sweep",
      durationSeconds: 0.8,
      intensity: "readable",
      preservesRouteReadability: true,
    },
  ] satisfies readonly TownEffect[],
  subtext: [
    "Town regulars and object placements suggest other parties without stating what they are.",
    "A memory can vanish, appear as terminal-like output, and rebuild locally; this visual restart does not reset floor progress.",
    "Dreamweaver private motives and player-facing lines belong to the dialogue studio; this module contains no dialogue.",
  ] as const,
} as const;

export type Floor7Town = typeof FLOOR_7_TOWN;
