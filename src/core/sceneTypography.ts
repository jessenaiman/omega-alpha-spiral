export type TypographyOwner = "omega" | "light" | "shadow" | "ambition";

/** A registered era-shader id, or one of the retired compatibility aliases. */
export type Era = string;
export type TypographyScene = "opening" | "floor1" | "floor2" | "floor3";

// Era shaders live in `src/era-shaders`. This file keeps scene ownership only.
// Ownership is settled. Era assignments remain editable art direction, independent of questions.
export const SCENES: Record<
  TypographyScene,
  { label: string; owner: TypographyOwner; era: Era }
> = {
  opening: {
    label: "Opening",
    owner: "omega",
    era: "dec-vt100-ascii-terminal",
  },
  floor1: { label: "Floor 1", owner: "light", era: "dec-vt100-ascii-terminal" },
  floor2: {
    label: "Floor 2",
    owner: "shadow",
    era: "dec-vt100-ascii-terminal",
  },
  floor3: {
    label: "Floor 3",
    owner: "ambition",
    era: "dec-vt100-ascii-terminal",
  },
};
