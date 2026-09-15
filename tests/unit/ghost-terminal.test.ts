import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GhostTerminalPhase,
  validateTerminalName,
  type GhostTerminalAction,
} from '../../src/phases/GhostTerminalPhase.js';

test('terminal names accept 1–24 visible characters', () => {
  assert.deepEqual(validateTerminalName('  Jesse  '), { ok: true, value: 'Jesse' });
  assert.equal(validateTerminalName('   ').ok, false);
  assert.equal(validateTerminalName('x'.repeat(25)).ok, false);
  assert.equal(validateTerminalName('Omega\u0000').ok, false);
});

test('player names, answers three questions, and names Omega', () => {
  const actions: GhostTerminalAction[] = [];
  const phase = new GhostTerminalPhase(472, action => actions.push(action));

  assert.equal(phase.snapshot().stage, 'player-name');
  assert.equal(phase.submitPlayerName('Jesse').ok, true);

  for (const owner of ['luminary', 'shadow', 'ambition'] as const) {
    const before = phase.snapshot();
    assert.equal(before.stage, 'choice');
    assert.equal(phase.selectChoice(owner), true);
    assert.equal(phase.selectChoice(owner), false);
    assert.equal(phase.snapshot().awaitingContinue, true);
    assert.equal(phase.continue(), true);
  }

  assert.equal(phase.snapshot().stage, 'omega-name');
  assert.equal(phase.submitOmegaName('Omega').ok, true);
  assert.equal(phase.snapshot().stage, 'complete');
  assert.deepEqual(actions.map(action => action.type), [
    'player.named',
    'terminal.choice.recorded',
    'terminal.choice.recorded',
    'terminal.choice.recorded',
    'omega.named',
  ]);
});

test('terminal never advances a choice without explicit continue', () => {
  const phase = new GhostTerminalPhase(472, () => undefined);
  phase.submitPlayerName('Jesse');
  phase.selectChoice('luminary');

  const before = phase.snapshot();
  phase.update(30);
  assert.deepEqual(phase.snapshot(), before);
});
