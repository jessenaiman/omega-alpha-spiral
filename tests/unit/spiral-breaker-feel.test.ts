/**
 * Spiral Breaker — the feel layer, proven without a browser.
 *
 * Hitstop selection is a pure function of the rule events; the feel bus
 * converts a freeze into a scaled time + ducked audio and back on the real
 * clock. The tween manager's keyed replacement and overshoot settle are the
 * two behaviors the actors depend on for squash-and-stretch.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  createFeel,
  HITSTOP_DUCK,
  HITSTOP_SCALE,
  hitstopFor,
  type Feel,
} from '../../src/arcade/present/feel';
import {
  createTweenManager,
  easeOutBack,
  easeOutCubic,
} from '../../src/arcade/present/tween';
import type { ArcadeEvent } from '../../src/arcade/game';

const destroy = (kind: 'standard' | 'splitter' | 'shielded' | 'mini' | 'heart'): ArcadeEvent => ({
  type: 'shard.destroy',
  id: 1,
  x: 0,
  y: 0,
  kind,
});

test('hitstopFor maps destroy kinds to tasteful durations', () => {
  assert.equal(hitstopFor(destroy('shielded'))?.durationMs, 55);
  assert.equal(hitstopFor(destroy('splitter'))?.durationMs, 45);
  assert.equal(hitstopFor(destroy('standard'))?.durationMs, 35);
  assert.equal(hitstopFor(destroy('mini'))?.durationMs, 30);
  assert.equal(hitstopFor(destroy('heart'))?.durationMs, 20);
  for (const spec of ['shielded', 'splitter', 'standard', 'mini', 'heart'] as const) {
    assert.equal(hitstopFor(destroy(spec))?.scale, HITSTOP_SCALE);
  }
});

test('hitstopFor maps contact events, not state bookkeeping', () => {
  assert.equal(hitstopFor({ type: 'shard.blocked', id: 1, x: 0, y: 0 })?.durationMs, 45);
  assert.equal(hitstopFor({ type: 'core.heal', integrity: 2, x: 0, y: 0 })?.durationMs, 20);
  assert.equal(hitstopFor({ type: 'player.knockback', x: 0, y: 0 })?.durationMs, 60);
  assert.equal(hitstopFor({ type: 'core.breach', integrity: 2, x: 0, y: 0 })?.durationMs, 90);
  assert.equal(hitstopFor({ type: 'score.change', score: 10, gained: 10, chain: 1 }), null);
  assert.equal(hitstopFor({ type: 'shard.spawn', id: 1, x: 0, y: 0, bearing: 0, variant: 0, drifter: false, kind: 'standard' }), null);
  assert.equal(hitstopFor({ type: 'dash.start', x: 0, y: 0 }), null);
});

test('feel applies a freeze and restores the world on the real clock', () => {
  const feel: Feel = createFeel();
  assert.equal(feel.timeScale, 1);
  assert.equal(feel.duck, 1);

  feel.observe([destroy('standard')]);
  assert.equal(feel.timeScale, HITSTOP_SCALE);
  assert.equal(feel.duck, HITSTOP_DUCK);

  // Half the 35ms freeze elapsed in real time.
  feel.decay(0.0175);
  assert.equal(feel.timeScale, HITSTOP_SCALE);

  feel.decay(0.02);
  assert.equal(feel.timeScale, 1);
  assert.equal(feel.duck, 1);
});

test('feel takes the heaviest event in a batch and stays frozen', () => {
  const feel: Feel = createFeel();
  feel.observe([destroy('shielded'), destroy('heart')]);
  assert.equal(feel.timeScale, HITSTOP_SCALE);
  feel.decay(0.03);
  // Still frozen at 0.03s in because the 55ms shielded freeze outranks the 20ms heal.
  assert.equal(feel.timeScale, HITSTOP_SCALE);
  feel.decay(0.03);
  assert.equal(feel.timeScale, 1);
});

test('feel.reset clears an in-flight freeze', () => {
  const feel: Feel = createFeel();
  feel.observe([{ type: 'core.breach', integrity: 2, x: 0, y: 0 }]);
  assert.notEqual(feel.timeScale, 1);
  feel.reset();
  assert.equal(feel.timeScale, 1);
  assert.equal(feel.duck, 1);
});

test('tween manager runs to completion and calls onComplete', () => {
  const tweens = createTweenManager();
  let value = 0;
  let completed = 0;
  tweens.tween(
    'a',
    0.1,
    (v) => {
      value = v;
    },
    easeOutCubic,
    () => {
      completed += 1;
    },
  );
  tweens.update(0.05);
  assert.ok(value > 0 && value < 1, 'midway value is strictly between the endpoints');
  tweens.update(0.06);
  assert.equal(value, 1);
  assert.equal(completed, 1);
});

test('easeOutBack overshoots past its endpoint, then settles to rest', () => {
  let peak = 0;
  let settled = 0;
  for (let index = 1; index < 100; index += 1) {
    const t = index / 100;
    peak = Math.max(peak, easeOutBack(t));
  }
  settled = easeOutBack(1);
  assert.ok(peak > 1, `overshoot exists (peak ${peak.toFixed(3)})`);
  assert.equal(settled, 1);
});

test('tween restart on the same key resets from the new start', () => {
  const tweens = createTweenManager();
  const saw: number[] = [];
  tweens.tween('k', 0.2, (v) => saw.push(v));
  tweens.update(0.1);
  assert.ok((saw[0] as number) > 0, 'progressed before the restart');
  tweens.tween('k', 0.2, (v) => saw.push(v));
  const before = saw.length;
  tweens.update(0.001);
  assert.ok(
    (saw[saw.length - 1] as number) < (saw[before - 1] as number),
    'restart rewinds to the eased start',
  );
});

test('tween cancel removes the key so a later same-key tween starts clean', () => {
  const tweens = createTweenManager();
  const saw: number[] = [];
  tweens.tween('k', 0.2, (v) => saw.push(v));
  tweens.update(0.1);
  tweens.cancel('k');
  const lengthBefore = saw.length;
  tweens.update(0.05);
  assert.equal(saw.length, lengthBefore, 'cancelled tween no longer updates');
  tweens.tween('k', 0.2, (v) => saw.push(v));
  tweens.update(0.001);
  assert.strictEqual(saw[saw.length - 1], easeOutCubic(0.001 / 0.2));
});