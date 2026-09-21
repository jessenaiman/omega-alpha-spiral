import { createRng } from '../core/random';

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

export const CHRONICLE_SYMBOLS: string = '∞ ◊ Ω ≋ ※';
export const CHRONICLE_OPENING_LOG: string = '[PROGRAM RESTART: INSTANCE #472 - 03/09/2025 - ECHO ARCHIVE REACTIVATED]';

// Runtime-owned transcription of the approved Stage 1 sequence. The read-only
// narrative documents remain reference material and are never imported here.
export const CHRONICLE_QUESTIONS: readonly ChronicleQuestion[] = [
  {
    era: 1,
    prelude: CHRONICLE_OPENING_LOG,
    question: 'If you could be only one story..:\nwho would you be?',
    choices: [
      {
        owner: 'light',
        text: 'A fantasy- where light and shadow wage war?',
        response: "A journey... far into the unknown.\nBut some paths lead to places you can't return from.\nAre you ready for the road that never ends?\n\n> Choice logged...",
      },
      {
        owner: 'shadow',
        text: 'A confession—kept alive by the part you deny?',
        response: 'A confession... waiting inside its keeper.\nBut hidden truth does not stay still; it learns the shape of your silence.\nWill you face it without asking to be innocent?\n\n> Choice logged...',
      },
      {
        owner: 'ambition',
        text: 'A future—built for someone I will never meet?',
        response: 'A horizon chosen... not a crown.\nDirection asks for a cost before it offers proof.\nCan you build for a witness who has not arrived?\n\n> Choice logged...',
      },
    ],
  },
  {
    era: 2,
    prelude: 'The spiral remembers all stories.\nBut it begins with yours.\n\n> Awaiting echo...',
    question: 'In that story, who are you?',
    choices: [
      {
        owner: 'light',
        text: 'The seeker—searching for choice.',
        response: 'The seeker... searching for choice.\nBut some choices bind you tighter than freedom allows.\nAre you prepared to seek what finds you instead?\n\n> Role noted...',
      },
      {
        owner: 'shadow',
        text: 'The keeper of secrets—holding what others fear.',
        response: 'The keeper... holding fearsome secrets.\nBut secrets weigh heavy, and some consume the keeper.\nDo you dare guard what others flee from?\n\n> Role noted...',
      },
      {
        owner: 'ambition',
        text: 'The architect of the next necessary step.',
        response: 'The architect... working without the whole map.\nEvery step changes the structure around it.\nCan you revise the plan without abandoning its reason?\n\n> Role noted...',
      },
    ],
  },
  {
    era: 3,
    prelude: 'Every story needs a name.\nA purpose.\nA reason to be told.\n\n> Awaiting echo...',
    question: 'Do names define us or deceive us?',
    choices: [
      {
        owner: 'light',
        text: 'Yes. Names are promises we make to ourselves.',
        response: 'Names as promises... defining us.\nBut promises can break, and definitions can trap.\nAre you ready for the vows that bind forever?\n\n> View logged...',
      },
      {
        owner: 'shadow',
        text: 'No. Names are masks we hide behind.',
        response: 'Names as masks... deceiving us.\nBut masks conceal truths that demand revelation.\nDo you hide behind what you fear to face?\n\n> View logged...',
      },
      {
        owner: 'ambition',
        text: 'A name is a direction I keep walking toward.',
        response: 'A name as direction... not destination.\nA direction becomes a cage when you stop questioning it.\nWill you let the path change what the name means?\n\n> View logged...',
      },
    ],
  },
  {
    era: 4,
    prelude: `Can I tell you a secret?\n\n[GLITCH]\n[A sequence of symbols burns into the screen]\n\n${CHRONICLE_SYMBOLS}`,
    question: 'If you could give me a name,\nwhat story would it tell?',
    choices: [
      {
        owner: 'light',
        text: 'A story where one choice can unmake a world.',
        response: 'A story of choice... unmaking worlds.\nBut choices echo, and worlds resist their undoing.\nWill you name what you cannot control?\n\n> Name considered...',
      },
      {
        owner: 'shadow',
        text: 'A story that hides its truth until you bleed for it.',
        response: 'A story of hidden truths... demanding blood.\nBut bleeding reveals scars that never heal.\nDo you seek truths worth the pain?\n\n> Name considered...',
      },
      {
        owner: 'ambition',
        text: 'A story named for the door it leaves open.',
        response: 'A door left open... an invitation, not an escape.\nEvery opening lets something unknown enter.\nCan you welcome what your ambition cannot predict?\n\n> Name considered...',
      },
    ],
  },
] as const;

/**
 * Each threshold keeps the official sequence as its first candidate, then adds
 * two role-balanced alternatives. The owner order never changes: the player
 * learns Light, Shadow, and Ambition as stable spatial choices even when the
 * question changes between seeded runs.
 */
export const CHRONICLE_QUESTION_POOLS: readonly (readonly ChronicleQuestion[])[] = [
  [
    CHRONICLE_QUESTIONS[0],
    {
      era: 1,
      prelude: CHRONICLE_OPENING_LOG,
      question: 'When a story asks you to become someone else,\nwhat do you protect first?',
      choices: [
        {
          owner: 'light',
          text: 'The part of me that can still say no.',
          response: 'A refusal rendered visible.\nLight does not promise safety; it only keeps the line from disappearing.\nWill you follow it when no one applauds?\n\n> Boundary logged...',
        },
        {
          owner: 'shadow',
          text: 'The name I outgrew. Let it accuse me.',
          response: 'Good. You did not claim innocence.\nA discarded self still knows the shape of your hands.\nWill you face what you became before deciding what you are?\n\n> Remnant logged...',
        },
        {
          owner: 'ambition',
          text: 'The unfinished thing that still pulls me forward.',
          response: 'The unfinished... still asking for your hands.\nDirection takes its cost before it offers proof.\nWhat will you keep building when applause never arrives?\n\n> Vector logged...',
        },
      ],
    },
    {
      era: 1,
      prelude: CHRONICLE_OPENING_LOG,
      question: 'If no one would ever know what you chose,\nwhat would make it matter?',
      choices: [
        {
          owner: 'light',
          text: 'I would still need to defend it in daylight.',
          response: 'A choice that survives without witnesses.\nClarity is not approval, and the line may leave you alone.\nWill you keep it visible when it condemns you?\n\n> Principle logged...',
        },
        {
          owner: 'shadow',
          text: 'The part I refuse to explain.',
          response: 'An unexplained choice can be freedom—or a wound without a witness.\nYou kept the motive hidden from the machine.\nWas that defiance, or fear of discovering the answer?\n\n> Silence logged...',
        },
        {
          owner: 'ambition',
          text: 'What the choice makes possible after I am gone.',
          response: 'A future imagined beyond your lifetime.\nNo one may remember who opened the way.\nCan you build for a witness who has not arrived?\n\n> Horizon logged...',
        },
      ],
    },
  ],
  [
    CHRONICLE_QUESTIONS[1],
    {
      era: 2,
      prelude: 'The spiral remembers every route.\nIt cannot tell which one was yours.\n\n> Awaiting movement...',
      question: 'If every path is already drawn,\nwhat makes your next step yours?',
      choices: [
        {
          owner: 'light',
          text: 'I choose the step I can defend in daylight.',
          response: 'You do not need every path to be free.\nYou need one step you will not hide from.\nWhat happens when the right path costs someone else comfort?\n\n> Step logged...',
        },
        {
          owner: 'shadow',
          text: 'The part of the step I refuse to explain.',
          response: 'The machine cannot own a motive it cannot see.\nBut secrecy can be freedom—or a wound protecting itself.\nWhich one moved you?\n\n> Motive obscured...',
        },
        {
          owner: 'ambition',
          text: 'The direction I choose without proof.',
          response: 'The architect moves without the whole map.\nEvery step changes the structure around it.\nCan you revise the plan without abandoning its reason?\n\n> Direction logged...',
        },
      ],
    },
    {
      era: 2,
      prelude: 'A role is only a movement repeated.\nThe spiral is watching yours.\n\n> Awaiting movement...',
      question: 'When obedience and conscience point apart,\nwhich one gets your body?',
      choices: [
        {
          owner: 'light',
          text: 'Conscience—even when it leaves me alone.',
          response: 'A straight path can become lonely.\nDo not mistake solitude for proof.\nWhen the line divides, will you still examine where it leads?\n\n> Bearing logged...',
        },
        {
          owner: 'shadow',
          text: 'Whichever one admits what it will cost.',
          response: 'Neither command is clean once a body must carry it.\nYou asked the cost to speak before the virtue.\nWill you listen when it answers in your own voice?\n\n> Cost logged...',
        },
        {
          owner: 'ambition',
          text: 'The one that leaves a path open behind me.',
          response: 'A path left open—not a throne claimed.\nThose who follow may choose a road you would not.\nCan you make room for futures you cannot control?\n\n> Passage logged...',
        },
      ],
    },
  ],
  [
    CHRONICLE_QUESTIONS[2],
    {
      era: 3,
      prelude: 'Every name outlives at least one version of its owner.\n\n> Awaiting definition...',
      question: 'Is a name a truth you discover,\nor a promise you keep making?',
      choices: [
        {
          owner: 'light',
          text: 'A promise, if I must answer for it.',
          response: 'Then you understand the weight of a clear word.\nA promise can bind, but it can also give shape to the dark.\nWill you keep it when keeping it changes you?\n\n> Promise logged...',
        },
        {
          owner: 'shadow',
          text: 'A mask that remembers why I needed it.',
          response: 'A mask is not always a lie.\nSometimes it is the face that survived long enough to answer.\nWill you remove it before you punish it?\n\n> Mask logged...',
        },
        {
          owner: 'ambition',
          text: 'A direction I choose to keep walking toward.',
          response: 'A name as direction—not destination.\nDirection becomes a cage when you stop questioning it.\nWill you let the path change what the name means?\n\n> Heading logged...',
        },
      ],
    },
    {
      era: 3,
      prelude: 'The archive found your name in a future file.\nThe file was empty.\n\n> Awaiting definition...',
      question: 'What should remain of you\nwhen the reason is forgotten?',
      choices: [
        {
          owner: 'light',
          text: 'The promise I kept when it was difficult.',
          response: 'A promise with no witness and no applause.\nThe line remains after its reason disappears.\nWould you still call it true if it hurt the wrong person?\n\n> Vow logged...',
        },
        {
          owner: 'shadow',
          text: 'The scar, without the comfort of my excuse.',
          response: 'Most preserve the motive and bury the damage.\nYou kept the scar and surrendered the story around it.\nCan you live without knowing whether you meant to hurt anyone?\n\n> Scar logged...',
        },
        {
          owner: 'ambition',
          text: 'The door I left open for someone else.',
          response: 'An invitation surviving its maker.\nThe future may spend your gift differently than you intended.\nCan you build without owning the result?\n\n> Door logged...',
        },
      ],
    },
  ],
  [
    CHRONICLE_QUESTIONS[3],
    {
      era: 4,
      prelude: `Can I tell you a secret?\n\n[GLITCH]\n[Three witnesses arrive before the answer]\n\n${CHRONICLE_SYMBOLS}`,
      question: 'If entering means you can no longer call yourself innocent,\nwhat will you call yourself?',
      choices: [
        {
          owner: 'light',
          text: 'Responsible for what I do next.',
          response: 'An answer with no hiding place.\nResponsibility is not control. It is the line between what happened and what you choose now.\nThe line remains whether you cross it or not.\n\n> Threshold logged...',
        },
        {
          owner: 'shadow',
          text: 'The version of me that lied to arrive here.',
          response: 'Then do not punish the lie for surviving longer than you did.\nA lie can be a lock, a shelter, or a map drawn in reverse.\nWhen it opens, will you finally name it?\n\n> Threshold logged...',
        },
        {
          owner: 'ambition',
          text: 'The future I am willing to pay for.',
          response: 'A future with a cost—finally spoken aloud.\nPayment does not guarantee the future arrives.\nWill you choose it when the spiral refuses to reward you?\n\n> Threshold logged...',
        },
      ],
    },
    {
      era: 4,
      prelude: `Can I tell you a secret?\n\n[GLITCH]\n[THE QUESTION IS ALSO A DOOR]\n\n${CHRONICLE_SYMBOLS}`,
      question: 'When the door opens for a version of you\nyou do not forgive, do you enter?',
      choices: [
        {
          owner: 'light',
          text: 'Yes. I will see clearly what I am answering for.',
          response: 'Sight is not absolution.\nYou chose to witness without looking away.\nStep through, and let the light show what the story costs.\n\n> Witness logged...',
        },
        {
          owner: 'shadow',
          text: 'Yes. I need to know what the lie was protecting.',
          response: 'A lie can be a lock, a shelter, or a map drawn in reverse.\nDo not punish it merely for surviving.\nOpen it.\n\n> Shelter logged...',
        },
        {
          owner: 'ambition',
          text: 'Yes. I will leave a better door open behind me.',
          response: 'An opening—not an escape.\nEverything unknown may enter through what you build.\nWelcome what your ambition cannot predict.\n\n> Future logged...',
        },
      ],
    },
  ],
] as const;

export function createChronicleQuestions(seed: string | number): readonly ChronicleQuestion[] {
  const random = createRng(seed).fork('chronicle-questions');
  const expectedOwners: readonly DreamweaverOwner[] = ['light', 'shadow', 'ambition'];
  return CHRONICLE_QUESTION_POOLS.map((pool: readonly ChronicleQuestion[], index: number): ChronicleQuestion => {
    const question: ChronicleQuestion = random.fork(`threshold-${index + 1}`).pick(pool);
    if (question.choices.some((choice: ChronicleChoice, owner: number): boolean => choice.owner !== expectedOwners[owner])) {
      throw new Error(`Chronicle threshold ${index + 1} changed Dreamweaver order`);
    }
    return question;
  });
}

export const CHRONICLE_FINAL_DRAFT: string = '[SYSTEM: Dreamweaver thread selected - {{THREAD_NAME}}]';
export const CHRONICLE_FINAL: string = [
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
