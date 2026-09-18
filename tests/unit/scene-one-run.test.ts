import assert from 'node:assert/strict';
import { test } from 'node:test';

import { beginRun, reduceRun, nextSpeaker } from '../../src/game';
import type { Dreamweaver, RunState } from '../../src/game';

const CONFIG = {
  openingQuestion: 'omega.opening',
  closingQuestion: 'omega.name',
  dreamweaverQuestions: ['dw.a', 'dw.b', 'dw.c', 'dw.d', 'dw.e'],
} as const;

interface Walk {
  readonly state: RunState;
  readonly rotation: readonly Dreamweaver[];
  readonly questionOrder: readonly string[];
  readonly asked: readonly string[];
  readonly rungs: readonly string[];
}

/** Walk a whole run with the same adversarial picks every time. */
function walk(seed: string, picks: readonly Dreamweaver[]): Walk {
  let run = beginRun({ ...CONFIG, seed });
  const asked: string[] = [];
  const rungs: string[] = [run.state.rung];
  if (run.state.question) asked.push(run.state.question);

  let index = 0;
  while (run.state.phase !== 'omega-last') {
    const pick = picks[index % picks.length] as Dreamweaver;
    index += 1;
    run = reduceRun(run.state, { type: 'choose', optionOwner: pick });
    for (const event of run.events) {
      if (event.type === 'question.ask') asked.push(event.questionId);
    }
    rungs.push(run.state.rung);
  }

  run = reduceRun(run.state, { type: 'name', value: 'Wren' });
  return {
    state: run.state,
    rotation: run.state.rotation,
    questionOrder: run.state.questionOrder,
    asked,
    rungs,
  };
}

const ADVERSARIAL: readonly Dreamweaver[] = ['light', 'light', 'light', 'light'];

test('the same seed and the same inputs reproduce the rotation and the question order', () => {
  const first = walk('ghost-472', ADVERSARIAL);
  const second = walk('ghost-472', ADVERSARIAL);
  assert.deepEqual(first.rotation, second.rotation);
  assert.deepEqual(first.questionOrder, second.questionOrder);
  assert.deepEqual(first.asked, second.asked);
  assert.deepEqual([...first.rotation], ['light', 'shadow', 'ambition']);
});

test('a different seed draws a different question order', () => {
  const orders = new Set(
    ['ghost-472', 'ghost-473', 'ghost-474', 'ghost-475', 'ghost-476'].map(seed =>
      walk(seed, ADVERSARIAL).questionOrder.join(','),
    ),
  );
  assert.ok(orders.size > 1, 'the draw is seeded, not fixed');
});

test('every seed draws from the authored pool without repeating an id', () => {
  for (const seed of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
    const order = walk(seed, ADVERSARIAL).questionOrder;
    assert.equal(order.length, 3);
    assert.equal(new Set(order).size, 3);
    for (const id of order) assert.ok(CONFIG.dreamweaverQuestions.includes(id as never));
  }
});

test('the scene ends with the closing question and attaches a pairing', () => {
  const result = walk('ghost-472', ADVERSARIAL);
  assert.equal(result.state.phase, 'complete');
  assert.equal(result.state.playerName, 'Wren');
  assert.equal(result.state.pairing, 'light');
  assert.equal(result.state.question, null);
  assert.deepEqual(
    [...result.asked],
    ['omega.opening', ...result.questionOrder, 'omega.name'],
  );
});

test('the ladder never regresses across a whole run', () => {
  const order = ['dot', 'line', 'box', 'icon'];
  const rungs = walk('ghost-472', ADVERSARIAL).rungs;
  let previous = 0;
  for (const rung of rungs) {
    const index = order.indexOf(rung);
    assert.ok(index >= previous, `ladder regressed at ${rung}`);
    previous = index;
  }
  assert.equal(rungs.at(-1), 'icon');
});

test('every Dreamweaver speaks exactly once whatever the picks are', () => {
  const sequences: readonly (readonly Dreamweaver[])[] = [
    ['light', 'light', 'light', 'light'],
    ['ambition', 'shadow', 'light', 'ambition'],
    ['shadow', 'ambition', 'ambition', 'shadow'],
    ['ambition', 'ambition', 'ambition', 'ambition'],
  ];
  for (const picks of sequences) {
    const rotation = walk('ghost-472', picks).rotation;
    assert.deepEqual([...rotation].sort(), ['ambition', 'light', 'shadow']);
    assert.equal(rotation.length, new Set(rotation).size);
  }
});

test('a choice that names a Dreamweaver who already spoke still ends the scene', () => {
  // Every beat tries to hand the turn back to the first speaker.
  let run = beginRun({ ...CONFIG, seed: 'loop-guard' });
  run = reduceRun(run.state, { type: 'choose', optionOwner: 'light' });
  run = reduceRun(run.state, { type: 'choose', optionOwner: 'light' });
  assert.equal(run.state.speaker, 'shadow');
  run = reduceRun(run.state, { type: 'choose', optionOwner: 'light' });
  assert.equal(run.state.speaker, 'ambition');
  run = reduceRun(run.state, { type: 'choose', optionOwner: 'light' });
  assert.equal(run.state.phase, 'omega-last');
  assert.equal(nextSpeaker('light', run.state.spoken), null);
});

test('the run refuses an action it cannot accept', () => {
  const run = beginRun({ ...CONFIG, seed: 'guards' });
  assert.throws(() => reduceRun(run.state, { type: 'name', value: 'Wren' }), /closing question/);
  let midway = reduceRun(run.state, { type: 'choose', optionOwner: 'light' });
  midway = reduceRun(midway.state, { type: 'choose', optionOwner: 'light' });
  midway = reduceRun(midway.state, { type: 'choose', optionOwner: 'light' });
  midway = reduceRun(midway.state, { type: 'choose', optionOwner: 'light' });
  assert.throws(
    () => reduceRun(midway.state, { type: 'choose', optionOwner: 'light' }),
    /answered with a name/,
  );
  assert.throws(() => reduceRun(midway.state, { type: 'name', value: '   ' }), /needs a name/);
  const done = reduceRun(midway.state, { type: 'name', value: 'Wren' });
  assert.throws(() => reduceRun(done.state, { type: 'choose', optionOwner: 'light' }), /complete/);
});

test('an all-zero affinity attaches nobody', () => {
  // No Dreamweaver question is ever answered, so no affinity accrues.
  const zeroed = { ...beginRun({ ...CONFIG, seed: 'zero' }).state, phase: 'omega-last' as const };
  const done = reduceRun(zeroed, { type: 'name', value: 'Wren' });
  assert.equal(done.state.pairing, null);
});
