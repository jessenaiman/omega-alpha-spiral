export type DreamweaverId = 'luminary' | 'shadow' | 'ambition';
export type TerminalQuestionId = 'story' | 'role' | 'name';

export interface TerminalChoice {
  readonly owner: DreamweaverId;
  readonly label: string;
  readonly response: string;
}

export interface TerminalQuestion {
  readonly id: TerminalQuestionId;
  readonly index: number;
  readonly prompt: string;
  readonly choices: readonly TerminalChoice[];
}

export const TERMINAL_SYMBOLS = '∞ ◊ Ω ≋ ※';

export const TERMINAL_QUESTIONS: readonly TerminalQuestion[] = [
  {
    id: 'story',
    index: 1,
    prompt: 'WHEN A STORY CHANGES YOU, WHO OWNS WHAT IT BECOMES?',
    choices: [
      { owner: 'luminary', label: 'THE ONE WHO CARRIES IT FORWARD', response: 'THEN CARRY MORE THAN ITS ENDING.' },
      { owner: 'shadow', label: 'NO ONE—STORIES ARE MASKS WITH WITNESSES', response: 'A MASK STILL REMEMBERS THE SHAPE BENEATH IT.' },
      { owner: 'ambition', label: 'THE ONE WILLING TO CHANGE IT', response: 'CHANGE IS A CLAIM. THE COST ARRIVES LATER.' },
    ],
  },
  {
    id: 'role',
    index: 2,
    prompt: 'DO NAMES DEFINE US OR DECEIVE US?',
    choices: [
      { owner: 'luminary', label: 'THEY GIVE HOPE A SHAPE', response: 'A SHAPE CAN SHELTER WHAT HAS NOT ARRIVED.' },
      { owner: 'shadow', label: 'THEY HIDE WHAT CANNOT BE SPOKEN', response: 'SILENCE IS ALSO A KIND OF TESTIMONY.' },
      { owner: 'ambition', label: 'THEY BECOME TRUE WHEN WE ANSWER', response: 'THEN ANSWER WITH MORE THAN A WORD.' },
    ],
  },
  {
    id: 'name',
    index: 3,
    prompt: 'WHAT SHOULD A WORLD REMEMBER FIRST?',
    choices: [
      { owner: 'luminary', label: 'THE PROMISE THAT BEGAN IT', response: 'PROMISE RECORDED. CONSEQUENCE PENDING.' },
      { owner: 'shadow', label: 'THE TRUTH IT COULD NOT KEEP', response: 'ABSENCE RECORDED. WITNESS PENDING.' },
      { owner: 'ambition', label: 'THE HAND THAT MADE IT MOVE', response: 'INTENT RECORDED. MOTION PENDING.' },
    ],
  },
];

export const TERMINAL_COPY = {
  opening: 'THE SPIRAL REMEMBERS ALL STORIES. BUT IT BEGINS WITH YOURS.',
  playerPrompt: 'IDENTIFY THE PLAYER.',
  omegaPrompt: 'THE SIGNAL HAS HEARD YOUR NAME. WHAT WILL YOU CALL IT?',
  complete: 'WELCOME TO THE GAME THAT CHOSE YOU.',
  handoff: 'TOWN MAP SIGNAL READY',
} as const;
