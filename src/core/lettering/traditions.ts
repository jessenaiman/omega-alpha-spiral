// Display traditions: Omega's reconstruction ladder. Letterforms are generated from
// ./skeleton — nothing here is a loaded font. Order is chronological reconstruction order.

export type RenderMethod =
  | "character-cell"
  | "bitmap-gui"
  | "outline"
  | "subpixel"
  | "vector-stroke"
  | "impact";

export interface Tradition {
  id: string;
  order: number;
  label: string;
  introduced: number;
  commonUse: string;
  device: string;
  designIntent: string;
  recognizableTrait: string;
  renderMethod: RenderMethod;
  reveal: "char-stream" | "line" | "block" | "stroke-order" | "page" | "progressive";
  casePolicy: "mixed" | "upper";
  columns?: number;
  cell: [number, number];
  weight: number;
  round: number;
  tracking: number;
  effects: { scan: number; dots: number; halo: number; persistence: number };
  spatialAdaptation: string;
  recommended: boolean;
  confidence: "high" | "medium" | "low-medium";
  sources: string[];
}

/** Methods with a built render path. The rest show as `render path pending`. */
export const BUILT_METHODS: RenderMethod[] = ["character-cell", "bitmap-gui", "outline", "subpixel"];

const t = (x: Tradition) => x;

export const TRADITIONS: Tradition[] = [
  t({
    id: "vector-crt-stroke", order: 1, label: "Vector CRT stroke", introduced: 1950,
    commonUse: "1950s–1970s", device: "Research and defense CRTs, IBM 2250-class",
    designIntent: "Letters traced by a beam as thin lines, never filled.",
    recognizableTrait: "Open line letterforms with phosphor decay.",
    renderMethod: "vector-stroke", reveal: "stroke-order", casePolicy: "upper",
    cell: [24, 32], weight: 0.05, round: 1, tracking: 0.34,
    effects: { scan: 0.35, dots: 0, halo: 0.3, persistence: 0.6 },
    spatialAdaptation: "Thin 3D line segments with a slight phosphor trail.",
    recommended: true, confidence: "medium",
    sources: ["https://en.wikipedia.org/wiki/IBM_2250"],
  }),
  t({
    id: "ibm-1403-line-printer", order: 2, label: "IBM 1403 line printer", introduced: 1959,
    commonUse: "1960s–1970s", device: "IBM 1403 print chain",
    designIntent: "Heavy industrial uppercase hammered a full line at a time.",
    recognizableTrait: "Green-bar continuous paper, line-at-a-time reveal.",
    renderMethod: "impact", reveal: "line", casePolicy: "upper", columns: 132,
    cell: [10, 16], weight: 0.17, round: 0, tracking: 0.33,
    effects: { scan: 0, dots: 0, halo: 0, persistence: 0 },
    spatialAdaptation: "A continuous green-bar sheet that advances with a mechanical snap.",
    recommended: false, confidence: "medium",
    sources: ["https://en.wikipedia.org/wiki/IBM_1403"],
  }),
  t({
    id: "teletype-asr33", order: 3, label: "Teletype paper uppercase", introduced: 1963,
    commonUse: "1963–late 1970s", device: "Teletype Model 33 ASR",
    designIntent: "Mechanical uppercase type on paper, never a screen.",
    recognizableTrait: "All-caps impact print on a floating paper strip.",
    renderMethod: "impact", reveal: "char-stream", casePolicy: "upper", columns: 72,
    cell: [9, 16], weight: 0.16, round: 0, tracking: 0.34,
    effects: { scan: 0, dots: 0, halo: 0, persistence: 0 },
    spatialAdaptation: "Mount glyphs on a floating paper strip with fixed columns.",
    recommended: true, confidence: "medium",
    sources: ["https://en.wikipedia.org/wiki/Teletype_Model_33"],
  }),
  t({
    id: "ibm-2260-character-crt", order: 4, label: "IBM 2260 character CRT", introduced: 1964,
    commonUse: "late 1960s", device: "IBM 2260 display station",
    designIntent: "An early glass terminal with a coarse buffered character grid.",
    recognizableTrait: "Soft monochrome phosphor on a small curved plane.",
    renderMethod: "character-cell", reveal: "block", casePolicy: "mixed", columns: 80,
    cell: [9, 16], weight: 0.15, round: 0, tracking: 0.34,
    effects: { scan: 0.18, dots: 1, halo: 0.1, persistence: 0.3 },
    spatialAdaptation: "A single curved CRT plane with a coarse grid.",
    recommended: false, confidence: "low-medium",
    sources: ["https://en.wikipedia.org/wiki/IBM_2260"],
  }),
  t({
    id: "ibm-3270-block-terminal", order: 5, label: "IBM 3270 block green terminal", introduced: 1971,
    commonUse: "1970s–1990s", device: "IBM 3270 family",
    designIntent: "A monospaced green form that updates in blocks, not streams.",
    recognizableTrait: "Protected field regions and a block cursor.",
    renderMethod: "character-cell", reveal: "block", casePolicy: "upper", columns: 80,
    cell: [9, 16], weight: 0.16, round: 0, tracking: 0.34,
    effects: { scan: 0.14, dots: 0.6, halo: 0.14, persistence: 0.25 },
    spatialAdaptation: "A rectangular terminal plane divided into field regions.",
    recommended: true, confidence: "high",
    sources: ["https://en.wikipedia.org/wiki/IBM_3270"],
  }),
  t({
    id: "xerox-star-bitmap-gui", order: 6, label: "Xerox Star bitmap GUI", introduced: 1973,
    commonUse: "early 1980s niche", device: "Xerox Alto / 8010 Star",
    designIntent: "Hard 1-bit proportional letters on paper-like windows.",
    recognizableTrait: "Black-on-white document cards, no anti-aliasing.",
    renderMethod: "bitmap-gui", reveal: "progressive", casePolicy: "mixed",
    cell: [16, 22], weight: 0.12, round: 0, tracking: 0.32,
    effects: { scan: 0, dots: 0, halo: 0.008, persistence: 0 },
    spatialAdaptation: "Flat document cards on a monochrome desktop plane.",
    recommended: false, confidence: "medium",
    sources: ["https://en.wikipedia.org/wiki/Xerox_Star"],
  }),
  t({
    id: "home-micro-rom", order: 7, label: "Home micro ROM pixel", introduced: 1977,
    commonUse: "1977–mid 1980s", device: "Apple II, TRS-80, Commodore PET",
    designIntent: "Chunky uppercase ROM letters on a coarse tile grid.",
    recognizableTrait: "Hard 8×8 pixels, 40 columns, no lowercase.",
    renderMethod: "character-cell", reveal: "char-stream", casePolicy: "upper", columns: 40,
    cell: [8, 8], weight: 0.2, round: 0, tracking: 0.36,
    effects: { scan: 0.1, dots: 0, halo: 0.01, persistence: 0.15 },
    spatialAdaptation: "Glyphs snapped to a coarse tile grid with hard edges.",
    recommended: true, confidence: "medium",
    sources: ["https://en.wikipedia.org/wiki/Apple_II_series"],
  }),
  t({
    id: "dec-vt100-ascii-terminal", order: 8, label: "VT100 phosphor terminal", introduced: 1978,
    commonUse: "1980s", device: "DEC VT100 video terminal",
    designIntent: "Streaming monospaced ASCII on a single phosphor family.",
    recognizableTrait: "Character-at-a-time reveal with a soft halo.",
    renderMethod: "character-cell", reveal: "char-stream", casePolicy: "mixed", columns: 80,
    cell: [9, 16], weight: 0.13, round: 0, tracking: 0.34,
    effects: { scan: 0.2, dots: 1, halo: 0.12, persistence: 0.4 },
    spatialAdaptation: "A flat terminal plane with monospaced cells and phosphor material.",
    recommended: true, confidence: "high",
    sources: ["https://vt100.net/docs/vt100-ug/"],
  }),
  t({
    id: "ibm-pc-cga", order: 9, label: "IBM PC CGA text", introduced: 1981,
    commonUse: "1980s", device: "IBM PC with Color Graphics Adapter",
    designIntent: "Hard 8×8 cells from a BIOS ROM character generator.",
    recognizableTrait: "Chunky bright DOS blocks in a limited palette.",
    renderMethod: "character-cell", reveal: "char-stream", casePolicy: "mixed", columns: 80,
    cell: [8, 8], weight: 0.19, round: 0, tracking: 0.36,
    effects: { scan: 0.06, dots: 0, halo: 0.006, persistence: 0.1 },
    spatialAdaptation: "A fixed 80-column grid of hard 8×8 cells.",
    recommended: false, confidence: "high",
    sources: ["https://en.wikipedia.org/wiki/Color_Graphics_Adapter"],
  }),
  t({
    id: "apple-macintosh-quickdraw", order: 10, label: "Macintosh QuickDraw UI", introduced: 1984,
    commonUse: "late 1980s onward", device: "Apple Macintosh, QuickDraw",
    designIntent: "Proportional 1-bit UI letters with a menu bar silhouette.",
    recognizableTrait: "Crisp black-and-white desktop text.",
    renderMethod: "bitmap-gui", reveal: "progressive", casePolicy: "mixed",
    cell: [14, 20], weight: 0.12, round: 0, tracking: 0.32,
    effects: { scan: 0, dots: 0, halo: 0.006, persistence: 0 },
    spatialAdaptation: "Flat black-and-white window planes with proportional text.",
    recommended: false, confidence: "medium",
    sources: ["https://en.wikipedia.org/wiki/Chicago_(typeface)"],
  }),
  t({
    id: "amiga-workbench", order: 11, label: "Amiga Workbench", introduced: 1985,
    commonUse: "late 1980s", device: "Commodore Amiga, Workbench",
    designIntent: "Chunky bitmap UI text in a small, playful palette.",
    recognizableTrait: "8×8-style bitmap letters on a coloured desktop.",
    renderMethod: "character-cell", reveal: "progressive", casePolicy: "mixed", columns: 80,
    cell: [8, 8], weight: 0.19, round: 0, tracking: 0.36,
    effects: { scan: 0.05, dots: 0, halo: 0.01, persistence: 0.12 },
    spatialAdaptation: "Simple desktop planes with hard bitmap UI text.",
    recommended: false, confidence: "medium",
    sources: ["https://en.wikipedia.org/wiki/Amiga_Workbench"],
  }),
  t({
    id: "postscript-laser-printing", order: 12, label: "PostScript laser page", introduced: 1985,
    commonUse: "late 1980s–1990s", device: "PostScript printers, LaserWriter-class",
    designIntent: "Crisp scalable outlines rasterised onto a finished page.",
    recognizableTrait: "Clean page composition with real margins and kerning.",
    renderMethod: "outline", reveal: "page", casePolicy: "mixed",
    cell: [48, 96], weight: 0.06, round: 1, tracking: 0.3,
    effects: { scan: 0, dots: 0, halo: 0.012, persistence: 0 },
    spatialAdaptation: "Finished page planes with high-resolution black type.",
    recommended: false, confidence: "high",
    sources: ["https://en.wikipedia.org/wiki/PostScript"],
  }),
  t({
    id: "ibm-pc-vga", order: 13, label: "DOS VGA console", introduced: 1987,
    commonUse: "late 1980s–1990s", device: "IBM VGA-compatible PC display",
    designIntent: "Crisp 9×16 DOS console cells, hard-edged even when floating.",
    recognizableTrait: "Dense orderly console text with a block cursor.",
    renderMethod: "character-cell", reveal: "char-stream", casePolicy: "mixed", columns: 80,
    cell: [9, 16], weight: 0.15, round: 0, tracking: 0.34,
    effects: { scan: 0, dots: 0, halo: 0.005, persistence: 0 },
    spatialAdaptation: "A crisp 80×25 grid with hard pixel edges.",
    recommended: true, confidence: "high",
    sources: ["https://en.wikipedia.org/wiki/Video_Graphics_Array"],
  }),
  t({
    id: "ansi-bbs-dos-art", order: 14, label: "ANSI BBS art", introduced: 1986,
    commonUse: "late 1980s–1990s", device: "MS-DOS, BBS, ANSI.SYS",
    designIntent: "A screen painted with colour blocks and escape codes.",
    recognizableTrait: "Block borders, cursor painting, saturated 16-colour fills.",
    renderMethod: "character-cell", reveal: "progressive", casePolicy: "mixed", columns: 80,
    cell: [8, 16], weight: 0.19, round: 0, tracking: 0.36,
    effects: { scan: 0.12, dots: 0.4, halo: 0.02, persistence: 0.2 },
    spatialAdaptation: "An 80×25 canvas of cells plus block-drawing borders.",
    recommended: false, confidence: "medium",
    sources: ["https://en.wikipedia.org/wiki/ANSI_art"],
  }),
  t({
    id: "x11-motif-workstation", order: 15, label: "X11 / Motif workstation", introduced: 1987,
    commonUse: "1990s", device: "Unix workstations, Motif, CDE",
    designIntent: "Restrained bevels and institutional labels on grey planes.",
    recognizableTrait: "Flat workstation windows with crisp proportional labels.",
    renderMethod: "bitmap-gui", reveal: "progressive", casePolicy: "mixed",
    cell: [14, 22], weight: 0.11, round: 0, tracking: 0.32,
    effects: { scan: 0, dots: 0, halo: 0.01, persistence: 0 },
    spatialAdaptation: "Workstation window planes with restrained bevels.",
    recommended: false, confidence: "medium",
    sources: ["https://en.wikipedia.org/wiki/Motif_(user_interface)"],
  }),
  t({
    id: "os2-presentation-manager", order: 16, label: "OS/2 Workplace Shell", introduced: 1988,
    commonUse: "early–mid 1990s", device: "IBM OS/2 Presentation Manager",
    designIntent: "Object-desktop windows with folder-like containers.",
    recognizableTrait: "Beveled IBM UI controls, no translucency.",
    renderMethod: "bitmap-gui", reveal: "progressive", casePolicy: "mixed",
    cell: [14, 22], weight: 0.11, round: 0, tracking: 0.31,
    effects: { scan: 0, dots: 0, halo: 0.012, persistence: 0 },
    spatialAdaptation: "Window and object planes with restrained bevels.",
    recommended: true, confidence: "medium",
    sources: ["https://en.wikipedia.org/wiki/Presentation_Manager"],
  }),
  t({
    id: "windows-31-truetype", order: 17, label: "TrueType desktop", introduced: 1992,
    commonUse: "mid 1990s onward", device: "Windows 3.1-era PC",
    designIntent: "Scalable office lettering on grey window chrome.",
    recognizableTrait: "Smooth proportional text in an office desktop.",
    renderMethod: "outline", reveal: "progressive", casePolicy: "mixed",
    cell: [56, 112], weight: 0.055, round: 1, tracking: 0.3,
    effects: { scan: 0, dots: 0, halo: 0.018, persistence: 0 },
    spatialAdaptation: "Smooth scalable text on grey desktop window planes.",
    recommended: true, confidence: "high",
    sources: ["https://en.wikipedia.org/wiki/TrueType"],
  }),
  t({
    id: "freetype-lcd-modern", order: 18, label: "FreeType LCD modern", introduced: 1996,
    commonUse: "2000s–present", device: "Modern OS, LCD panels, browsers",
    designIntent: "Anti-aliased contemporary screen text.",
    recognizableTrait: "Crisp flat text with a faint display glow.",
    renderMethod: "subpixel", reveal: "progressive", casePolicy: "mixed",
    cell: [64, 128], weight: 0.05, round: 1, tracking: 0.3,
    effects: { scan: 0, dots: 0, halo: 0.025, persistence: 0 },
    spatialAdaptation: "Crisp flat panels, readable at a distance.",
    recommended: false, confidence: "high",
    sources: ["https://www.freetype.org/"],
  }),
];

export const TRADITION_BY_ID: Record<string, Tradition> = Object.fromEntries(
  TRADITIONS.map((x) => [x.id, x])
);

/** Read-only compatibility: the four retired preset ids still resolve. */
export const LEGACY_ERA_ALIAS: Record<string, string> = {
  phosphor: "dec-vt100-ascii-terminal",
  dos: "ibm-pc-vga",
  gui: "os2-presentation-manager",
  smooth: "freetype-lcd-modern",
};

export function resolveTradition(id: string | undefined): Tradition {
  return TRADITION_BY_ID[LEGACY_ERA_ALIAS[id ?? ""] ?? id ?? ""] ?? TRADITIONS[7];
}

export const isBuilt = (x: Tradition) => BUILT_METHODS.includes(x.renderMethod);
