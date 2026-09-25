import { createFloor2ShadowLayout } from "./floors/early-shadow";
import { createFloor3AmbitionLayout } from "./floors/early-ambition";
import type { EarlyFloorLayout, FloorPoint } from "./floors/early-layout";
import { createRng } from "../core/random";
import { CHAPTER_ZERO_LEVELS_BY_ID } from "../dialogue/chapter-zero-vite";

export type ObjectKind = "door" | "monster" | "chest";
export type Guide = "Light" | "Shadow" | "Ambition";
export interface RoomObject {
  kind: ObjectKind;
  x: number;
  z: number;
  alignment: Guide;
  text: string;
}
export interface RoomBlock {
  id?: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  rotationRadians?: number;
}
export interface EchoRoom {
  levelId: string;
  eraShaderId?: string;
  owner: Guide;
  objects: RoomObject[];
  blocks?: RoomBlock[];
  heroStart?: FloorPoint;
  layout?: EarlyFloorLayout;
  routes?: Readonly<Record<ObjectKind, readonly FloorPoint[]>>;
}

function guideFromOwner(owner: string): Guide {
  if (owner === "light") return "Light";
  if (owner === "shadow") return "Shadow";
  if (owner === "ambition") return "Ambition";
  throw new Error(`Unknown Dreamweaver owner: ${owner}`);
}

function applyAuthoredDialogue(room: EchoRoom): EchoRoom {
  const level = CHAPTER_ZERO_LEVELS_BY_ID.get(room.levelId);
  if (!level) throw new Error(`Missing authored OML scene: ${room.levelId}`);
  const choices = new Map(level.choices.map((choice) => [choice.id, choice]));
  return {
    ...room,
    eraShaderId: level.scene.era_shader,
    objects: room.objects.map((object) => {
      const choice = choices.get(object.kind);
      if (!choice)
        throw new Error(`${room.levelId} has no ${object.kind} choice.`);
      return {
        ...object,
        alignment: guideFromOwner(choice.owner),
        text: choice.text,
      };
    }),
  };
}

// Authored copy of stage_2/nethack-scene.md:119-237, interpreted as data, NOT
// executed pseudocode. Colors, code architecture and movement are our graybox.
const LIGHT_ROOM: EchoRoom = {
  levelId: "nethack-floor-01",
  owner: "Light",
  heroStart: { x: 0, z: 12 },
  blocks: [
    { id: "light-west-bar", x: -4, z: 5, width: 0.8, depth: 9 },
    { id: "light-east-bar", x: 4, z: 5, width: 0.8, depth: 9 },
  ],
  objects: [
    {
      kind: "door",
      x: -8,
      z: 0,
      alignment: "Light",
      text: "What is the first story you ever loved?",
    },
    {
      kind: "monster",
      x: 0,
      z: 0,
      alignment: "Ambition",
      text: "A spectral wolf appears! It lunges...",
    },
    {
      kind: "chest",
      x: 8,
      z: 0,
      alignment: "Shadow",
      text: "You open the chest. Inside: a broken compass.",
    },
  ],
};

const SHADOW_ROOM: EchoRoom = {
  levelId: "nethack-floor-02",
  owner: "Shadow",
  objects: [
    {
      kind: "door",
      x: -8,
      z: 0,
      alignment: "Shadow",
      text: "Is chaos kinder than order?",
    },
    {
      kind: "monster",
      x: 0,
      z: 0,
      alignment: "Light",
      text: "A guardian of light blocks your path!",
    },
    {
      kind: "chest",
      x: 8,
      z: 0,
      alignment: "Ambition",
      text: "The chest giggles. It’s empty... or is it?",
    },
  ],
};

const AMBITION_ROOM: EchoRoom = {
  levelId: "nethack-floor-03",
  owner: "Ambition",
  objects: [
    {
      kind: "door",
      x: -8,
      z: 0,
      alignment: "Ambition",
      text: "Would you burn the world to save one soul?",
    },
    {
      kind: "monster",
      x: 0,
      z: 0,
      alignment: "Shadow",
      text: "A trickster imp cackles and attacks!",
    },
    {
      kind: "chest",
      x: 8,
      z: 0,
      alignment: "Light",
      text: "Inside: a shard glowing with ancient hope.",
    },
  ],
};

function placeRoom(room: EchoRoom, layout: EarlyFloorLayout): EchoRoom {
  const exitByKind = new Map(
    layout.exits.map((exit) => [exit.kind, exit] as const)
  );
  return {
    ...room,
    heroStart: layout.heroStart,
    layout,
    objects: room.objects.map((object) => {
      const exit = exitByKind.get(object.kind);
      return exit
        ? { ...object, x: exit.position.x, z: exit.position.z }
        : { ...object };
    }),
    blocks: layout.collisionBlocks.map((block) => ({
      id: block.id,
      x: block.center.x,
      z: block.center.z,
      width: block.width,
      depth: block.depth,
      rotationRadians: block.rotationRadians,
    })),
  };
}

/** Seeded room set with stable identities and randomized physical exit slots. */
export function createEchoRooms(variationSeed: number = 0): EchoRoom[] {
  const authoredLightRoom = applyAuthoredDialogue(LIGHT_ROOM);
  const authoredShadowRoom = applyAuthoredDialogue(SHADOW_ROOM);
  const authoredAmbitionRoom = applyAuthoredDialogue(AMBITION_ROOM);
  const lightSlots = createRng(variationSeed)
    .fork("floor-1-light:exit-slots")
    .shuffle(authoredLightRoom.objects.map(({ x, z }) => ({ x, z })));
  const lightKinds: ObjectKind[] = ["door", "monster", "chest"];
  const lightObjects = authoredLightRoom.objects.map((object) => {
    const slotIndex = lightKinds.indexOf(object.kind);
    const slot = lightSlots[slotIndex];
    return { ...object, x: slot.x, z: slot.z };
  });
  const lightRoutes = Object.fromEntries(
    lightObjects.map((object) => [
      object.kind,
      [
        { x: 0, z: 12 },
        { x: object.x, z: 12 },
        { x: object.x, z: 7 },
        { x: object.x, z: 0 },
      ],
    ])
  ) as Record<ObjectKind, FloorPoint[]>;
  return [
    {
      ...authoredLightRoom,
      objects: lightObjects,
      routes: lightRoutes,
      blocks: authoredLightRoom.blocks?.map((block) => ({ ...block })),
    },
    placeRoom(authoredShadowRoom, createFloor2ShadowLayout(variationSeed)),
    placeRoom(authoredAmbitionRoom, createFloor3AmbitionLayout(variationSeed)),
  ];
}

export const ECHO_ROOMS: EchoRoom[] = createEchoRooms();
