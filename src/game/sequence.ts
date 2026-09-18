/**
 * The turn sequence — who speaks next.
 *
 * Omega asks first and last. Each Dreamweaver gets at most one turn. The chosen
 * option names the next Dreamweaver; when that Dreamweaver has already spoken,
 * the turn passes to the next Dreamweaver who has not, in canonical order.
 */

import { DREAMWEAVER_ORDER } from './affinity';
import type { Dreamweaver } from './affinity';

/**
 * The next Dreamweaver to speak, or `null` when every Dreamweaver has had its
 * turn and the scene belongs to Omega again.
 *
 * `chosen` is the Dreamweaver named by the previous choice. `spoken` lists the
 * Dreamweavers who have already taken a turn, in the order they spoke.
 */
export function nextSpeaker(
  chosen: Dreamweaver,
  spoken: readonly Dreamweaver[],
): Dreamweaver | null {
  const start = DREAMWEAVER_ORDER.indexOf(chosen);
  for (let offset = 0; offset < DREAMWEAVER_ORDER.length; offset += 1) {
    const candidate = DREAMWEAVER_ORDER[
      (start + offset) % DREAMWEAVER_ORDER.length
    ] as Dreamweaver;
    if (!spoken.includes(candidate)) return candidate;
  }
  return null;
}