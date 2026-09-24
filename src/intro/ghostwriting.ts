import { createRng } from "../core/random";
import type { SpeakerId } from "../dialogue/personas";
import type { GhostQuestion } from "../dialogue/ghost";

export interface BootFrame {
  at: number;
  prelude: string;
  question: string;
  transcript: string;
  choices: readonly string[];
  isCorrupt: boolean;
  phase:
    | "cursor"
    | "command"
    | "loading"
    | "writing"
    | "waiting"
    | "prelude"
    | "question"
    | "choices"
    | "response"
    | "travel"
    | "final"
    | "name"
    | "doorway"
    | "complete";
  format: number;
  phaseElapsedMs?: number;
  hint?: string;
  /** Dreamweaver currently authoring response text; independent of the chosen route. */
  speaker?: number;
  /** Explicit studio actor; independent of player-choice ownership. */
  studioSpeaker?: SpeakerId;
  /** Choice text per Dreamweaver, authored in the studio. */
  choiceLines?: readonly string[];
  /** Which Dreamweaver is currently authoring a choice line. */
  choiceSpeaker?: number;
}

const FIRST_INK_MS: number = 900;
const LETTER_MIN_MS: number = 42;
const LETTER_RANGE_MS: number = 62;
const ERASURE_MS: number = 38;
const CORRECTION_PAUSE_MS: number = 520;
export const BOOT_COMMAND: string = "/run omega.sh";

/** Materialize timing once: render rate must not change the spelling or pauses. */
export function createBootFrames(
  seed: string,
  opening: GhostQuestion
): BootFrame[] {
  const random = createRng(seed).fork("ghostwriting");
  const text: Record<"prelude" | "question" | "transcript", string> = {
    prelude: "",
    question: "",
    transcript: "",
  };
  let phase: BootFrame["phase"] = "cursor";
  let format: number = 0;
  const choices: readonly string[] = opening.choices.map(
    (choice) => choice.text
  );
  const frames: BootFrame[] = [
    { at: 0, ...text, choices, isCorrupt: false, phase, format },
  ];
  let at: number = FIRST_INK_MS;
  const record = (isCorrupt: boolean = false): void => {
    frames.push({ at, ...text, choices, isCorrupt, phase, format });
  };
  const type = (field: keyof typeof text, value: string): void => {
    for (const letter of value) {
      at += LETTER_MIN_MS + random.int(LETTER_RANGE_MS);

      text[field] += letter;
      record();
      if (letter === "\n") at += CORRECTION_PAUSE_MS / 2;
    }
  };
  const typeTerminal = (value: string): void => {
    for (const letter of value) {
      at += 18 + random.int(22);
      text.transcript += letter;
      record();
      if (letter === "\n") at += 180;
    }
  };
  const erase = (field: keyof typeof text, value: string): void => {
    for (const _letter of value) {
      text[field] = text[field].slice(0, -1);
      at += ERASURE_MS;
      record();
    }
  };
  phase = "command";
  typeTerminal("$ ./omega");
  at += 360;
  format = 0;
  typeTerminal("\nbash: ./omega: script unfinished");
  at += 620;
  format = 1;
  typeTerminal("\n$ sh wake-omega");
  at += 420;
  typeTerminal("\nwake-omega: line 1: unexpected end");
  at += 720;
  format = 2;
  typeTerminal(`\n$ ${BOOT_COMMAND}`);
  at += 780;
  format = 3;
  text.prelude = opening.prelude.trim();
  record();
  phase = "writing";
  // Brackets are authored attempts, not punctuation to print or rewrite ourselves.
  const attempts: RegExp = /\[([^|\]]+)\|([^\]]+)\]/g;
  let offset: number = 0;
  const questionSource: string = opening.question;
  for (const match of questionSource.matchAll(attempts)) {
    type("question", questionSource.slice(offset, match.index));
    type("question", match[1]);
    at += CORRECTION_PAUSE_MS;
    format = Math.min(5, format + 1);
    record(true);
    erase("question", match[1]);
    at += CORRECTION_PAUSE_MS;
    type("question", match[2]);
    offset = match.index + match[0].length;
  }
  type("question", questionSource.slice(offset));
  at += 720;
  text.transcript += "\nquestion ... stalled";
  record(true);
  phase = "loading";
  for (const [index, slot] of ["01", "02", "03"].entries()) {
    // Each breach gets a complete visual beat. Previous arrivals remain as
    // witnesses instead of three simultaneous loading indicators.
    at += index === 0 ? 1250 : 2200;
    format = 5;
    text.transcript += `\ndreamweaver[${slot}] ...`;
    record();
    at += 1750;
    text.transcript += " present";
    record();
  }
  text.transcript += "\nquestion ... held open";
  at += CORRECTION_PAUSE_MS;
  frames.push({
    at,
    ...text,
    choices,
    isCorrupt: false,
    phase: "waiting",
    format: 5,
  });
  return frames;
}
