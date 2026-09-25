import { assertEraShaderBuilt, resolveEraShader } from "./registry";
import type {
  EraShaderMaterial,
  EraShaderMaterialRequest,
  EraShaderSurface,
} from "./types";

export type EraShaderCssVariables = Record<`--omega-era-${string}`, string>;

function cssVariables(
  shader: ReturnType<typeof resolveEraShader>
): EraShaderCssVariables {
  return {
    "--omega-era-cell-width": `${shader.cell[0]}px`,
    "--omega-era-cell-height": `${shader.cell[1]}px`,
    "--omega-era-tracking": `${shader.tracking}em`,
    "--omega-era-scan": String(shader.effects.scan),
    "--omega-era-dots": String(shader.effects.dots),
    "--omega-era-halo": String(shader.effects.halo),
    "--omega-era-persistence": String(shader.effects.persistence),
    "--omega-era-case": shader.casePolicy === "upper" ? "uppercase" : "none",
    "--omega-era-render-method": shader.renderMethod,
  };
}

/** Resolve one canonical material request for all presentation surfaces. */
export function createEraShaderMaterial(
  request: EraShaderMaterialRequest
): EraShaderMaterial {
  const shader = resolveEraShader(request.id);
  assertEraShaderBuilt(shader);
  return {
    shader,
    surface: request.surface,
    cssVariables: cssVariables(shader),
  };
}

export function eraShaderCssVariables(id: string): EraShaderCssVariables {
  return cssVariables(resolveEraShader(id));
}

/** Apply the shared material request to a DOM presentation surface. */
export function applyEraShaderCss(
  element: HTMLElement,
  id: string,
  surface: EraShaderSurface = "dialogue"
): void {
  const material = createEraShaderMaterial({ id, surface });
  for (const [name, value] of Object.entries(material.cssVariables))
    element.style.setProperty(name, value);
  element.dataset.eraShader = material.shader.id;
  element.dataset.eraSurface = material.surface;
}
