import { defineEraShader } from "../types";

export const SUBPIXEL_ERA_SHADERS = [
  defineEraShader({
    id: "freetype-lcd-modern",
    order: 18,
    label: "FreeType LCD modern",
    introduced: 1996,
    commonUse: "2000s–present",
    device: "Modern OS, LCD panels, browsers",
    designIntent: "Anti-aliased contemporary screen text.",
    recognizableTrait: "Crisp flat text with a faint display glow.",
    renderMethod: "subpixel",
    reveal: "progressive",
    casePolicy: "mixed",
    cell: [64, 128],
    weight: 0.05,
    round: 1,
    tracking: 0.3,
    effects: { scan: 0, dots: 0, halo: 0.025, persistence: 0 },
    spatialAdaptation: "Crisp flat panels, readable at a distance.",
    recommended: false,
    confidence: "high",
    sources: ["https://www.freetype.org/"],
  }),
] as const;
