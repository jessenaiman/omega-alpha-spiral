import {
  TERMINAL_COPY,
  TERMINAL_QUESTIONS,
  type DreamweaverId,
  type TerminalQuestion,
  type TerminalQuestionId,
} from '../content/script.js';

export type GhostTerminalAction =
  | { type: 'player.named'; name: string }
  | { type: 'terminal.choice.recorded'; question: TerminalQuestionId; dreamweaver: DreamweaverId }
  | { type: 'omega.named'; name: string };

export type GhostTerminalStage = 'player-name' | 'choice' | 'omega-name' | 'complete';

export interface GhostTerminalSnapshot {
  readonly instance: number;
  readonly stage: GhostTerminalStage;
  readonly playerName: string;
  readonly omegaName: string;
  readonly question: TerminalQuestion | null;
  readonly questionIndex: number;
  readonly awaitingContinue: boolean;
  readonly response: string | null;
  readonly selectedOwner: DreamweaverId | null;
}

export type NameResult = { readonly ok: true; readonly value: string } | { readonly ok: false; readonly error: string };

const INVALID_NAME = 'Enter 1–24 visible characters.';

export function validateTerminalName(input: string): NameResult {
  const value = input.trim().replace(/\s+/gu, ' ');
  const characters = Array.from(value);
  if (characters.length < 1 || characters.length > 24 || /[\p{Cc}\p{Cf}]/u.test(value)) {
    return { ok: false, error: INVALID_NAME };
  }
  return { ok: true, value };
}

export class GhostTerminalPhase {
  private stage: GhostTerminalStage = 'player-name';
  private playerName = '';
  private omegaName = '';
  private questionIndex = 0;
  private awaitingContinue = false;
  private response: string | null = null;
  private selectedOwner: DreamweaverId | null = null;
  private readonly listeners = new Set<(snapshot: GhostTerminalSnapshot) => void>();

  constructor(
    private readonly instance: number,
    private readonly commit: (action: GhostTerminalAction) => void,
  ) {}

  snapshot(): GhostTerminalSnapshot {
    return {
      instance: this.instance,
      stage: this.stage,
      playerName: this.playerName,
      omegaName: this.omegaName,
      question: this.stage === 'choice' ? TERMINAL_QUESTIONS[this.questionIndex] ?? null : null,
      questionIndex: this.questionIndex,
      awaitingContinue: this.awaitingContinue,
      response: this.response,
      selectedOwner: this.selectedOwner,
    };
  }

  subscribe(listener: (snapshot: GhostTerminalSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  submitPlayerName(input: string): NameResult {
    if (this.stage !== 'player-name') return { ok: false, error: 'Player name is already committed.' };
    const result = validateTerminalName(input);
    if (!result.ok) return result;
    this.playerName = result.value;
    this.stage = 'choice';
    this.commit({ type: 'player.named', name: result.value });
    this.publish();
    return result;
  }

  selectChoice(owner: DreamweaverId): boolean {
    if (this.stage !== 'choice' || this.awaitingContinue) return false;
    const question = TERMINAL_QUESTIONS[this.questionIndex];
    const choice = question?.choices.find(candidate => candidate.owner === owner);
    if (!question || !choice) return false;
    this.awaitingContinue = true;
    this.response = choice.response;
    this.selectedOwner = owner;
    this.commit({ type: 'terminal.choice.recorded', question: question.id, dreamweaver: owner });
    this.publish();
    return true;
  }

  continue(): boolean {
    if (this.stage !== 'choice' || !this.awaitingContinue) return false;
    this.awaitingContinue = false;
    this.response = null;
    this.selectedOwner = null;
    this.questionIndex += 1;
    if (this.questionIndex >= TERMINAL_QUESTIONS.length) this.stage = 'omega-name';
    this.publish();
    return true;
  }

  submitOmegaName(input: string): NameResult {
    if (this.stage !== 'omega-name') return { ok: false, error: 'Omega cannot be named yet.' };
    const result = validateTerminalName(input);
    if (!result.ok) return result;
    this.omegaName = result.value;
    this.stage = 'complete';
    this.commit({ type: 'omega.named', name: result.value });
    this.publish();
    return result;
  }

  update(_elapsedSeconds: number): void {
    // Reading and choices never advance on timers.
  }

  completeCopy(): string {
    return TERMINAL_COPY.complete;
  }

  private publish(): void {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) listener(snapshot);
  }
}
