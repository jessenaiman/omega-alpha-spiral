/**
 * The visual primitive ladder — what Omega can currently render of a Dreamweaver.
 *
 * `dot -> line -> box -> icon`. Strictly non-decreasing across a scene, because a
 * Dreamweaver's legibility is a readout of what Omega has taught itself so far.
 * The ladder is extensible past `icon`: append a rung to `RUNG_ORDER` and every
 * clamp in this module follows.
 */

export const RUNG_ORDER = ['dot', 'line', 'box', 'icon'] as const;

export type Rung = (typeof RUNG_ORDER)[number];

export const TOP_RUNG_INDEX = RUNG_ORDER.length - 1;

/**
 * The rung showing at a given ladder step. Steps below zero read as the first
 * rung and steps past the top hold at the top, so the ladder can never regress
 * no matter how far the scene advances.
 */
export function rungFor(step: number): Rung {
  const index = Math.min(Math.max(Math.trunc(step), 0), TOP_RUNG_INDEX);
  return RUNG_ORDER[index] as Rung;
}

/** The position of a rung in the ladder. */
export function rungIndexOf(rung: Rung): number {
  return RUNG_ORDER.indexOf(rung);
}

/** Advance one step without ever going backwards. */
export function advanceLadderStep(step: number): number {
  return Math.min(Math.max(Math.trunc(step), 0) + 1, TOP_RUNG_INDEX);
}