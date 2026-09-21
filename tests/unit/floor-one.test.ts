import assert from 'node:assert/strict';
import test from 'node:test';
import { WalkField } from '../../src/chapter-two/WalkField';
import { Whispers } from '../../src/chapter-two/Whispers';
import { layoutFor } from '../../src/chapter-two/layout';

test('choosing an exit dispatches the aligned Dreamweaver line and never blocks the loop', () => {
  const whispers = new Whispers('seed-f1');
  const field = new WalkField(whispers);
  field.start('Light');
  field.player = { x: 0, z: 2 };
  field.interact(); // monster = fight exit
  const dispatched: { who: string; count: number }[] = [];
  for (let i = 0; i < 20; i += 1) field.update(0.1, 0, 0);
  assert.equal(field.phase, 'result');
  assert.equal(field.lastOutcome, 'defeat');
  // The speech ledger recorded exactly one line for exactly one Dreamweaver.
  const spoken = whispers.spokenLog();
  assert.equal(spoken.length, 1);
  assert.ok(['Light', 'Shadow', 'Ambition'].includes(spoken[0]!.who));
  assert.ok(spoken[0]!.text.length > 0);
  // The whisper layer never blocks: the field keeps advancing while a line is live.
  assert.ok(whispers.active);
  const frames = field.framesAdvanced;
  field.update(0.1, 1, 1);
  assert.ok(field.framesAdvanced > frames);
});

test('whisper queue is non-blocking and drains without timing gates', () => {
  const whispers = new Whispers('seed-f1');
  whispers.say('Shadow', 'first line');
  whispers.say('Light', 'second line');
  assert.equal(whispers.spokenLog().length, 2);
  assert.equal(whispers.blocking, false);
  whispers.dismiss();
  assert.equal(whispers.current, null);
  // Deterministic visual placement: same seed + same utterance → same place.
  const again = new Whispers('seed-f1');
  again.say('Shadow', 'first line');
  assert.deepEqual(whispers.placeOf('Shadow', 0), again.placeOf('Shadow', 0));
});

test('layout jitter is deterministic per seed and keeps exits in their zones', () => {
  const seedLayout = layoutFor('seed-f1', 0);
  const again = layoutFor('seed-f1', 0);
  assert.deepEqual(seedLayout, again);
  // Exits never cross zones: door stays left third, fight center, secret right.
  for (const layout of [layoutFor('a', 0), layoutFor('b', 0), layoutFor('seed-f1', 1), layoutFor('seed-f1', 2)]) {
    const door = layout.find((o) => o.kind === 'door')!;
    const monster = layout.find((o) => o.kind === 'monster')!;
    const chest = layout.find((o) => o.kind === 'chest')!;
    assert.ok(door.x < -2, 'door stays in the left zone');
    assert.ok(Math.abs(monster.x) < 3, 'fight stays center');
    assert.ok(chest.x > 2, 'secret stays right');
    assert.equal(chest.z, 0);
  }
});
