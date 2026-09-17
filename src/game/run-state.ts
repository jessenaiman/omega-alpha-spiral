/**
 * Run state — the pure rules, driven by one action at a time.
 *
 * Pure: no DOM, no Three.js, no browser, no clock, no randomness beyond the
 * seeded draw made at run creation. A caller hands in an action and receives the
 * next state plus the typed events that beat produced.
 *
 * Scene 1's shape, fixed by `t3`/`t4`:
 *   Omega asks first. The chosen option names the next Dreamweaver. That
 *   Dreamweaver asks, and its answered choice names the next — unless that
 *   Dreamweaver has already spoken, in which case the turn passes to the next
 *   Dreamweaver who has not, in canonical order. When all three have spoken,
 *   Omega asks the closing question. No Dreamweaver gets more than one turn.
 */

import type { SceneEvent, SceneSpeaker } from '../core/events';
import { createRng, normalizeSeed } from '../core/random';
import { DREAMWEAVER_ORDER, emptyAffinity, leader, scoreChoice } from './affinity';
import type { Affinity, Dreamweaver } from './affinity';
import { advanceLadderStep, rungFor } from './ladder';
import type { Rung } from './ladder';
import { nextSpeaker } from './sequence';

export type ScenePhase = 'omega-first' | 'dreamweaver-turn' | 'omega-last' | 'complete';

export interface RunState {
  readonly seed: string;
  /** The loop number: the pass through the scene. Rises each replay. */
  readonly echo: number;
  readonly phase: ScenePhase;
  readonly speaker: SceneSpeaker;
  /** The question being asked right now, or `null` while the run is complete. */
  readonly question: string | null;
  /** The seeded draw of Dreamweaver questions for this run. */
  readonly questionOrder: readonly string[];
  readonly questionIndex: number;
  /** Omega's closing question. Owned by content and injected at creation. */
  readonly closingQuestion: string;
  readonly affinity: Affinity;
  /** Dreamweavers who have already taken their turn, in the order they spoke. */
  readonly spoken: readonly Dreamweaver[];
  /** The same order, kept explicitly so a run can be diffed for determinism. */
  readonly rotation: readonly Dreamweaver[];
  readonly ladderStep: number;
  readonly rung: Rung;
  readonly beats: number;
  readonly playerName: string | null;
  readonly pairing: Dreamweaver | null;
}

export interface RunConfig {
  readonly seed: string | number;
  /** Defaults to 1: the first pass. */
  readonly echo?: number;
  /** Omega's opening question id. */
  readonly openingQuestion: string;
  /** Omega's closing question id — the one that asks for the player's name. */
  readonly closingQuestion: string;
  /**
   * Authored Dreamweaver question ids. Three are drawn from these, seeded, for
   * this run's three Dreamweaver turns.
   */
  readonly dreamweaverQuestions: readonly string[];
}

export type RunAction =
  | { readonly type: 'choose'; readonly optionOwner: Dreamweaver }
  | { readonly type: 'name'; readonly value: string };

export interface RunTransition {
  readonly state: RunState;
  readonly events: readonly SceneEvent[];
}

/** Create a run and the two events that start it. */
export function beginRun(config: RunConfig): RunTransition {
  if (config.dreamweaverQuestions.length < DREAMWEAVER_ORDER.length) {
    throw new Error(
      `a run needs at least ${DREAMWEAVER_ORDER.length} Dreamweaver questions, received ${config.dreamweaverQuestions.length}`,
    );
  }

  const seed = normalizeSeed(config.seed);
  const questionOrder = createRng(seed)
    .fork('question-draw')
    .shuffle(config.dreamweaverQuestions)
    .slice(0, DREAMWEAVER_ORDER.length);

  const state: RunState = {
    seed,
    echo: config.echo ?? 1,
    phase: 'omega-first',
    speaker: 'omega',
    question: config.openingQuestion,
    questionOrder,
    questionIndex: 0,
    closingQuestion: config.closingQuestion,
    affinity: emptyAffinity(),
    spoken: [],
    rotation: [],
    ladderStep: 0,
    rung: rungFor(0),
    beats: 0,
    playerName: null,
    pairing: null,
  };

  return {
    state,
    events: [
      { type: 'run.begin', seed, echo: state.echo },
      {
        type: 'question.ask',
        speaker: 'omega',
        questionId: config.openingQuestion,
        rung: state.rung,
      },
    ],
  };
}

function requireDreamweaver(speaker: SceneSpeaker): Dreamweaver {
  if (speaker === 'omega') {
    throw new Error('Omega is not a Dreamweaver and owns no turn');
  }
  return speaker;
}

/** Apply one committed action. Throws on an action the run cannot accept. */
export function reduceRun(state: RunState, action: RunAction): RunTransition {
  if (state.phase === 'complete') {
    throw new Error('the run is complete; no further action is accepted');
  }

  if (action.type === 'name') {
    if (state.phase !== 'omega-last') {
      throw new Error('a name is only given in answer to the closing question');
    }
    const value = action.value.trim();
    if (value.length === 0) {
      throw new Error('the closing question needs a name');
    }
    const pairing = leader(state.affinity);
    return {
      state: {
        ...state,
        phase: 'complete',
        question: null,
        beats: state.beats + 1,
        playerName: value,
        pairing,
      },
      events: [
        { type: 'name.submit', value },
        { type: 'run.complete', pairing, rotation: state.rotation },
      ],
    };
  }

  if (state.phase === 'omega-last') {
    throw new Error("Omega's closing question is answered with a name, not a choice");
  }

  const events: SceneEvent[] = [];
  const represented: Dreamweaver =
    state.speaker === 'omega' ? action.optionOwner : requireDreamweaver(state.speaker);
  const chosen: Dreamweaver | null = state.speaker === 'omega' ? null : action.optionOwner;
  const affinity = scoreChoice(state.affinity, represented, chosen);

  events.push({ type: 'choice.commit', speaker: state.speaker, optionOwner: action.optionOwner });
  events.push({ type: 'affinity.change', affinity });

  const ladderStep = advanceLadderStep(state.ladderStep);
  const rung = rungFor(ladderStep);
  if (rung !== state.rung) events.push({ type: 'ladder.advance', step: ladderStep, rung });

  let spoken = state.spoken;
  let rotation = state.rotation;
  if (state.phase === 'dreamweaver-turn') {
    const finished = requireDreamweaver(state.speaker);
    spoken = [...spoken, finished];
    rotation = [...rotation, finished];
    events.push({ type: 'dreamweaver.carrier', dreamweaver: finished });
  }

  const next = nextSpeaker(action.optionOwner, spoken);

  if (next === null) {
    events.push({
      type: 'question.ask',
      speaker: 'omega',
      questionId: state.closingQuestion,
      rung,
    });
    return {
      state: {
        ...state,
        phase: 'omega-last',
        speaker: 'omega',
        question: state.closingQuestion,
        affinity,
        spoken,
        rotation,
        ladderStep,
        rung,
        beats: state.beats + 1,
      },
      events,
    };
  }

  const question = state.questionOrder[state.questionIndex];
  if (question === undefined) {
    throw new Error('the seeded question draw ran out before the turns did');
  }
  events.push({ type: 'dreamweaver.ask-to-speak', dreamweaver: next });
  events.push({ type: 'question.ask', speaker: next, questionId: question, rung });

  return {
    state: {
      ...state,
      phase: 'dreamweaver-turn',
      speaker: next,
      question,
      questionIndex: state.questionIndex + 1,
      affinity,
      spoken,
      rotation,
      ladderStep,
      rung,
      beats: state.beats + 1,
    },
    events,
  };
}
