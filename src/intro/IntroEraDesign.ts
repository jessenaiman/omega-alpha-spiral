import { GHOST_QUESTIONS } from "../dialogue/ghost-vite";
import { PROFILES } from "../dialogue/personas";
import { resolveEraShader } from "../era-shaders";

export interface IntroEraDesign {
  readonly id: number;
  readonly eraShaderId: string;
  readonly year: number;
  readonly label: string;
  readonly cell: number;
  readonly font: string;
  readonly weight: number;
  readonly ink: number;
  readonly echo: number;
  readonly pixelSnap: number;
  readonly depth: number;
  readonly scanline: number;
  /** How much of this generation survives underneath a later display layer. */
  readonly retention: number;
  /** Native signal damage applied after all reached generations are composited. */
  readonly damage: number;
  readonly bitDepth: number;
}

// The four Ghost OML files own stage order and era IDs. The shared era shader
// registry owns historical display traits; this adapter only places them in 3D.
// https://github.com/jessenaiman/omega-alpha-spiral/tree/main/src/dialogue
export const INTRO_ERAS: readonly IntroEraDesign[] = GHOST_QUESTIONS.map(
  (question, id) => {
    const shader = resolveEraShader(question.eraShaderId);
    const isBitmap = shader.renderMethod === "bitmap-gui";
    return {
      id,
      eraShaderId: shader.id,
      year: shader.introduced,
      label: shader.label,
      cell: Math.max(...shader.cell),
      font: isBitmap ? "Geneva, Chicago, monospace" : "monospace",
      weight: isBitmap ? 400 : 700,
      ink: Number.parseInt(PROFILES.omega.color.slice(1), 16),
      echo: isBitmap ? 0x353a3d : 0x233944,
      pixelSnap: isBitmap ? 0.25 : shader.cell[1] <= 8 ? 0.85 : 0.6,
      depth: isBitmap ? 0.025 : 0,
      scanline: shader.effects.scan,
      retention: 0.22,
      damage: 0.08 + shader.effects.halo * 0.3,
      bitDepth: isBitmap ? 1 : shader.id === "ibm-pc-cga" ? 4 : 3,
    };
  }
);

export function getIntroEra(value: number): IntroEraDesign {
  return INTRO_ERAS[Math.max(0, Math.min(INTRO_ERAS.length - 1, Math.floor(value)))] ?? INTRO_ERAS[0];
}
