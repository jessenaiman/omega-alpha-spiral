import test from 'node:test';
import assert from 'node:assert/strict';
import { ExplorationPhase } from '../../src/phases/ExplorationPhase.js';
import type { GameAction, FeedbackEvent } from '../../src/game/types.js';

// Removing proximity checks or unique restoration must break this real movement path.
test('walks to three landmarks; distant and duplicate Acts do not restore', () => {
  const actions: GameAction[] = [];
  const feedback: FeedbackEvent[] = [];
  const phase = new ExplorationPhase(a => actions.push(a), e => feedback.push(e));
  assert.equal(phase.act(), false);
  const walk = (x: number, z: number) => {
    for (let i = 0; i < 2000; i++) {
      const p = phase.snapshot().player;
      const dx = x - p.x, dz = z - p.z;
      if (Math.hypot(dx, dz) < 0.08) return;
      phase.update(1 / 60, { x: dx, z: dz });
    }
    assert.fail('target unreachable');
  };
  walk(-8, 1);
  assert.equal(phase.act(), true);
  assert.equal(phase.act(), false);
  walk(8, 1);
  assert.equal(phase.act(), true);
  walk(0, 10);
  assert.equal(phase.act(), true);
  assert.equal(phase.snapshot().complete, true);
  assert.deepEqual(actions, ['archive', 'refuge', 'gate'].map(landmark => ({ type: 'landmark.completed', landmark })));
  assert.equal(feedback.filter(e => e.type === 'landmark.restore').length, 3);
});

test('movement normalizes diagonals and respects town bounds', () => {
  const phase = new ExplorationPhase(() => {}, () => {});
  phase.update(1 / 60, { x: 1, z: 1 });
  assert.ok(Math.abs(Math.hypot(phase.snapshot().player.x, phase.snapshot().player.z) - 0.08) < 1e-8);
  for (let i = 0; i < 1000; i++) phase.update(1 / 60, { x: 1, z: -1 });
  assert.deepEqual(phase.snapshot().player, { x: 13, z: -8 });
});

test('sub-unit analog input preserves its movement magnitude', () => {
  const phase = new ExplorationPhase(() => {}, () => {});
  phase.update(1 / 60, { x: 0.5, z: 0 });
  assert.ok(Math.abs(phase.snapshot().player.x - 0.04) < 1e-8);
});

test('blackout tells begin after the first restoration and contact freezes movement for 250 ms', () => {
  const feedback: FeedbackEvent[] = [];
  const phase = new ExplorationPhase(() => {}, event => feedback.push(event));

  for (let step = 0; step < 2000; step += 1) {
    const snapshot = phase.snapshot();
    assert.equal(snapshot.blackoutStrip, null);
    assert.equal(snapshot.freezeRemaining, 0);
    const dx = -8 - snapshot.player.x;
    const dz = 1 - snapshot.player.z;
    if (Math.hypot(dx, dz) < 0.08) break;
    phase.update(1 / 60, { x: dx, z: dz });
  }
  assert.equal(phase.act(), true);
  assert.equal(phase.snapshot().blackoutStrip?.phase, 'tell');
  phase.update(1 / 60, { x: 0, z: 0 });
  assert.equal(phase.snapshot().blackoutStrip?.phase, 'tell');

  for (let step = 0; step < 120 && phase.snapshot().blackoutStrip?.phase !== 'active'; step += 1) {
    phase.update(1 / 60, { x: 0, z: 0 });
  }
  assert.equal(phase.snapshot().blackoutStrip?.phase, 'active');

  for (let step = 0; step < 120 && phase.snapshot().freezeRemaining === 0; step += 1) {
    const snapshot = phase.snapshot();
    const strip = snapshot.blackoutStrip;
    assert.ok(strip);
    phase.update(1 / 60, {
      x: strip.x - snapshot.player.x,
      z: strip.z - snapshot.player.z,
    });
  }

  const contact = phase.snapshot();
  assert.equal(contact.freezeRemaining, 0.25);
  assert.deepEqual(contact.restored, ['archive']);
  const frozenPosition = contact.player;
  for (let step = 0; step < 15; step += 1) {
    phase.update(1 / 60, { x: 0, z: 0 });
    assert.deepEqual(phase.snapshot().player, frozenPosition);
  }
  assert.equal(phase.snapshot().freezeRemaining, 0);
  phase.update(1 / 60, { x: 1, z: 0 });
  assert.ok(phase.snapshot().player.x > frozenPosition.x);
  assert.deepEqual(phase.snapshot().restored, ['archive']);
  assert.ok(feedback.some(event => event.type === 'threat.tell'));
  assert.equal(feedback.filter(event => event.type === 'threat.contact').length, 1);
});
