import { createFloor2ShadowLayout } from "./floors/early-shadow";
import { createFloor3AmbitionLayout } from "./floors/early-ambition";
import type { EarlyFloorLayout, FloorPoint } from "./floors/early-layout";

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
  owner: Guide;
  objects: RoomObject[];
  blocks?: RoomBlock[];
  heroStart?: FloorPoint;
  layout?: EarlyFloorLayout;
}

// Authored copy of stage_2/nethack-scene.md:119-237, interpreted as data, NOT
// executed pseudocode. Colors, code architecture and movement are our graybox.
const LIGHT_ROOM: EchoRoom = {
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

function placeRoom(
  room: EchoRoom,
  layout: EarlyFloorLayout
): EchoRoom {
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

/** Seeded room set for the same three identities with small deterministic layout shifts. */
export function createEchoRooms(variationSeed: number = 0): EchoRoom[] {
  return [
    {
      ...LIGHT_ROOM,
      objects: LIGHT_ROOM.objects.map((object) => ({ ...object })),
      blocks: LIGHT_ROOM.blocks?.map((block) => ({ ...block })),
    },
    placeRoom(SHADOW_ROOM, createFloor2ShadowLayout(variationSeed)),
    placeRoom(AMBITION_ROOM, createFloor3AmbitionLayout(variationSeed)),
  ];
}

export const ECHO_ROOMS: EchoRoom[] = createEchoRooms();
