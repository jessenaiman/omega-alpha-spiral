import { BITMAP_GUI_ERA_SHADERS } from "./definitions/bitmap-gui";
import { CHARACTER_CELL_ERA_SHADERS } from "./definitions/character-cell";
import { IMPACT_ERA_SHADERS } from "./definitions/impact";
import { OUTLINE_ERA_SHADERS } from "./definitions/outline";
import { SUBPIXEL_ERA_SHADERS } from "./definitions/subpixel";
import { VECTOR_ERA_SHADERS } from "./definitions/vector";
import type { EraShaderDefinition, EraShaderRenderMethod } from "./types";

export const ERA_SHADERS: readonly EraShaderDefinition[] = [
  ...VECTOR_ERA_SHADERS,
  ...IMPACT_ERA_SHADERS,
  ...CHARACTER_CELL_ERA_SHADERS,
  ...BITMAP_GUI_ERA_SHADERS,
  ...OUTLINE_ERA_SHADERS,
  ...SUBPIXEL_ERA_SHADERS,
].sort((left, right) => left.order - right.order);

const ERA_SHADER_BY_ID = new Map(
  ERA_SHADERS.map((shader) => [shader.id, shader])
);

const LEGACY_ERA_ALIAS: Readonly<Record<string, string>> = {
  phosphor: "dec-vt100-ascii-terminal",
  dos: "ibm-pc-vga",
  gui: "os2-presentation-manager",
  smooth: "freetype-lcd-modern",
};

export const BUILT_ERA_SHADER_METHODS: readonly EraShaderRenderMethod[] = [
  "character-cell",
  "bitmap-gui",
  "outline",
  "subpixel",
];

const REJECTED_ERA_SHADER_METHODS: Readonly<
  Partial<Record<EraShaderRenderMethod, string>>
> = {
  "vector-stroke": "vector-stroke requires an authored stroke renderer",
  impact: "impact requires a print-surface renderer",
};

export function resolveEraShader(id: string): EraShaderDefinition {
  const canonicalId = LEGACY_ERA_ALIAS[id] ?? id;
  const shader = ERA_SHADER_BY_ID.get(canonicalId);
  if (!shader) {
    throw new Error(
      `Unknown era shader "${id}". Expected one of: ${ERA_SHADERS.map((entry) => entry.id).join(", ")}`
    );
  }
  return shader;
}

export const isEraShaderBuilt = (shader: EraShaderDefinition): boolean =>
  BUILT_ERA_SHADER_METHODS.includes(shader.renderMethod);

export function assertEraShaderBuilt(shader: EraShaderDefinition): void {
  const reason = REJECTED_ERA_SHADER_METHODS[shader.renderMethod];
  if (reason) {
    throw new Error(
      `Era shader "${shader.id}" uses unsupported render method "${shader.renderMethod}": ${reason}. Choose a built render method: ${BUILT_ERA_SHADER_METHODS.join(", ")}.`
    );
  }
  if (!isEraShaderBuilt(shader)) {
    throw new Error(
      `Era shader "${shader.id}" uses unregistered render method "${shader.renderMethod}".`
    );
  }
}
