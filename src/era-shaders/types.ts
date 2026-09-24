export type EraShaderRenderMethod =
  | "character-cell"
  | "bitmap-gui"
  | "outline"
  | "subpixel"
  | "vector-stroke"
  | "impact";

export type EraShaderSurface =
  "dialogue" | "choice" | "hud" | "menu" | "npc-label" | "world-prompt";

export const ERA_SHADER_SURFACES: readonly EraShaderSurface[] = [
  "dialogue",
  "choice",
  "hud",
  "menu",
  "npc-label",
  "world-prompt",
] as const;

/** A reusable visual treatment. Speaker timing and personality stay in .omd files. */
export interface EraShaderDefinition {
  readonly id: string;
  readonly order: number;
  readonly label: string;
  readonly introduced: number;
  readonly commonUse: string;
  readonly device: string;
  readonly designIntent: string;
  readonly recognizableTrait: string;
  readonly renderMethod: EraShaderRenderMethod;
  readonly reveal:
    "char-stream" | "line" | "block" | "stroke-order" | "page" | "progressive";
  readonly casePolicy: "mixed" | "upper";
  readonly columns?: number;
  readonly cell: readonly [number, number];
  readonly weight: number;
  readonly round: number;
  readonly tracking: number;
  readonly effects: {
    readonly scan: number;
    readonly dots: number;
    readonly halo: number;
    readonly persistence: number;
  };
  readonly spatialAdaptation: string;
  readonly recommended: boolean;
  readonly confidence: "high" | "medium" | "low-medium";
  readonly sources: readonly string[];
}

export const defineEraShader = <T extends EraShaderDefinition>(
  definition: T
): T => definition;
