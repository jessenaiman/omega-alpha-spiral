import { createRng } from '../core/random';
import asides from './dreamweaver-asides.json';
import script from './ghost-script.json';

export interface DreamweaverLine { voice: number; text: string }

export interface BootFrame {
  at: number;
  prelude: string;
  question: string;
  transcript: string;
  isCorrupt: boolean;
  phase: 'cursor' | 'command' | 'loading' | 'writing' | 'waiting' | 'debating' | 'final' | 'doorway' | 'crossing' | 'complete';
  /** Separate provisional interjections; never written into Omega's script. */
  debate?: DreamweaverLine[];
  format: number;
  /** Authored options for the question awaiting an answer; empty while typing. */
  options: string[];
  /** The fragment burns onto its own plate from the secret beat onward. */
  showSymbols: boolean;
}

interface GhostOption { owner: string; text: string; response?: string[] }
interface GhostScene { id: string; owner?: string; lines?: string[]; choice?: { question: string | string[]; options: GhostOption[] } }
interface GhostScript { scenes: GhostScene[] }

/** Runtime copy of staged section 2; the creative reference is never imported or edited. */
const STORY: GhostScript = script;
export const STORY_SCENES: GhostScene[] = STORY.scenes;

const FIRST_INK_MS: number = 1800;
const LETTER_MIN_MS: number = 85;
const LETTER_RANGE_MS: number = 100;
const ERASURE_MS: number = 65;
const CORRECTION_PAUSE_MS: number = 950;
export const BOOT_COMMAND: string = '/run omega.sh';
export const BOOT_OPTIONS: string[] = STORY.scenes[0].choice!.options.map((option): string => option.text);
export const BOOT_SYMBOLS: string = STORY.scenes.find((scene): boolean => scene.id === 'scene_006_secret')!.lines![4];
const QUESTION_SOURCE: string = questionText(STORY.scenes[0]); // First scene has the authored two-line question.

/** Story beats type faster than the boot: the machine found its voice. */
const STORY_LETTER_MIN_MS: number = 26;
const STORY_LETTER_RANGE_MS: number = 40;
const STORY_ERASE_MS: number = 26;
const STORY_LINE_HOLD_MS: number = 300;
const STORY_BEAT_HOLD_MS: number = 1200;
export const STORY_REACTION_MS: number = 600;
const STORY_FINAL_HOLD_MS: number = 1800;
const DEBATE_TURN_HOLD_MS: number = 2300;
const MAX_VISIBLE_LINES: number = 6;

/** Layout only: the runtime script and accessibility mirror retain authored words. */
export function wrapText(text: string, columns: number): string {
  return text.split('\n').map((line: string): string => {
    let rest: string = line;
    const lines: string[] = [];
    while (rest.length > columns) {
      const space: number = rest.lastIndexOf(' ', columns);
      const split: number = space > 0 ? space : columns;
      lines.push(rest.slice(0, split));
      rest = rest.slice(split + (space > 0 ? 1 : 0));
    }
    lines.push(rest);
    return lines.join('\n');
  }).join('\n');
}

export function questionText(scene: GhostScene): string {
  const question = scene.choice?.question ?? '';
  return Array.isArray(question) ? question.join('\n') : question;
}

/** Canonical Dreamweaver display names (CONTEXT.md): Light, Shadow, Ambition. */
export const THREAD_NAMES: Record<string, string> = { light: 'Light', shadow: 'Shadow', ambition: 'Ambition' };

/** Plurality of chosen owners; the most recent choice breaks a tie. */
export function threadNameFor(owners: string[]): string {
  const tally = new Map<string, number>();
  let leader = owners[0] ?? '';
  let leaderCount = 0;
  for (const owner of owners) {
    const count = (tally.get(owner) ?? 0) + 1;
    tally.set(owner, count);
    if (count >= leaderCount) { leader = owner; leaderCount = count; }
  }
  return leader;
}

export interface StoryBeat {
  frames: BootFrame[];
  /** The question scene the walk stopped at, or STORY_SCENES.length after the finale. */
  nextSceneIndex: number;
  owner: string;
  thread: string;
}

/**
 * Everything that happens after the player answers one question: the authored
 * response, every connective scene up to the next question (or the shutdown),
 * typed with the same broken-terminal charm. Generation stops at the next
 * waiting question — the story never advances past a question on its own.
 */
export function createStoryBeat(
  seed: string,
  sceneIndex: number,
  choiceIndex: number,
  priorOwners: string[],
  startAt: number,
  speed: number = 1,
  previousPrelude: string = '',
  previousQuestion: string = '',
  previousSymbols: boolean = false,
): StoryBeat {
  const scene: GhostScene | undefined = STORY_SCENES[sceneIndex];
  const option: GhostOption | undefined = scene?.choice?.options[choiceIndex];
  if (!scene?.choice || !option) throw new Error(`Scene ${sceneIndex} is not a question with choice ${choiceIndex}`);
  const random = createRng(seed).fork(`story:${sceneIndex}:${choiceIndex}`);
  const owners = [...priorOwners, option.owner];
  const threadId = threadNameFor(owners);
  const thread = THREAD_NAMES[threadId] ?? threadId;
  const frames: BootFrame[] = [];
  const lines: string[] = previousPrelude ? previousPrelude.split('\n').slice(-MAX_VISIBLE_LINES) : [];
  const text: Record<'prelude' | 'question', string> = { prelude: previousPrelude, question: '' };
  let at: number = startAt;
  let corrupt: boolean = false;
  let showSymbols: boolean = previousSymbols;
  const tick = (ms: number): void => { at += ms * speed; };
  const push = (phase: BootFrame['phase'], extra: Partial<BootFrame> = {}): void => {
    frames.push({ at, prelude: text.prelude, question: text.question, transcript: '', isCorrupt: corrupt, phase, format: 0, options: [], showSymbols, ...extra });
  };
  const renderLines = (): void => { text.prelude = lines.join('\n'); };
  const trim = (): void => { while (lines.length > MAX_VISIBLE_LINES) lines.shift(); };
  const typeLine = (line: string): void => {
    lines.push('');
    trim();
    for (const letter of line) {
      tick(STORY_LETTER_MIN_MS + random.int(STORY_LETTER_RANGE_MS));
      lines[lines.length - 1] = (lines[lines.length - 1] ?? '') + letter;
      renderLines();
      push('writing');
    }
    trim();
  };
  const runLine = (raw: string): void => {
    const line = raw.replace('{{THREAD_NAME}}', thread);
    if (line === BOOT_SYMBOLS) {
      // The fragment burns onto its own plate instead of the scrolling feed.
      showSymbols = true;
      tick(STORY_LINE_HOLD_MS);
      push('writing');
      return;
    }
    if (line === '') { tick(STORY_LINE_HOLD_MS / 2); push('writing'); return; }
    typeLine(line);
    if (line === '[GLITCH]') {
      corrupt = true;
      push('writing');
      tick(120);
      corrupt = false;
    }
    tick(STORY_LINE_HOLD_MS);
    push('writing');
  };
  const typeQuestion = (question: string): void => {
    while (text.question.length > 0) {
      text.question = text.question.slice(0, -1);
      tick(STORY_ERASE_MS);
      push('writing');
    }
    for (const letter of question) {
      tick(STORY_LETTER_MIN_MS + random.int(STORY_LETTER_RANGE_MS));
      text.question += letter;
      push('writing');
    }
  };

  // Clear the answered question immediately so a second input cannot answer twice.
  tick(STORY_REACTION_MS);
  push('writing');
  // Other interpretations contend first; the chosen thread gets the last word.
  // Reuse existing prototype asides unchanged, pending owner-authored dialogue.
  const selectedVoice: number = asides.voices.findIndex((voice): boolean => voice.owner === option.owner);
  const voices: number[] = asides.voices.map((_, voice): number => voice).filter((voice): boolean => voice !== selectedVoice);
  if (selectedVoice >= 0) voices.push(selectedVoice);
  const debate: DreamweaverLine[] = [];
  for (const voice of voices) {
    debate.push({ voice, text: asides.voices[voice].text });
    push('debating', { debate: [...debate] });
    tick(DEBATE_TURN_HOLD_MS);
  }
  push('writing');
  for (const line of option.response ?? []) runLine(line);
  tick(STORY_BEAT_HOLD_MS);
  push('writing');
  let index = sceneIndex + 1;
  while (index < STORY_SCENES.length) {
    const current: GhostScene | undefined = STORY_SCENES[index];
    if (!current) break;
    if (current.choice) {
      typeQuestion(questionText(current));
      tick(500);
      push('waiting', { options: current.choice.options.map((choice): string => choice.text), showSymbols });
      return { frames, nextSceneIndex: index, owner: option.owner, thread };
    }
    for (const line of current.lines ?? []) runLine(line);
    tick(STORY_BEAT_HOLD_MS);
    push('writing');
    index += 1;
  }
  tick(STORY_FINAL_HOLD_MS);
  push('final', { showSymbols });
  return { frames, nextSceneIndex: index, owner: option.owner, thread };
}

/** Materialize timing once: render rate must not change the spelling or pauses. */
export function createBootFrames(seed: string, speed: number = 1): BootFrame[] {
  const random = createRng(seed).fork('ghostwriting');
  const text: Record<'prelude' | 'question' | 'transcript', string> = { prelude: '', question: '', transcript: '' };
  let phase: BootFrame['phase'] = 'cursor';
  let format: number = 0;
  const frames: BootFrame[] = [{ at: 0, ...text, isCorrupt: false, phase, format, options: [], showSymbols: false }];
  let at: number = FIRST_INK_MS * speed;
  const tick = (ms: number): void => { at += ms * speed; };
  const record = (isCorrupt: boolean = false): void => { frames.push({ at, ...text, isCorrupt, phase, format, options: [], showSymbols: false }); };
  const type = (field: keyof typeof text, value: string): void => {
    for (const letter of value) {
      tick(LETTER_MIN_MS + random.int(LETTER_RANGE_MS));
      text[field] += letter;
      record();
      if (letter === '\n') tick(CORRECTION_PAUSE_MS / 2);
    }
  };
  const erase = (field: keyof typeof text, value: string): void => {
    for (const _letter of value) {
      text[field] = text[field].slice(0, -1);
      tick(ERASURE_MS);
      record();
    }
  };
  phase = 'command';
  type('transcript', BOOT_COMMAND);
  tick(1500);
  phase = 'loading';
  record();
  for (const slot of ['01', '02', '03']) {
    tick(1000);
    text.transcript += `\ndreamweaver[${slot}] ...`;
    format = random.int(3);
    record();
    tick(700);
    text.transcript += ' loaded';
    record();
  }
  tick(900);
  text.prelude = STORY.scenes[0].lines![0];
  record();
  at = Math.max(at + CORRECTION_PAUSE_MS * speed, 13000 * speed);
  phase = 'writing';
  // Brackets are authored attempts, not punctuation to print or rewrite ourselves.
  const attempts: RegExp = /\[([^|\]]+)\|([^\]]+)\]/g;
  let offset: number = 0;
  for (const match of QUESTION_SOURCE.matchAll(attempts)) {
    type('question', QUESTION_SOURCE.slice(offset, match.index));
    type('question', match[1]);
    tick(CORRECTION_PAUSE_MS);
    format = (format + 1) % 3;
    record(true);
    erase('question', match[1]);
    tick(CORRECTION_PAUSE_MS);
    type('question', match[2]);
    offset = match.index + match[0].length;
  }
  type('question', QUESTION_SOURCE.slice(offset));
  text.transcript += '\nretry.\nquestion ... ready';
  tick(CORRECTION_PAUSE_MS);
  frames.push({ at, ...text, isCorrupt: false, phase: 'waiting', format: 0, options: BOOT_OPTIONS, showSymbols: false });
  return frames;
}
