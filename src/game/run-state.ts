import type { GameAction, Lineage, PhaseId, RunState } from './types.js';

export const createRunState = (seed: number, lineage: Lineage): RunState => ({
  seed,
  baseInstanceId: lineage.baseInstanceId,
  loopCount: lineage.loopCount,
  displayInstance: lineage.baseInstanceId + lineage.loopCount,
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

const actionPhases: Record<GameAction['type'], PhaseId> = {
  'player.named': 'ghost',
  'terminal.choice.recorded': 'ghost',
  'omega.named': 'ghost',
  'landmark.completed': 'exploration',
  'encounter.completed': 'action',
  'companion.added': 'formation',
  'party.test.completed': 'formation',
  'route.committed': 'fracture',
  'fracture.objective.completed': 'fracture',
  'dreamweaver.paired': 'threshold',
  'bridge.completed': 'threshold',
  'loop.reset': 'collapse',
};

const phaseFor = (state: RunState): PhaseId => {
  if (state.phase === 'ghost' && state.playerName && state.omegaName && Object.keys(state.progress.terminalAnswers).length === 3) return 'exploration';
  if (state.phase === 'exploration' && state.progress.landmarks.length === 3) return 'action';
  if (state.phase === 'action' && state.progress.encounters.length === 3) return 'formation';
  if (state.phase === 'formation' && state.party.length === 3 && state.partyTested) return 'fracture';
  if (state.phase === 'fracture' && state.route && state.progress.fractureObjectives === 3) return 'threshold';
  if (state.phase === 'threshold' && state.pairedDreamweaver) return state.phase;
  return state.phase;
};

const applyPhaseGate = (state: RunState): RunState => {
  const phase = phaseFor(state);
  return phase === state.phase
    ? state
    : { ...state, phase, era: phase, checkpoint: phase };
};

export const reduceRun = (state: RunState, action: GameAction): RunState => {
  if (actionPhases[action.type] !== state.phase) {
    throw new Error(`Invalid action ${action.type} during ${state.phase}`);
  }

  let next: RunState;

  switch (action.type) {
    case 'player.named':
      next = { ...state, playerName: action.name };
      break;
    case 'terminal.choice.recorded': {
      if (state.progress.terminalAnswers[action.question]) {
        throw new Error(`Question ${action.question} already answered`);
      }
      next = {
        ...state,
        affinity: {
          ...state.affinity,
          [action.dreamweaver]: state.affinity[action.dreamweaver] + 1,
        },
        progress: {
          ...state.progress,
          terminalAnswers: {
            ...state.progress.terminalAnswers,
            [action.question]: action.dreamweaver,
          },
        },
      };
      break;
    }
    case 'omega.named':
      next = { ...state, omegaName: action.name };
      break;
    case 'landmark.completed':
      next = state.progress.landmarks.includes(action.landmark)
        ? state
        : {
            ...state,
            progress: {
              ...state.progress,
              landmarks: [...state.progress.landmarks, action.landmark],
            },
          };
      break;
    case 'encounter.completed':
      next = state.progress.encounters.includes(action.encounter)
        ? state
        : {
            ...state,
            progress: {
              ...state.progress,
              encounters: [...state.progress.encounters, action.encounter],
            },
          };
      break;
    case 'companion.added':
      if (state.party.includes(action.role)) {
        next = state;
      } else {
        if (state.party.length === 3) throw new Error('Party already has three companions');
        next = { ...state, party: [...state.party, action.role] };
      }
      break;
    case 'party.test.completed':
      next = { ...state, partyTested: true };
      break;
    case 'route.committed':
      next = { ...state, route: state.route ?? action.route };
      break;
    case 'fracture.objective.completed':
      next = {
        ...state,
        progress: {
          ...state.progress,
          fractureObjectives: Math.min(3, state.progress.fractureObjectives + 1),
        },
      };
      break;
    case 'dreamweaver.paired':
      next = { ...state, pairedDreamweaver: state.pairedDreamweaver ?? action.dreamweaver };
      break;
    case 'bridge.completed':
      if (!state.pairedDreamweaver) throw new Error('Bridge requires a paired Dreamweaver');
      return { ...state, phase: 'collapse', era: 'collapse', checkpoint: 'collapse' };
    case 'loop.reset':
      return createRunState(state.seed, {
        baseInstanceId: state.baseInstanceId,
        loopCount: state.loopCount + 1,
      });
  }

  return applyPhaseGate(next);
};
