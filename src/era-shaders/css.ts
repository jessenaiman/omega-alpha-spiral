import { resolveEraShader } from "./registry";

export type EraShaderCssVariables = Record<`--omega-era-${string}`, string>;

/** DOM gameplay UI consumes the same era definition as Three.js text materials. */
export function eraShaderCssVariables(id: string): EraShaderCssVariables {
  const shader = resolveEraShader(id);
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

export function applyEraShaderCss(element: HTMLElement, id: string): void {
  const variables = eraShaderCssVariables(id);
  for (const [name, value] of Object.entries(variables))
    element.style.setProperty(name, value);
  element.dataset.eraShader = resolveEraShader(id).id;
}
