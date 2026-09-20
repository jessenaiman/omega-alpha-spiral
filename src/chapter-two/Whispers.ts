import { spawn } from 'node:child_process';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export type Voice = 'Light' | 'Shadow' | 'Ambition';
export interface Spoken { who: Voice; text: string; at: number }

/**
 * Margin whisper layer, announced by game rules, rendered by the scene.
 * Never blocks: no input capture, no pauses, no timers on reading.
 */
export class Whispers {
  private _log: { who: Voice; text: string; at: number; x: number; y: number }[] = [];
  private _queue: { who: Voice; text: string }[] = [];
  private _current: { who: Voice; text: string; enteredAt: number } | null = null;
  private _seed: () => number;
  private _offset: number = 0;
  private _speechJobs: Promise<{ words: { word: string; start: number; end: number }[] } | null>[] = [];

  constructor(seed: string) {
    // Deterministic placement from any seed; the RNG lives in core/random.
    let hash: number = 2166136261;
    for (const char of seed) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
    let state: number = hash >>> 0;
    this._seed = (): number => { state = Math.imul(state ^ (state >>> 15), 2246822507) >>> 0; return state / 4294967296; };
  }

  public say(who: Voice, text: string): void {
    this._log.push({ who, text, at: this._offset, x: this._seed(), y: this._seed() });
    this._queue.push({ who, text });
    this._offset += 1;
    // Spoken stub: routes via local faster-whisper later; today the trigger
    // contract (who, text, order) is the deliverable, failures degrade to text.
    this._speech(() => this._whisperStub(who, text));
    // Multiple rapid lines keep flowing sideways, never stacked over gameplay.
    if (this._queue.length > 3) this._queue.shift();
  }

  /** Placeholder spoken-pipeline call; never blocks, never throws gameplay-side. */
  private async _whisperStub(who: Voice, text: string): Promise<{ words: { word: string; start: number; end: number }[] } | null> {
    // TODO(issue #37): invoke local faster-whisper with real Dreamweaver audio.
    // The CLI wrapper in scripts/ below owns this; browsers queue, node resolves.
    return null;
  }

  private _speech(job: () => Promise<{ words: { word: string; start: number; end: number }[] } | null>): void {
    const entry: Promise<{ words: { word: string; start: number; end: number }[] } | null> = job().catch((): null => null);
    this._speechJobs.push(entry);
  }

  public async spokenWords(): Promise<{ words: { word: string; start: number; end: number }[] }[]> {
    const jobs = this._speechJobs;
    this._speechJobs = [];
    const results = (await Promise.all(jobs)).filter((entry): entry is { words: { word: string; start: number; end: number }[] } => entry !== null);
    return results;
  }

  public announce(when: number): void {
    if (this._current || !this._queue.length) return;
    const next = this._queue.shift()!;
    this._current = { ...next, enteredAt: when };
  }

  public tick(now: number): void {
    // Lines decay on their own; reading is never cut short by another input.
    if (this._current && now - this._current.enteredAt > 9_000 && this._queue.length === 0) this._current = null;
  }

  public dismiss(): void { this._queue = []; this._current = null; }

  public get current(): { who: Voice; text: string } | null { return this._current; }
  public get queue(): number { return this._queue.length; }
  public get active(): boolean { return this._current !== null || this._queue.length > 0; }
  public get blocking(): boolean { return false; } // structurally non-blocking
  public placeOf(who: Voice, index: number): { x: number; y: number } {
    const entry = this._log.filter((line): boolean => line.who === who)[index];
    return entry ? { x: entry.x, y: entry.y } : { x: 0, y: 0 };
  }
  public spokenLog(): { who: Voice; text: string; position: { x: number; y: number } }[] {
    return this._log.map((entry): { who: Voice; text: string; position: { x: number; y: number } } => ({ who: entry.who, text: entry.text, position: { x: entry.x, y: entry.y } }));
  }
}
