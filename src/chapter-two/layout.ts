import { createRng } from '../core/random';
import type { ObjectKind } from './floors';

export interface ExitPlacement { kind: ObjectKind; x: number; z: number }

const JITTER_TILES: number = 2;
const ZONES: Record<ObjectKind, [number, number, number]> = {
  // Left / center / right thirds; jitter never lets an exit leave its zone.
  door: [-10, -9, -6],
  monster: [-2, 0, 2],
  chest: [6, 9, 10],
};

/**
 * Dungeon logic from the source: walls move 1–2 tiles between runs, but each
 * exit keeps its relative zone. Deterministic per seed + floor index.
 */
export function layoutFor(seed: string, floorIndex: number): ExitPlacement[] {
  const rng = createRng(`${seed}:${floorIndex}`).fork('floor-layout');
  const jitter = (): number => (rng.next() < 0.5 ? -1 : 1) * (1 + Number(rng.next() < 0.5)) * 1.5;
  const kinds: ObjectKind[] = ['door', 'monster', 'chest'];
  return kinds.map((kind): ExitPlacement => {
    const [min, base, max] = ZONES[kind];
    const x: number = Math.max(min, Math.min(max, base + jitter()));
    return { kind, x, z: 0 };
  });
}
