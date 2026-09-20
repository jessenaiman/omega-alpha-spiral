import { createRng } from '../core/random';
import script from '../../project-management/official game docs (read-only)/chapter-zero-stages/stage_1_opening/ghost.json';

export interface BootFrame {
  at: number;
  prelude: string;
  question: string;
  transcript: string;
  isCorrupt: boolean;
  phase: 'cursor' | 'command' | 'loading' | 'writing' | 'waiting';
  format: number;
}

const FIRST_INK_MS: number = 1800;
const LETTER_MIN_MS: number = 85;
const LETTER_RANGE_MS: number = 100;
const ERASURE_MS: number = 65;
const CORRECTION_PAUSE_MS: number = 950;
export const BOOT_COMMAND: string = '/run omega.sh';
export const BOOT_OPTIONS: string[] = script.scenes[0].choice!.options.map((option): string => option.text);
export const BOOT_SYMBOLS: string = script.scenes.find((scene): boolean => scene.id === 'scene_006_secret')!.lines![4];
const QUESTION_SOURCE: string = (script.scenes[0].choice!.question as string[]).join('\n'); // First scene has the authored two-line question.

/** Materialize timing once: render rate must not change the spelling or pauses. */
export function createBootFrames(seed: string): BootFrame[] {
  const random = createRng(seed).fork('ghostwriting');
  const text: Record<'prelude' | 'question' | 'transcript', string> = { prelude: '', question: '', transcript: '' };
  let phase: BootFrame['phase'] = 'cursor';
  let format: number = 0;
  const frames: BootFrame[] = [{ at: 0, ...text, isCorrupt: false, phase, format }];
  let at: number = FIRST_INK_MS;
  const record = (isCorrupt: boolean = false): void => { frames.push({ at, ...text, isCorrupt, phase, format }); };
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
  text.prelude = script.scenes[0].lines![0];
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
  frames.push({ at, ...text, isCorrupt: false, phase: 'waiting', format: 0 });
  return frames;
}
