import { createBootFrames, createStoryBeat, type BootFrame } from './ghostwriting';

export const FORMATION_DURATION_MS: number = 300_000;
// The asset's study timeline is not the runtime duration.
const FINAL_REVEAL_MS: number = 3000;
const EARLY_FORMATION_RATE: number = 3;
const CAMERA_START_Z: number = 10;
const CAMERA_END_Z: number = -4;
const WALK_SPEED: number = 2.8;

/** Story time is player-gated; ambient time lets the waiting cursor breathe. */
export class StoryController {
  private _frames: BootFrame[];
  private _index: number = 0;
  private _isStarted: boolean = false;
  private _seed: string;
  private _doorPhase: BootFrame['phase'] | null = null;
  private _revealElapsed: number = 0;
  private _revealStart: number | null = null;
  public sceneIndex: number = 0;
  public answers: string[] = [];
  public thread: string = '';
  public cameraZ: number = CAMERA_START_Z;
  public elapsedMs: number = 0;
  public ambientMs: number = 0;
  public formationMs: number = 0;

  constructor(seed: string) {
    this._seed = seed;
    this._frames = createBootFrames(seed);
  }

  public get frame(): BootFrame {
    const frame: BootFrame = this._frames[this._index];
    return this._doorPhase ? { ...frame, phase: this._doorPhase } : frame;
  }

  public get isStarted(): boolean { return this._isStarted; }
  public start(): void { this._isStarted = true; }

  public choose(index: number): boolean {
    if (this.frame.phase !== 'waiting' || !this.frame.options[index]) return false;
    const previous: BootFrame = this.frame;
    const beat = createStoryBeat(this._seed, this.sceneIndex, index, this.answers, this.elapsedMs, 1, previous.prelude, previous.question, previous.showSymbols);
    this.answers.push(beat.owner);
    this.thread = beat.thread;
    this.sceneIndex = beat.nextSceneIndex;
    this._frames = [{ ...previous, at: this.elapsedMs, phase: 'writing', options: [], question: '', transcript: '' }, ...beat.frames];
    this._index = 0;
    return true;
  }

  public enterDoor(): boolean {
    if (this.frame.phase !== 'doorway') return false;
    this._doorPhase = 'crossing';
    return true;
  }

  public reset(): void {
    this._frames = createBootFrames(this._seed);
    this._index = 0;
    this._isStarted = false;
    this._doorPhase = null;
    this._revealElapsed = 0;
    this._revealStart = null;
    this.sceneIndex = 0;
    this.answers = [];
    this.thread = '';
    this.elapsedMs = 0;
    this.ambientMs = 0;
    this.formationMs = 0;
    this.cameraZ = CAMERA_START_Z;
  }

  public advance(deltaMs: number): void {
    if (!Number.isFinite(deltaMs) || deltaMs <= 0) return;
    this.ambientMs += deltaMs;
    if (!this._isStarted || this.frame.phase === 'waiting') return;
    if (this._doorPhase === 'crossing') {
      this.cameraZ = Math.max(CAMERA_END_Z, this.cameraZ - deltaMs / 1000 * WALK_SPEED);
      if (this.cameraZ === CAMERA_END_Z) this._doorPhase = 'complete';
      return;
    }
    if (this._doorPhase) return;
    if (this.frame.phase === 'final') {
      this._revealStart ??= this.formationMs;
      this._revealElapsed = Math.min(FINAL_REVEAL_MS, this._revealElapsed + deltaMs);
      this.formationMs = this._revealStart + (FORMATION_DURATION_MS - this._revealStart) * this._revealElapsed / FINAL_REVEAL_MS;
      if (this._revealElapsed === FINAL_REVEAL_MS) this._doorPhase = 'doorway';
      return;
    }
    const end: number = this._frames[this._frames.length - 1].at;
    const next: number = Math.min(this.elapsedMs + deltaMs, end);
    // The final reveal cannot happen before the final authored line has played.
    this.formationMs = Math.min(FORMATION_DURATION_MS * 0.88, this.formationMs + (next - this.elapsedMs) * EARLY_FORMATION_RATE);
    this.elapsedMs = next;
    while (this._index + 1 < this._frames.length && this._frames[this._index + 1].at <= next) this._index += 1;
  }
}
