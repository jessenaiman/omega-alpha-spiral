/**
 * Spiral Breaker — feedback timing.
 *
 * The game's hitstop. Rules keep stepping on the fixed clock (determinism is a
 * rules property, not a presentation one); the host simply feeds the loop a
 * scaled delta for the duration of the freeze while the render loop keeps
 * drawing on the real delta, so the frozen moment is visible and feedback stays
 * live. Audio ducks during the freeze so the impact reads. Selection is a pure
 * function of rule events, so it stays testable without a host.
 */

import type { ArcadeEvent } from '../game';

export const HITSTOP_SCALE = 0.05;
export const HITSTOP_DUCK = 0.6;
const HITSTOP_MAX_MS = 140;

export interface HitstopSpec {
  readonly durationMs: number;
  readonly scale: number;
}

/** Which contact events freeze the world, and for how long. */
export function hitstopFor(event: ArcadeEvent): HitstopSpec | null {
  switch (event.type) {
    case 'shard.destroy':
      return {
        durationMs: event.kind === 'shielded' ? 55 : event.kind === 'splitter' ? 45 : event.kind === 'mini' ? 30 : event.kind === 'heart' ? 20 : 35,
        scale: HITSTOP_SCALE,
      };
    case 'shard.blocked':
      return { durationMs: 45, scale: HITSTOP_SCALE };
    case 'core.heal':
      return { durationMs: 20, scale: HITSTOP_SCALE };
    case 'player.knockback':
      return { durationMs: 60, scale: HITSTOP_SCALE };
    case 'core.breach':
      return { durationMs: 90, scale: HITSTOP_SCALE };
    default:
      return null;
  }
}

export interface Feel {
  /** Multiplies the delta fed to the fixed loop; 1 when the world runs full speed. */
  readonly timeScale: number;
  /** 0..1 audio duck; lower while a freeze holds so the impact reads. */
  readonly duck: number;
  /** Fold one batch of rule events into the feel state. */
  observe(events: readonly ArcadeEvent[]): void;
  /** Decay in real time; call with the REAL render delta. */
  decay(dtSec: number): void;
  reset(): void;
}

export function createFeel(): Feel {
  let remainingMs = 0;
  let scale = 1;
  let duck = 1;

  return {
    get timeScale(): number {
      return scale;
    },
    get duck(): number {
      return duck;
    },
    observe(events: readonly ArcadeEvent[]) {
      for (const event of events) {
        const spec = hitstopFor(event);
        if (!spec) continue;
        const next = Math.min(HITSTOP_MAX_MS, Math.max(remainingMs, spec.durationMs));
        if (next > remainingMs) {
          remainingMs = next;
          scale = spec.scale;
          duck = HITSTOP_DUCK;
        }
      }
    },
    decay(dtSec: number) {
      if (remainingMs <= 0) return;
      remainingMs = Math.max(0, remainingMs - dtSec * 1000);
      if (remainingMs <= 0) {
        scale = 1;
        duck = 1;
      }
    },
    reset() {
      remainingMs = 0;
      scale = 1;
      duck = 1;
    },
  };
}