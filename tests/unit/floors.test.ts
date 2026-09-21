import assert from 'node:assert/strict';
import test from 'node:test';
import { DESCENT_FLOORS, type FloorId } from '../../src/chapter-two/floors';

test('descent floors are ordered Light, Shadow, Ambition with per-floor capability data', () => {
  const ids: FloorId[] = DESCENT_FLOORS.map((floor): FloorId => floor.id);
  assert.deepEqual(ids, ['echo', 'guardian', 'gauntlet', 'revision', 'threshold-echo', 'omniscient', 'mirror-one', 'mirror-two', 'mirror-three']);
  // Floor 1 combat is impossible: no attack available, the monster auto-defeats.
  assert.equal(DESCENT_FLOORS[0]!.attacksRequired, 0);
  assert.equal(DESCENT_FLOORS[0]!.attacksAllowed, false);
  // Floor 2 unlocks attack via the rewritten script; one strike wins.
  assert.equal(DESCENT_FLOORS[1]!.attacksAllowed, true);
  assert.equal(DESCENT_FLOORS[1]!.attacksRequired, 1);
  // Floor 3 demands more strikes under a shorter timer.
  assert.equal(DESCENT_FLOORS[2]!.attacksRequired, 2);
  assert.ok(DESCENT_FLOORS[2]!.fightSeconds < 1.2);
  // Visual clarity steps up per floor while keeping a defect marker.
  assert.ok(DESCENT_FLOORS[2]!.visualStep > DESCENT_FLOORS[1]!.visualStep);
  assert.equal(DESCENT_FLOORS[1]!.defect, 'none');
  assert.equal(DESCENT_FLOORS[2]!.defect, 'scanline');
});

test('every floor offers one object of each kind with exactly three alignments across floors', () => {
  for (const floor of DESCENT_FLOORS) {
    const kinds = floor.objects.map((object): string => object.kind).sort();
    assert.deepEqual(kinds, ['chest', 'door', 'monster']);
    assert.ok(floor.objects.every((object): boolean => Number.isFinite(object.x) && Number.isFinite(object.z)));
  }
  const alignments = new Set(DESCENT_FLOORS.flatMap((floor): string[] => floor.objects.map((object): string => object.alignment)));
  assert.equal(alignments.size, 3);
});
