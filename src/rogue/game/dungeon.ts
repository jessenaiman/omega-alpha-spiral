/**
 * Rogue Descent — pure dungeon generation. Seed plus depth produce the same
 * floor every time: rooms on a grid, L-corridors joining them, stairs in the
 * last room, monsters and one heart placed by the seeded RNG.
 */

import { createRng } from '../../core/random';
import { TUNING } from './tuning';

export type Tile = 'floor' | 'wall' | 'stairs';

export interface Vec {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Dungeon {
  cols: number;
  rows: number;
  tiles: Tile[];
  rooms: Rect[];
  playerStart: Vec;
  stairs: Vec;
  monsterSpawns: Vec[];
  heartSpawn: Vec | null;
}

const center = (room: Rect): Vec => ({ x: Math.floor(room.x + room.w / 2), y: Math.floor(room.y + room.h / 2) });

function overlaps(a: Rect, b: Rect, pad: number): boolean {
  return a.x - pad < b.x + b.w && a.x + a.w + pad > b.x && a.y - pad < b.y + b.h && a.y + a.h + pad > b.y;
}

export function createDungeon(seed: string, depth: number): Dungeon {
  const rng = createRng(`${seed}:dungeon:${depth}`);
  const cols = Math.min(TUNING.baseCols + (depth - 1) * TUNING.growthPerDepth, TUNING.maxCols);
  const rows = Math.min(TUNING.baseRows + (depth - 1) * TUNING.growthPerDepth, TUNING.maxRows);
  const tiles: Tile[] = new Array<Tile>(cols * rows).fill('wall');

  const carve = (x: number, y: number): void => {
    if (x > 0 && y > 0 && x < cols - 1 && y < rows - 1) tiles[y * cols + x] = 'floor';
  };

  const rooms: Rect[] = [];
  for (let attempt = 0; attempt < TUNING.roomAttempts && rooms.length < TUNING.maxRooms; attempt += 1) {
    const w = TUNING.roomMin + rng.int(TUNING.roomMax - TUNING.roomMin + 1);
    const h = TUNING.roomMin + rng.int(TUNING.roomMax - TUNING.roomMin + 1);
    if (w + 2 >= cols || h + 2 >= rows) continue;
    const x = 1 + rng.int(cols - w - 2);
    const y = 1 + rng.int(rows - h - 2);
    const room: Rect = { x, y, w, h };
    if (rooms.some(other => overlaps(other, room, 2))) continue;
    rooms.push(room);
    for (let yy = y; yy < y + h; yy += 1) for (let xx = x; xx < x + w; xx += 1) carve(xx, yy);
  }

  if (rooms.length === 0) {
    const room: Rect = { x: 2, y: 2, w: 6, h: 4 };
    rooms.push(room);
    for (let yy = room.y; yy < room.y + room.h; yy += 1) for (let xx = room.x; xx < room.x + room.w; xx += 1) carve(xx, yy);
  }

  for (let index = 1; index < rooms.length; index += 1) {
    const a = center(rooms[index - 1] as Rect);
    const b = center(rooms[index] as Rect);
    for (let x = Math.min(a.x, b.x); x <= Math.max(a.x, b.x); x += 1) carve(x, a.y);
    for (let y = Math.min(a.y, b.y); y <= Math.max(a.y, b.y); y += 1) carve(b.x, y);
  }

  const playerStart = center(rooms[0] as Rect);
  const stairs = center(rooms[rooms.length - 1] as Rect);
  tiles[stairs.y * cols + stairs.x] = 'stairs';

  const monsterSpawns: Vec[] = [];
  const wanted = 1 + depth;
  for (let index = 0; index < wanted; index += 1) {
    const room = rooms[1 + rng.int(Math.max(1, rooms.length - 1))] ?? (rooms[rooms.length - 1] as Rect);
    const spawn = { x: room.x + rng.int(room.w), y: room.y + rng.int(room.h) };
    if (spawn.x === stairs.x && spawn.y === stairs.y) continue;
    if (spawn.x === playerStart.x && spawn.y === playerStart.y) continue;
    monsterSpawns.push(spawn);
  }

  let heartSpawn: Vec | null = null;
  if (rooms.length > 1) {
    const room = rooms[1 + rng.int(rooms.length - 1)] as Rect;
    heartSpawn = { x: room.x + rng.int(room.w), y: room.y + rng.int(room.h) };
  }

  return { cols, rows, tiles, rooms, playerStart, stairs, monsterSpawns, heartSpawn };
}
