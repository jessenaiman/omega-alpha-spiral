/**
 * Hidden affinity — the Scene 1 scoring rules.
 *
 * The player is never shown these numbers. They exist so the final pairing can
 * attach to whoever the scene has been leaning towards, and so the rules can be
 * verified without a browser.
 *
 * Owner's rule, `t3` and `t4`:
 *   Omega's question       -> the represented Dreamweaver gains 1
 *   a Dreamweaver's own    -> that Dreamweaver gains 2
 *   interpretation
 *   another Dreamweaver's  -> that one gains 1
 *   option
 *
 * CONTRACT NOTE (recorded, not silently resolved): `tests/unit/scene-one.test.ts`
 * pins the third case differently from the prose above. The test at
 * "choosing another Dreamweaver's option awards one point to it and none to the
 * owner" asserts `scoreChoice(emptyAffinity(), 'light', 'ambition')` equals
 * `{ light: 1, shadow: 0, ambition: 0 }` — the point goes to the Dreamweaver the
 * beat represents, not to the owner of the chosen option. The ticket states the
 * test is the contract, so the implementation follows the assertion; the prose
 * clause is flagged for the design owner rather than quietly dropped. Every other
 * case in the test agrees with the prose.
 */

/** Canonical order. Ties and turn order resolve against this, never against a draw. */
export const DREAMWEAVER_ORDER = ['light', 'shadow', 'ambition'] as const;

export type Dreamweaver = (typeof DREAMWEAVER_ORDER)[number];

export type Affinity = Record<Dreamweaver, number>;

export function emptyAffinity(): Affinity {
  return { light: 0, shadow: 0, ambition: 0 };
}

/**
 * Score one committed beat.
 *
 * `represented` is the Dreamweaver the beat stands for: the option the player
 * chose when Omega asks, or the Dreamweaver asking its own question.
 * `chosen` is the owner of the option the player picked, or `null` when the beat
 * had no Dreamweaver-owned option (Omega's question).
 *
 * Returns a new affinity; the value handed in is never mutated.
 */
export function scoreChoice(
  affinity: Affinity,
  represented: Dreamweaver,
  chosen: Dreamweaver | null,
): Affinity {
  const gain = chosen !== null && chosen === represented ? 2 : 1;
  return { ...affinity, [represented]: affinity[represented] + gain };
}

/**
 * The Dreamweaver the run currently attaches to: the highest score, ties broken
 * by canonical order so the result is never arbitrary. Nobody scored yet means
 * nobody attaches.
 */
export function leader(affinity: Affinity): Dreamweaver | null {
  let best: Dreamweaver | null = null;
  for (const dreamweaver of DREAMWEAVER_ORDER) {
    if (best === null || affinity[dreamweaver] > affinity[best]) {
      best = dreamweaver;
    }
  }
  return best !== null && affinity[best] > 0 ? best : null;
}