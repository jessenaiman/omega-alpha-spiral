import assert from 'node:assert/strict';
import test from 'node:test';
import { WalkField } from '../../src/chapter-two/WalkField';

test('floor one combat is impossible: the timer defeats the player without death', () => {
  const field = new WalkField();
  field.start('Light');
  field.player = { x: 0, z: 2 };
  field.interact();
  assert.equal(field.phase, 'fighting');
  assert.equal(field.attacksAvailable, false);
  field.attack();
  assert.equal(field.phase, 'fighting');
  for (let i = 0; i < 20; i += 1) field.update(0.1, 0, 0);
  assert.equal(field.phase, 'result');
  assert.equal(field.lastOutcome, 'defeat');
  assert.equal(field.choices.length, 1);
  assert.ok(field.distanceTravelled >= 0);
});

test('floor two rewrite unlocks attack: one strike wins, progress is kept through the rewrite', () => {
  const field = new WalkField();
  field.start('Light');
  field.player = { x: 0, z: 2 };
  field.interact();
  for (let i = 0; i < 20; i += 1) field.update(0.1, 0, 0);
  field.continue();
  assert.equal(field.phase, 'rewriting');
  field.continue();
  assert.equal(field.attacksAvailable, true);
  field.player = { x: 0, z: 2 };
  field.interact();
  assert.equal(field.phase, 'fighting');
  field.attack();
  assert.equal(field.phase, 'result');
  assert.equal(field.lastOutcome, 'victory');
});

test('floor three monster needs two strikes before the shorter timer defeats', () => {
  const field = new WalkField();
  field.start('Light');
  for (let room = 0; room < 2; room += 1) {
    field.player = { x: 0, z: 2 };
    field.interact();
    for (let i = 0; i < 20; i += 1) field.update(0.1, 0, 0);
    field.continue();
    if (field.phase === 'rewriting') field.continue();
  }
  assert.equal(field.attacksAvailable, true);
  field.player = { x: 0, z: 2 };
  field.interact();
  field.attack();
  assert.equal(field.phase, 'fighting');
  field.attack();
  assert.equal(field.phase, 'result');
  assert.equal(field.lastOutcome, 'victory');
});
