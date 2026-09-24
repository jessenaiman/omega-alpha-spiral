import ghostFloor01Text from "./ghost-floor-01.oml?raw";
import ghostFloor02Text from "./ghost-floor-02.oml?raw";
import ghostFloor03Text from "./ghost-floor-03.oml?raw";
import ghostFloor04Text from "./ghost-floor-04.oml?raw";
import dialogueSchema from "./dialogue.oms?raw";
import { createGhostDialogue } from "./ghost";

const dialogue = createGhostDialogue(
  [ghostFloor01Text, ghostFloor02Text, ghostFloor03Text, ghostFloor04Text],
  dialogueSchema
);

export const GHOST_LEVELS = dialogue.levels;
export const GHOST_QUESTIONS = dialogue.questions;
export const GHOST_OPENING_LOG = dialogue.openingLog;
export const GHOST_SYMBOLS = dialogue.symbols;
export const GHOST_FINAL = dialogue.final;

export { getDreamweaverQuestion } from "./ghost";
export type {
  DreamweaverOwner,
  GhostChoice,
  GhostInterlude,
  GhostQuestion,
} from "./ghost";

/** Seeds affect presentation only; dialogue comes from the four Ghost OML files. */
export function createGhostQuestions(
  _seed: string | number
): typeof GHOST_QUESTIONS {
  return GHOST_QUESTIONS;
}

export function getGhostInterlude(
  _questionIndex: number,
  _selectedIndex: number
): null {
  return null;
}
