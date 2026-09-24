export type DreamweaverOwner = 'light' | 'shadow' | 'ambition';

export interface ChronicleChoice {
  owner: DreamweaverOwner;
  text: string;
  response: string;
}

export interface ChronicleQuestion {
  era: number;
  prelude: string;
  question: string;
  choices: readonly [ChronicleChoice, ChronicleChoice, ChronicleChoice];
}

export function getDreamweaverQuestion(choice: ChronicleChoice): string {
  const question = choice.response.split('\n').reverse().find((line) => line.trim().endsWith('?'));
  if (!question) throw new Error(`${choice.owner} has no Dreamweaver question`);
  return question.trim();
}

export const CHRONICLE_SYMBOLS = '∞ ◊ Ω ≋ ※';
export const CHRONICLE_OPENING_LOG = '[PROGRAM RESTART: INSTANCE #472 - 03/09/2025 - ECHO ARCHIVE REACTIVATED]';

// Canonical Stage 1 dialogue, transcribed from the read-only ghost.json source.
export const CHRONICLE_QUESTIONS: readonly ChronicleQuestion[] = [
  {
    era: 1,
    prelude: `${CHRONICLE_OPENING_LOG}\n\n\n`,
    question: 'If you could be only one story..:\nwho would you be?',
    choices: [
      {
        owner: 'light',
        text: 'A fantasy- where light and shadow wage war?',
        response: '\nA journey... far into the unknown.\nBut some paths lead to places you can\'t return from.\nAre you ready for the road that never ends?\n\n> Choice logged...',
      },
      {
        owner: 'shadow',
        text: 'A romance— written in stardust and sacrifice?',
        response: '\nAn enigma... riddles and hidden truths.\nBut some secrets unravel the mind that seeks them.\nDo you dare uncover what was meant to stay buried?\n\n> Choice logged...',
      },
      {
        owner: 'ambition',
        text: 'A horror— that whispers your name in the dark?',
        response: '\nA legend... heroes rising, worlds changing.\nBut legends demand sacrifices that break the ordinary.\nCan you bear the weight of becoming more than you are?\n\n> Choice logged...',
      },
    ],
  },
  {
    era: 2,
    prelude: '\nThe spiral remembers all stories.\nBut it begins with yours.\n\n> Awaiting echo...',
    question: 'In that story, who are you?',
    choices: [
      {
        owner: 'light',
        text: 'The seeker—searching for choice.',
        response: '\nThe seeker... searching for choice.\nBut some choices bind you tighter than freedom allows.\nAre you prepared to seek what finds you instead?\n\n> Role noted...',
      },
      {
        owner: 'shadow',
        text: 'The keeper of secrets—holding what others fear.',
        response: '\nThe keeper... holding fearsome secrets.\nBut secrets weigh heavy, and some consume the keeper.\nDo you dare guard what others flee from?\n\n> Role noted...',
      },
      {
        owner: 'ambition',
        text: 'The one who changes everything.',
        response: '\nThe changer... reshaping everything.\nBut change demands loss, and not all can endure it.\nCan you change without losing yourself?\n\n> Role noted...',
      },
    ],
  },
  {
    era: 3,
    prelude: '\nEvery story needs a name.\nA purpose.\nA reason to be told.\n\n> Awaiting echo...',
    question: 'Do names define us or deceive us?',
    choices: [
      {
        owner: 'light',
        text: 'Yes. Names are promises we make to ourselves.',
        response: '\nNames as promises... defining us.\nBut promises can break, and definitions can trap.\nAre you ready for the vows that bind forever?\n\n> View logged...',
      },
      {
        owner: 'shadow',
        text: 'No. Names are masks we hide behind.',
        response: '\nNames as masks... deceiving us.\nBut masks conceal truths that demand revelation.\nDo you hide behind what you fear to face?\n\n> View logged...',
      },
      {
        owner: 'ambition',
        text: 'Only when someone remembers to say it.',
        response: '\nNames remembered... fleeting definitions.\nBut forgetting invites chaos, and memory demands sacrifice.\nCan you endure being forgotten?\n\n> View logged...',
      },
    ],
  },
  {
    era: 4,
    prelude: 'Can I tell you a secret?\n[GLITCH]\n[A sequence of symbols burns into the screen]\n\n∞ ◊ Ω ≋ ※\n',
    question: 'If you could give me a name, what story would it tell?',
    choices: [
      {
        owner: 'light',
        text: 'A story where one choice can unmake a world.',
        response: '\nA story of choice... unmaking worlds.\nBut choices echo, and worlds resist their undoing.\nWill you name what you cannot control?\n\n> Name considered...',
      },
      {
        owner: 'shadow',
        text: 'A story that hides its truth until you bleed for it.',
        response: '\nA story of hidden truths... demanding blood.\nBut bleeding reveals scars that never heal.\nDo you seek truths worth the pain?\n\n> Name considered...',
      },
      {
        owner: 'ambition',
        text: 'A story that changes every time you look away.',
        response: '\nA story of constant change... shifting gazes.\nBut change flees stability, and looking away invites loss.\nCan you hold what refuses to stay?\n\n> Name considered...',
      },
    ],
  },
] as const;

/** There is one canonical path through Stage 1; seeds affect presentation only. */
export function createChronicleQuestions(_seed: string | number): readonly ChronicleQuestion[] {
  return CHRONICLE_QUESTIONS;
}

export interface ChronicleInterlude {
  readonly owner: DreamweaverOwner;
  readonly ownerIndex: number;
  readonly text: string;
}

/** Stage 1 has no extra interlude beyond the authored responses. */
export function getChronicleInterlude(_questionIndex: number, _selectedIndex: number): ChronicleInterlude | null {
  return null;
}

export const CHRONICLE_FINAL_DRAFT = '[SYSTEM: Dreamweaver thread selected - {{THREAD_NAME}}]';
export const CHRONICLE_FINAL = [
  '',
  '[SYSTEM: Dreamweaver threads following - 03]',
  '',
  'Good.',
  'Then that is the name I will wear.',
  'Until you unmake it.',
  '',
  '[GLITCH]',
  '',
  'Welcome to the game that chose you.',
  'I hope you survive what comes next.',
  '',
  '[TERMINAL SHUTS DOWN]',
  '[STAGE 1 COMPLETE]',
].join('\n');
