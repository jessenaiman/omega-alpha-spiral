export type TypographyOwner = "omega" | "light" | "shadow" | "ambition";

export type Era = "phosphor" | "dos" | "gui" | "smooth";
export type TypographyScene = "opening" | "floor1" | "floor2" | "floor3";

// Art-direction presets inspired by periods, not hardware/font emulators.
export const ERAS: Record<
  Era,
  {
    label: string;
    font: string;
    cellWidth: number;
    cellHeight: number;
    scan: number;
    dots: number;
    halo: number;
    tracking: number;
  }
> = {
  phosphor: {
    label: "1970s · phosphor dots",
    font: "bold 12px 'Courier New', monospace",
    cellWidth: 9,
    cellHeight: 16,
    scan: 0.2,
    dots: 1,
    halo: 0.12,
    tracking: 0.34,
  },
  dos: {
    label: "1980s · DOS blocks",
    font: "bold 14px Consolas, monospace",
    cellWidth: 9,
    cellHeight: 16,
    scan: 0,
    dots: 0,
    halo: 0.005,
    tracking: 0.34,
  },
  gui: {
    label: "1990s · desktop bitmap",
    font: "15px Tahoma, sans-serif",
    cellWidth: 14,
    cellHeight: 22,
    scan: 0,
    dots: 0,
    halo: 0.012,
    tracking: 0.31,
  },
  smooth: {
    label: "2000s · smooth screen",
    font: "72px Arial, sans-serif",
    cellWidth: 64,
    cellHeight: 128,
    scan: 0,
    dots: 0,
    halo: 0.025,
    tracking: 0.3,
  },
};

// Ownership is settled. Era assignments remain editable art direction, independent of questions.
export const SCENES: Record<
  TypographyScene,
  { label: string; owner: TypographyOwner; era: Era }
> = {
  opening: { label: "Opening", owner: "omega", era: "phosphor" },
  floor1: { label: "Floor 1", owner: "light", era: "phosphor" },
  floor2: { label: "Floor 2", owner: "shadow", era: "phosphor" },
  floor3: { label: "Floor 3", owner: "ambition", era: "phosphor" },
};
