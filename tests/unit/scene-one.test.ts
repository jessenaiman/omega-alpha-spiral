import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  DREAMWEAVER_ORDER,
  emptyAffinity,
  leader,
  scoreChoice,
} from '../../src/game/affinity';
import { RUNG_ORDER, rungFor } from '../../src/game/ladder';
import { nextSpeaker } from '../../src/game/sequence';

// --- affinity -----------------------------------------------------------------
// Hidden scoring. Rules fixed by the design owner 2026-09-17:
//   Omega's question  -> the represented Dreamweaver gets +1
//   Dreamweaver's     -> owner gets +2 for its own interpretation
//   question             any other Dreamweaver gets +1 for its option

test('a fresh affinity array starts at zero for all three Dreamweavers', () => {
  assert.deepEqual(emptyAffinity(), { light: 0, shadow: 0, ambition: 0 });
});

test('Omega is not a Dreamweaver and owns no affinity slot', () => {
  assert.deepEqual([...DREAMWEAVER_ORDER], ['light', 'shadow', 'ambition']);
  assert.ok(!(DREAMWEAVER_ORDER as readonly string[]).includes('omega'));
});

test("Omega's question awards exactly one point to the represented Dreamweaver", () => {
  const scored = scoreChoice(emptyAffinity(), 'shadow', null);
  assert.deepEqual(scored, { light: 0, shadow: 1, ambition: 0 });
});

test("a Dreamweaver's own interpretation awards two points to that owner", () => {
  const scored = scoreChoice(emptyAffinity(), 'ambition', 'ambition');
  assert.deepEqual(scored, { light: 0, shadow: 0, ambition: 2 });
});

test("choosing another Dreamweaver's option awards one point to it and none to the owner", () => {
  const scored = scoreChoice(emptyAffinity(), 'light', 'ambition');
  assert.deepEqual(scored, { light: 1, shadow: 0, ambition: 0 });
});

test('scoring does not mutate the affinity it is given', () => {
  const before = emptyAffinity();
  scoreChoice(before, 'light', null);
  assert.deepEqual(before, { light: 0, shadow: 0, ambition: 0 });
});

test('points accumulate across a scene', () => {
  let affinity = emptyAffinity();
  affinity = scoreChoice(affinity, 'light', null); // Omega's question, +1 light
  affinity = scoreChoice(affinity, 'light', 'light'); // owner's own, +2 light
  affinity = scoreChoice(affinity, 'shadow', 'light'); // other's option, +1 shadow
  assert.deepEqual(affinity, { light: 3, shadow: 1, ambition: 0 });
});

test('the leader is the highest scorer, ties broken by canonical order', () => {
  assert.equal(leader({ light: 3, shadow: 1, ambition: 0 }), 'light');
  assert.equal(leader({ light: 1, shadow: 4, ambition: 0 }), 'shadow');
  // tie -> first in DREAMWEAVER_ORDER wins, so the result is never arbitrary
  assert.equal(leader({ light: 2, shadow: 2, ambition: 0 }), 'light');
  // nothing scored yet -> nobody attaches
  assert.equal(leader(emptyAffinity()), null);
});

// --- sequence -----------------------------------------------------------------
// Each Dreamweaver gets at most one turn per scene. A choice that would hand the
// turn to someone who has already spoken passes to the next unspoken Dreamweaver.

test('an unspoken Dreamweaver chosen by the previous beat speaks next', () => {
  assert.equal(nextSpeaker('shadow', []), 'shadow');
  assert.equal(nextSpeaker('light', ['shadow']), 'light');
});

test('a choice pointing at a Dreamweaver who already spoke passes to the next unspoken one', () => {
  assert.equal(nextSpeaker('light', ['light']), 'shadow');
  assert.equal(nextSpeaker('light', ['light', 'shadow']), 'ambition');
  assert.equal(nextSpeaker('shadow', ['shadow', 'light']), 'ambition');
});

test('the turn order exhausts after each Dreamweaver has spoken once', () => {
  assert.equal(nextSpeaker('ambition', ['light', 'shadow', 'ambition']), null);
  assert.equal(nextSpeaker('light', ['light', 'shadow', 'ambition']), null);
});

test('walking the scene never gives any Dreamweaver a second turn', () => {
  const spoken: Array<'light' | 'shadow' | 'ambition'> = [];
  // adversarial picks: every beat tries to hand the turn back to light
  let speaker = nextSpeaker('light', spoken);
  while (speaker) {
    spoken.push(speaker);
    speaker = nextSpeaker('light', spoken);
  }
  assert.deepEqual([...spoken], ['light', 'shadow', 'ambition']);
  assert.equal(spoken.length, new Set(spoken).size, 'a Dreamweaver spoke twice');
});

// --- ladder -------------------------------------------------------------------
// The visual primitive ladder: dot -> line -> box -> icon. It only ever advances,
// because a Dreamweaver's legibility is a readout of what Omega has taught itself.

test('the ladder starts at a bare dot', () => {
  assert.equal(rungFor(0), 'dot');
});

test('the ladder advances through every rung in order', () => {
  const seen = [0, 1, 2, 3].map(rungFor);
  assert.deepEqual(seen, [...RUNG_ORDER]);
});

test('the ladder never regresses as the scene advances', () => {
  let previous = -1;
  for (let step = 0; step < 40; step += 1) {
    const index = RUNG_ORDER.indexOf(rungFor(step));
    assert.ok(index >= previous, `ladder regressed at step ${step}`);
    previous = index;
  }
});

test('the ladder holds at its top rung once reached', () => {
  assert.equal(rungFor(3), 'icon');
  assert.equal(rungFor(50), 'icon');
});
