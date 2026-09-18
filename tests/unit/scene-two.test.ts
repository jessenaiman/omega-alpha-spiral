import assert from 'node:assert/strict';
import test from 'node:test';

import { createChamberRun, LIGHT_CHAMBER_OBJECTS } from '../../src/scene-two/game';

test('the chamber exposes its real objects through generic actions and story', () => {
  assert.deepEqual(
    LIGHT_CHAMBER_OBJECTS.map(object => object.id).sort(),
    ['chest', 'door', 'monster'],
  );

  for (const object of LIGHT_CHAMBER_OBJECTS) {
    assert.ok(object.action.kind.trim());
    assert.ok(object.story.trim());
  }
});

test('activating a configured object produces a generic story outcome', () => {
  const run = createChamberRun(LIGHT_CHAMBER_OBJECTS);
  const outcome = run.activate('monster');

  assert.equal(outcome?.objectId, 'monster');
  assert.ok(outcome?.action.kind.trim());
  assert.ok(outcome?.story.trim());
});

test('restart clears the current workshop outcome', () => {
  const run = createChamberRun(LIGHT_CHAMBER_OBJECTS);
  run.activate('door');

  assert.ok(run.outcome);
  run.restart();
  assert.equal(run.outcome, null);
});
