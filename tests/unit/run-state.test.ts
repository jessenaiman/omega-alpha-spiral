import assert from 'node:assert/strict';
import test from 'node:test';
import { createSeededRandom } from '../../src/core/random.js';
import { createRunState, reduceRun } from '../../src/game/run-state.js';
import type { GameAction, RunState } from '../../src/game/types.js';

const apply = (state: RunState, actions: GameAction[]): RunState =>
  actions.reduce(reduceRun, state);

test('seeded randomness reproduces the same sequence', () => {
  const first = createSeededRandom(42);
  const second = createSeededRandom(42);
  const sequence = [first(), first(), first()];

  assert.deepEqual(sequence, [second(), second(), second()]);
  assert.ok(sequence.every((value) => value >= 0 && value < 1));
});

test('a new run contains only its lineage and initial narrative state', () => {
  assert.deepEqual(createRunState(42, { baseInstanceId: 472, loopCount: 7 }), {
    seed: 42,
    baseInstanceId: 472,
    loopCount: 7,
    displayInstance: 479,
    phase: 'ghost',
    era: 'ghost',
    checkpoint: 'ghost',
    playerName: '',
    omegaName: '',
    affinity: { luminary: 0, shadow: 0, ambition: 0 },
    party: [],
    partyTested: false,
    route: null,
    pairedDreamweaver: null,
    progress: {
      terminalAnswers: {},
      landmarks: [],
      encounters: [],
      fractureObjectives: 0,
    },
  });
});

test('three choices and both names advance Ghost Terminal', () => {
  let state = createRunState(42, { baseInstanceId: 472, loopCount: 0 });
  state = reduceRun(state, { type: 'player.named', name: 'Jesse' });
  state = reduceRun(state, { type: 'terminal.choice.recorded', question: 'story', dreamweaver: 'luminary' });
  state = reduceRun(state, { type: 'terminal.choice.recorded', question: 'role', dreamweaver: 'shadow' });
  state = reduceRun(state, { type: 'terminal.choice.recorded', question: 'name', dreamweaver: 'ambition' });
  state = reduceRun(state, { type: 'omega.named', name: 'Omega' });
  assert.equal(state.phase, 'exploration');
  assert.equal(state.era, 'exploration');
  assert.deepEqual(state.affinity, { luminary: 1, shadow: 1, ambition: 1 });
});

test('a terminal question cannot be counted twice', () => {
  const initial = createRunState(42, { baseInstanceId: 472, loopCount: 0 });
  const answered = reduceRun(initial, { type: 'terminal.choice.recorded', question: 'story', dreamweaver: 'luminary' });
  assert.throws(
    () => reduceRun(answered, { type: 'terminal.choice.recorded', question: 'story', dreamweaver: 'shadow' }),
    /Question story already answered/,
  );
  assert.deepEqual(answered.affinity, { luminary: 1, shadow: 0, ambition: 0 });
});

test('progress gates advance through exploration, action, and formation', () => {
  const ghost = createRunState(42, { baseInstanceId: 472, loopCount: 0 });
  const exploration = apply(ghost, [
    { type: 'player.named', name: 'Jesse' },
    { type: 'terminal.choice.recorded', question: 'story', dreamweaver: 'luminary' },
    { type: 'terminal.choice.recorded', question: 'role', dreamweaver: 'shadow' },
    { type: 'terminal.choice.recorded', question: 'name', dreamweaver: 'ambition' },
    { type: 'omega.named', name: 'Omega' },
  ]);
  const action = apply(exploration, [
    { type: 'landmark.completed', landmark: 'archive' },
    { type: 'landmark.completed', landmark: 'refuge' },
    { type: 'landmark.completed', landmark: 'gate' },
  ]);
  const formation = apply(action, [
    { type: 'encounter.completed', encounter: 'first-sweep' },
    { type: 'encounter.completed', encounter: 'shard-route' },
    { type: 'encounter.completed', encounter: 'archive-crossing' },
  ]);
  const fracture = apply(formation, [
    { type: 'companion.added', role: 'fighter' },
    { type: 'companion.added', role: 'scribe' },
    { type: 'companion.added', role: 'thief' },
    { type: 'party.test.completed' },
  ]);

  assert.equal(action.phase, 'action');
  assert.equal(formation.phase, 'formation');
  assert.equal(fracture.phase, 'fracture');
  assert.equal(fracture.era, 'fracture');
});

test('set-like progress remains unique and party is capped at three', () => {
  const exploration = { ...createRunState(42, { baseInstanceId: 472, loopCount: 0 }), phase: 'exploration' as const, era: 'exploration' as const };
  const landmark = reduceRun(exploration, { type: 'landmark.completed', landmark: 'archive' });
  assert.deepEqual(reduceRun(landmark, { type: 'landmark.completed', landmark: 'archive' }).progress.landmarks, ['archive']);

  const action = { ...landmark, phase: 'action' as const, era: 'action' as const };
  const encounter = reduceRun(action, { type: 'encounter.completed', encounter: 'first-sweep' });
  assert.deepEqual(reduceRun(encounter, { type: 'encounter.completed', encounter: 'first-sweep' }).progress.encounters, ['first-sweep']);

  const formation = { ...encounter, phase: 'formation' as const, era: 'formation' as const };
  const party = apply(formation, [
    { type: 'companion.added', role: 'fighter' },
    { type: 'companion.added', role: 'fighter' },
    { type: 'companion.added', role: 'scribe' },
    { type: 'companion.added', role: 'thief' },
  ]);
  assert.deepEqual(party.party, ['fighter', 'scribe', 'thief']);
  assert.throws(() => reduceRun(party, { type: 'companion.added', role: 'weaver' }), /Party already has three companions/);
});

test('fracture objectives require a committed route and open threshold at three', () => {
  const fracture = { ...createRunState(42, { baseInstanceId: 472, loopCount: 0 }), phase: 'fracture' as const, era: 'fracture' as const };
  const withoutRoute = apply(fracture, [
    { type: 'fracture.objective.completed' },
    { type: 'fracture.objective.completed' },
    { type: 'fracture.objective.completed' },
  ]);
  assert.equal(withoutRoute.phase, 'fracture');

  const threshold = reduceRun(withoutRoute, { type: 'route.committed', route: 'memory' });
  assert.equal(threshold.phase, 'threshold');
  assert.equal(threshold.progress.fractureObjectives, 3);
});

test('bridge completion requires a threshold pairing', () => {
  const threshold = { ...createRunState(42, { baseInstanceId: 472, loopCount: 0 }), phase: 'threshold' as const, era: 'threshold' as const };
  assert.throws(() => reduceRun(threshold, { type: 'bridge.completed' }), /Bridge requires a paired Dreamweaver/);

  const paired = reduceRun(threshold, { type: 'dreamweaver.paired', dreamweaver: 'shadow' });
  const collapsed = reduceRun(paired, { type: 'bridge.completed' });
  assert.equal(collapsed.phase, 'collapse');
  assert.equal(collapsed.era, 'collapse');
});

test('actions are rejected outside their owning phase', () => {
  const state = createRunState(42, { baseInstanceId: 472, loopCount: 0 });
  assert.throws(
    () => reduceRun(state, { type: 'landmark.completed', landmark: 'archive' }),
    /Invalid action landmark.completed during ghost/,
  );
});

test('reducer updates do not mutate the prior state', () => {
  const initial = createRunState(42, { baseInstanceId: 472, loopCount: 0 });
  const next = reduceRun(initial, { type: 'terminal.choice.recorded', question: 'story', dreamweaver: 'luminary' });

  assert.notEqual(next, initial);
  assert.deepEqual(initial.progress.terminalAnswers, {});
  assert.deepEqual(initial.affinity, { luminary: 0, shadow: 0, ambition: 0 });
});

test('collapse resets narrative state and only increments loop', () => {
  const initial = createRunState(42, { baseInstanceId: 472, loopCount: 7 });
  const paired = { ...initial, phase: 'collapse' as const, era: 'collapse' as const, playerName: 'Jesse', party: ['fighter' as const] };
  const next = reduceRun(paired, { type: 'loop.reset' });
  assert.equal(next.seed, 42);
  assert.equal(next.baseInstanceId, 472);
  assert.equal(next.loopCount, 8);
  assert.equal(next.displayInstance, 480);
  assert.equal(next.phase, 'ghost');
  assert.equal(next.playerName, '');
  assert.deepEqual(next.party, []);
});
