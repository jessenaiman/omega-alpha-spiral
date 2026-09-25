import Ajv from "ajv";
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

export interface GhostDialogue {
  readonly levels: readonly Oml[];
  readonly questions: readonly GhostQuestion[];
  readonly openingLog: string;
  readonly symbols: string;
  readonly final: string;
}

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
    era: index,
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

/** Parse authored Ghost OML using schema text supplied by the app or caller. */
export function createGhostDialogue(
  sources: readonly string[],
  schemaText: string
): GhostDialogue {
  const validate = new Ajv({ strict: true }).compile(JSON.parse(schemaText));
  const levels = sources.map((source, index) => {
    const level = parseOml(source);
    if (!validate(level))
      throw new Error(
        `Invalid Ghost floor ${index + 1} OML: ${JSON.stringify(validate.errors)}`
      );
    resolveEraShader(level.scene.era_shader ?? "");
    return level;
  });
  const questions = levels.map(questionOf);
  const opening = questions[0]?.prelude ?? "";
  const ending = levels[3]?.completion ?? [];
  return {
    levels,
    questions,
    openingLog: opening.trim(),
    symbols:
      questions[3]?.prelude.match(/[∞◊Ω≋※](?:\s+[∞◊Ω≋※])+/)?.[0] ?? "",
    final: ending
      .filter((event) => event.type === "line")
      .map((event) => event.text)
      .join("\n"),
  };
}

export function getDreamweaverQuestion(choice: GhostChoice): string {
  const question = choice.response
    .split("\n")
    .reverse()
    .find((line) => line.trim().endsWith("?"));
  if (!question)
    throw new Error(`${choice.owner} has no Dreamweaver question.`);
  return question.trim();
}

/** Seeds affect presentation only; dialogue comes from the four Ghost OML files. */
export function createGhostQuestions(
  dialogue: GhostDialogue,
  _seed: string | number
): readonly GhostQuestion[] {
  return dialogue.questions;
}

/** Ghost has no extra interlude beyond each authored OML response. */
export function getGhostInterlude(
  _questionIndex: number,
  _selectedIndex: number
): GhostInterlude | null {
  return null;
}
