import assert from 'node:assert/strict';
import test from 'node:test';
import { WalkField } from '../../src/chapter-two/WalkField';

test('sprint spends stamina and walking without input restores it', () => {
  const field = new WalkField();
  field.start('Light');
  assert.equal(field.stamina, 1);
  const before = { ...field.player };
  // Holding sprint while moving drains faster than the walk cost.
  for (let i = 0; i < 40; i += 1) field.update(0.1, 1, 0, { sprint: true });
  assert.ok(field.stamina < 1);
  assert.ok(field.distanceTravelled > Math.hypot(before.x - field.player.x, before.z - field.player.z));
  assert.ok(field.distanceTravelled > 0);
  const atLow: number = field.stamina;
  // Without directional input, stamina recovers.
  for (let i = 0; i < 60; i += 1) field.update(0.1, 0, 0);
  assert.ok(field.stamina > atLow);
  // Stamina is paved between 0 and 1 and never NaN.
  for (let i = 0; i < 400; i += 1) field.update(0.1, 1, 1, { sprint: true });
  assert.ok(Number.isFinite(field.stamina));
  assert.ok(field.stamina >= 0 && field.stamina <= 1);
});

test('sprint clamps: with empty stamina walking falls back to normal speed', () => {
  const field = new WalkField();
  field.start('Light');
  for (let i = 0; i < 400; i += 1) field.update(0.1, 1, 0, { sprint: true }); // drain fully
  const baselineTravelled = field.distanceTravelled;
  for (let i = 0; i < 10; i += 1) field.update(0.1, 1, 0, { sprint: true });
  const sprintless = field.distanceTravelled - baselineTravelled;
  field.start('Light');
  const walkBefore = field.distanceTravelled;
  for (let i = 0; i < 10; i += 1) field.update(0.1, 1, 0); // no sprint
  const walkDistance = field.distanceTravelled - walkBefore;
  // Drained sprint distance in the same frames equals plain walking.
  assert.ok(Math.abs(sprintless - walkDistance) < 1e-6);
});

test('dodge bursts forward on any input, at a fixed cost, once per press', () => {
  const field = new WalkField();
  field.start('Light');
  const before = { ...field.player };
  const boosted = field.dodge(1, -1);
  assert.equal(boosted, true);
  assert.ok(field.player.z < before.z);
  assert.ok(field.distanceTravelled > 0);
  // Repeated dodge without movement input consumes even empty-direction press.
  const again = field.dodge(0, 0);
  assert.equal(again, false);
});

test('dodge costs stamina and cannot fire when stamina is empty', () => {
  const field = new WalkField();
  field.start('Light');
  for (let i = 0; i < 400; i += 1) field.update(0.1, 1, 0, { sprint: true });
  assert.equal(field.stamina, 0);
  const before = { ...field.player };
  assert.equal(field.dodge(1, 0), false);
  assert.deepEqual(field.player, before);
});

test('monster defeat costs health, which restores one point per new floor', () => {
  const field = new WalkField();
  field.start('Light');
  assert.equal(field.health, 3);
  field.player = { x: 0, z: 2 };
  field.interact();
  for (let i = 0; i < 20; i += 1) field.update(0.1, 0, 0);
  assert.equal(field.health, 2); // defeat cost
  field.continue(); // rewrite
  field.continue(); // next floor
  assert.equal(field.health, 3); // restore
});

test('listening view peeks at the nearest exit without consuming it', () => {
  const field = new WalkField();
  field.start('Light');
  field.player = { x: 8, z: 2 };
  const before = field.phase;
  const peek = field.listen();
  assert.equal(peek, true);
  assert.equal(field.phase, before, 'listen never changes state');
  assert.ok(field.listened);
  const predicted = field.listenedExit;
  assert.equal(predicted?.kind, 'chest'); // nearest is the secret exit
});
