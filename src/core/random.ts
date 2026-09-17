/**
 * The one seeded generator.
 *
 * Every non-authored variation in the scene runs through this module: the
 * question draw, Shadow's directional randomness, spark and effect placement.
 * Nothing in `src/core` or `src/game` may call the platform's unseeded random
 * global — see the guard test in `tests/unit/core-runtime.test.ts`. Adding one
 * breaks the determinism contract and the browser test hooks that depend on it.
 *
 * Same seed, same inputs, same run — always.
 */

export interface SeededRng {
  /** The normalised seed this stream was built from. */
  readonly seed: string;
  /** A float in `[0, 1)`. */
  next(): number;
  /** An integer in `[0, maxExclusive)`. */
  int(maxExclusive: number): number;
  /** One element of a non-empty list. */
  pick<T>(items: readonly T[]): T;
  /** A new array holding the same elements in a seeded order. */
  shuffle<T>(items: readonly T[]): T[];
  /**
   * An independent stream derived from the same seed. Subsystems fork rather
   * than share, so adding a draw in one place cannot shift another's sequence.
   */
  fork(label: string): SeededRng;
}

/** xmur3 — string to a 32-bit hash. */
function hashSeed(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let index = 0; index < seed.length; index += 1) {
    h = Math.imul(h ^ seed.charCodeAt(index), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Seeds are strings internally so a numeric seed and a file-stamp seed behave alike. */
export function normalizeSeed(seed: string | number): string {
  return typeof seed === 'number' ? `seed:${seed}` : seed;
}

export function createRng(seed: string | number): SeededRng {
  const seedLabel = normalizeSeed(seed);
  let state = hashSeed(seedLabel);

  const next = (): number => {
    // mulberry32
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    seed: seedLabel,
    next,
    int(maxExclusive: number): number {
      if (!Number.isInteger(maxExclusive) || maxExclusive <= 0) {
        throw new RangeError(`rng.int expects a positive integer, received ${maxExclusive}`);
      }
      return Math.floor(next() * maxExclusive);
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new RangeError('rng.pick expects a non-empty list');
      return items[Math.floor(next() * items.length)] as T;
    },
    shuffle<T>(items: readonly T[]): T[] {
      const out = [...items];
      for (let index = out.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(next() * (index + 1));
        const held = out[index] as T;
        out[index] = out[swap] as T;
        out[swap] = held;
      }
      return out;
    },
    fork(label: string): SeededRng {
      return createRng(`${seedLabel}:${label}`);
    },
  };
}