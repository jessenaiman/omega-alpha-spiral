/**
 * Spiral Breaker — world-to-scene scale.
 *
 * The rules live in a unit arena centred on the origin, with `y` as the
 * second axis. The scene is laid out on the ground plane, so a rule `y`
 * becomes a scene `z`. One constant, so the mapping is never guessed.
 */

export const WORLD_SCALE = 3.2;

export function sceneX(x: number): number {
  return x * WORLD_SCALE;
}

export function sceneZ(y: number): number {
  return y * WORLD_SCALE;
}
