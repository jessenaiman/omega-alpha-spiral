import { defineEraShader } from "../types";

export const VECTOR_ERA_SHADERS = [
  defineEraShader({
    id: "vector-crt-stroke",
    order: 1,
    label: "Vector CRT stroke",
    introduced: 1950,
    commonUse: "1950s–1970s",
    device: "Research and defense CRTs, IBM 2250-class",
    designIntent: "Letters traced by a beam as thin lines, never filled.",
    recognizableTrait: "Open line letterforms with phosphor decay.",
    renderMethod: "vector-stroke",
    reveal: "stroke-order",
    casePolicy: "upper",
    cell: [24, 32],
    weight: 0.05,
    round: 1,
    tracking: 0.34,
    effects: { scan: 0.35, dots: 0, halo: 0.3, persistence: 0.6 },
    spatialAdaptation: "Thin 3D line segments with a slight phosphor trail.",
    recommended: true,
    confidence: "medium",
    sources: ["https://en.wikipedia.org/wiki/IBM_2250"],
  }),
] as const;
