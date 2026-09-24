import Ajv from "ajv";
import ghostFloor01Text from "./ghost-floor-01.oml?raw";
import ghostFloor02Text from "./ghost-floor-02.oml?raw";
import ghostFloor03Text from "./ghost-floor-03.oml?raw";
import ghostFloor04Text from "./ghost-floor-04.oml?raw";
import dialogueSchema from "./dialogue.oms?raw";
import {
  parseOml,
  type ChoiceDef,
  type Oml,
  type OmlStateEffect,
} from "../core/oml";
import { resolveEraShader } from "../era-shaders";

// Creative authority:
// https://github.com/jessenaiman/omega-alpha-spiral/blob/main/project-management/official%20game%20docs%20(read-only)/chapter-zero-stages/stage_1_opening/ghost.json
export type DreamweaverOwner = "light" | "shadow" | "ambition";

export interface GhostChoice {
  owner: DreamweaverOwner;
  text: string;
  response: string;
  effects: readonly OmlStateEffect[];
  emit: string;
  transition: string;
}

export interface GhostQuestion {
  era: number;
  eraShaderId: string;
  levelId: string;
  prelude: string;
  question: string;
  choices: readonly [GhostChoice, GhostChoice, GhostChoice];
}

export interface GhostInterlude {
  readonly owner: DreamweaverOwner;
  readonly ownerIndex: number;
  readonly text: string;
}

const sources = [
  ghostFloor01Text,
  ghostFloor02Text,
  ghostFloor03Text,
  ghostFloor04Text,
] as const;

const validate = new Ajv({ strict: true }).compile(JSON.parse(dialogueSchema));

export const GHOST_LEVELS: readonly Oml[] = sources.map((source, index) => {
  const level = parseOml(source);
  if (!validate(level))
    throw new Error(
      `Invalid Ghost floor ${index + 1} OML: ${JSON.stringify(validate.errors)}`
    );
  resolveEraShader(level.scene.era_shader ?? "");
  return level;
});

const ownerOf = (choice: ChoiceDef): DreamweaverOwner => {
  if (
    choice.owner !== "light" &&
    choice.owner !== "shadow" &&
    choice.owner !== "ambition"
  )
    throw new Error(`Unknown Dreamweaver owner: ${choice.owner}`);
  return choice.owner;
};

const choiceOf = (choice: ChoiceDef): GhostChoice => ({
  owner: ownerOf(choice),
  text: choice.text,
  response: choice.responses.join("\n"),
  effects: choice.effects,
  emit: choice.emit ?? "",
  transition: choice.transition ?? "",
});

const questionOf = (level: Oml, index: number): GhostQuestion => {
  if (level.choices.length !== 3)
    throw new Error(
      `${level.scene.id ?? `Ghost floor ${index + 1}`} needs 3 choices.`
    );
  const choices = level.choices.map(choiceOf) as [
    GhostChoice,
    GhostChoice,
    GhostChoice,
  ];
  return {
    era: index + 1,
    eraShaderId: level.scene.era_shader ?? "",
    levelId: level.scene.id ?? "",
    prelude: level.events
      .filter((event) => event.type === "line")
      .map((event) => event.text)
      .join("\n"),
    question: level.question.text ?? "",
    choices,
  };
};

export const GHOST_QUESTIONS: readonly GhostQuestion[] =
  GHOST_LEVELS.map(questionOf);

export function getDreamweaverQuestion(choice: GhostChoice): string {
  const question = choice.response
    .split("\n")
    .reverse()
    .find((line) => line.trim().endsWith("?"));
  if (!question)
    throw new Error(`${choice.owner} has no Dreamweaver question.`);
  return question.trim();
}

export const GHOST_OPENING_LOG = GHOST_QUESTIONS[0].prelude.trim();
export const GHOST_SYMBOLS =
  GHOST_QUESTIONS[3].prelude.match(/[∞◊Ω≋※](?:\s+[∞◊Ω≋※])+/)?.[0] ?? "";

/** Seeds affect presentation only; dialogue comes from the four Ghost OML files. */
export function createGhostQuestions(
  _seed: string | number
): readonly GhostQuestion[] {
  return GHOST_QUESTIONS;
}

/** Ghost has no extra interlude beyond each authored OML response. */
export function getGhostInterlude(
  _questionIndex: number,
  _selectedIndex: number
): GhostInterlude | null {
  return null;
}

export const GHOST_FINAL = GHOST_LEVELS[3].completion
  .filter((event) => event.type === "line")
  .map((event) => event.text)
  .join("\n");
