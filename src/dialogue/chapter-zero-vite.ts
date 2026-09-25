import Ajv from "ajv";
import { parseOml, type Oml } from "../core/oml";
import { assertEraShaderBuilt, resolveEraShader } from "../era-shaders";
import amnesiaTownText from "./amnesia-town.oml?raw";
import dialogueSchema from "./dialogue.oms?raw";
import { GHOST_LEVELS } from "./ghost-vite";
import nethackFloor01Text from "./nethack-floor-01.oml?raw";
import nethackFloor02Text from "./nethack-floor-02.oml?raw";
import nethackFloor03Text from "./nethack-floor-03.oml?raw";
import neverGoAloneFloor01Text from "./never-go-alone-floor-01.oml?raw";
import neverGoAloneFloor02Text from "./never-go-alone-floor-02.oml?raw";
import neverGoAloneFloor03Text from "./never-go-alone-floor-03.oml?raw";

const authoredSources = [
  nethackFloor01Text,
  nethackFloor02Text,
  nethackFloor03Text,
  neverGoAloneFloor01Text,
  neverGoAloneFloor02Text,
  neverGoAloneFloor03Text,
  amnesiaTownText,
] as const;

function loadAuthoredLevels(sources: readonly string[]): readonly Oml[] {
  const validate = new Ajv({ strict: true }).compile(
    JSON.parse(dialogueSchema)
  );
  const levels = sources.map((source) => {
    const level = parseOml(source);
    const levelId = level.scene.id ?? "unnamed";
    if (!validate(level))
      throw new Error(
        `Invalid ${levelId} OML: ${JSON.stringify(validate.errors)}`
      );
    const eraShader = resolveEraShader(level.scene.era_shader ?? "");
    assertEraShaderBuilt(eraShader);
    return level;
  });

  levels.forEach((level, index) => {
    const next = levels[index + 1];
    if (next && level.scene.next !== next.scene.id)
      throw new Error(
        `${level.scene.id} must transition to ${next.scene.id}; received ${level.scene.next}.`
      );
    if (!next && level.scene.next)
      throw new Error(
        `${level.scene.id} is the stopping scene and cannot transition.`
      );
    if (level.scene.id !== "amnesia-town" && level.choices.length !== 3)
      throw new Error(
        `${level.scene.id} must provide one choice per Dreamweaver.`
      );
  });

  return levels;
}

export const CHAPTER_ZERO_AUTHORED_LEVELS = loadAuthoredLevels(authoredSources);
export const CHAPTER_ZERO_LEVELS = [
  ...GHOST_LEVELS,
  ...CHAPTER_ZERO_AUTHORED_LEVELS,
] as const;
export const CHAPTER_ZERO_LEVELS_BY_ID = new Map(
  CHAPTER_ZERO_LEVELS.map((level) => [level.scene.id ?? "", level] as const)
);
