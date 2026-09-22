export interface IntroEraDesign {
  readonly id: number;
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

/** Display capabilities Omega recovers in chronological order. */
export const INTRO_ERAS: readonly IntroEraDesign[] = [
  {
    id: 0, year: 1977, label: 'ATARI 2600', cell: 12,
    font: 'monospace', weight: 700, ink: 0xf4f0d0, echo: 0x241810,
    pixelSnap: 1, depth: 0, scanline: 0.12, retention: 0.2, damage: 0.2, bitDepth: 4,
  },
  {
    id: 1, year: 1981, label: 'IBM PC / CGA', cell: 16,
    font: '"Courier New", monospace', weight: 400, ink: 0x55ffb0, echo: 0x082b22,
    pixelSnap: 0.8, depth: 0, scanline: 0.34, retention: 0.18, damage: 0.13, bitDepth: 4,
  },
  {
    id: 2, year: 1982, label: 'COMMODORE 64', cell: 18,
    font: '"Lucida Console", monospace', weight: 700, ink: 0xa9a8ff, echo: 0x25236e,
    pixelSnap: 0.65, depth: 0.015, scanline: 0.18, retention: 0.16, damage: 0.17, bitDepth: 4,
  },
  {
    id: 3, year: 1984, label: 'MACINTOSH DESKTOP', cell: 24,
    font: 'Geneva, Chicago, monospace', weight: 400, ink: 0xf3f4ed, echo: 0x353a3d,
    pixelSnap: 0.4, depth: 0.025, scanline: 0.05, retention: 0.14, damage: 0.08, bitDepth: 1,
  },
  {
    id: 4, year: 1985, label: 'AMIGA', cell: 32,
    font: 'Topaz, "Courier New", monospace', weight: 400, ink: 0xffca70, echo: 0x542968,
    pixelSnap: 0.22, depth: 0.08, scanline: 0.08, retention: 0.12, damage: 0.11, bitDepth: 5,
  },
  {
    id: 5, year: 1985, label: 'NINTENDO', cell: 40,
    font: 'monospace', weight: 700, ink: 0xf8f3dc, echo: 0x6c2035,
    pixelSnap: 0.5, depth: 0.04, scanline: 0.02, retention: 0.1, damage: 0.05, bitDepth: 6,
  },
] as const;

export function getIntroEra(value: number): IntroEraDesign {
  return INTRO_ERAS[Math.max(0, Math.min(INTRO_ERAS.length - 1, Math.floor(value)))] ?? INTRO_ERAS[0];
}
