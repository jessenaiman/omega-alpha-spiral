import { createRng } from '../core/random';
import { CHRONICLE_OPENING_LOG, CHRONICLE_QUESTIONS, CHRONICLE_SYMBOLS } from './chronicle';

export interface BootFrame {
  at: number;
  prelude: string;
  question: string;
  transcript: string;
  choices: readonly string[];
  isCorrupt: boolean;
  phase: 'cursor' | 'command' | 'loading' | 'writing' | 'waiting' | 'prelude' | 'question' | 'response' | 'final' | 'complete';
  format: number;
  phaseElapsedMs?: number;
  hint?: string;
}

const FIRST_INK_MS: number = 1800;
const LETTER_MIN_MS: number = 85;
const LETTER_RANGE_MS: number = 100;
const ERASURE_MS: number = 65;
const CORRECTION_PAUSE_MS: number = 950;
export const BOOT_COMMAND: string = '/run omega.sh';
export const BOOT_OPTIONS: string[] = CHRONICLE_QUESTIONS[0].choices.map((option): string => option.text);
export const BOOT_SYMBOLS: string = CHRONICLE_SYMBOLS;
const QUESTION_SOURCE: string = 'If you could [hear|be] only one story..:\n[what|who] would [it|you] be?';

/** Materialize timing once: render rate must not change the spelling or pauses. */
export function createBootFrames(seed: string): BootFrame[] {
  const random = createRng(seed).fork('ghostwriting');
  const text: Record<'prelude' | 'question' | 'transcript', string> = { prelude: '', question: '', transcript: '' };
  let phase: BootFrame['phase'] = 'cursor';
  let format: number = 0;
  const choices: readonly string[] = BOOT_OPTIONS;
  const frames: BootFrame[] = [{ at: 0, ...text, choices, isCorrupt: false, phase, format }];
  let at: number = FIRST_INK_MS;
  const record = (isCorrupt: boolean = false): void => { frames.push({ at, ...text, choices, isCorrupt, phase, format }); };
  const type = (field: keyof typeof text, value: string): void => {
    for (const letter of value) {
      at += LETTER_MIN_MS + random.int(LETTER_RANGE_MS);

      text[field] += letter;
      record();
      if (letter === '\n') at += CORRECTION_PAUSE_MS / 2;
    }
  };
  const erase = (field: keyof typeof text, value: string): void => {
    for (const _letter of value) {
      text[field] = text[field].slice(0, -1);
      at += ERASURE_MS;
      record();
    }
  };
  phase = 'command';
  type('transcript', BOOT_COMMAND);
  at += 1500;
  phase = 'loading';
  record();
  for (const slot of ['01', '02', '03']) {
    at += 1000;
    text.transcript += `\ndreamweaver[${slot}] ...`;
    format = random.int(3);
    record();
    at += 700;
    text.transcript += ' loaded';
    record();
  }
  at += 900;
  text.prelude = CHRONICLE_OPENING_LOG;
  record();
  at = Math.max(at + CORRECTION_PAUSE_MS, 13000);
  phase = 'writing';
  // Brackets are authored attempts, not punctuation to print or rewrite ourselves.
  const attempts: RegExp = /\[([^|\]]+)\|([^\]]+)\]/g;
  let offset: number = 0;
  for (const match of QUESTION_SOURCE.matchAll(attempts)) {
    type('question', QUESTION_SOURCE.slice(offset, match.index));
    type('question', match[1]);
    at += CORRECTION_PAUSE_MS;
    format = (format + 1) % 3;
    record(true);
    erase('question', match[1]);
    at += CORRECTION_PAUSE_MS;
    type('question', match[2]);
    offset = match.index + match[0].length;
  }
  type('question', QUESTION_SOURCE.slice(offset));
  text.transcript += '\nretry.\nquestion ... ready';
  at += CORRECTION_PAUSE_MS;
  frames.push({ at, ...text, choices, isCorrupt: false, phase: 'waiting', format: 1 });
  return frames;
}
