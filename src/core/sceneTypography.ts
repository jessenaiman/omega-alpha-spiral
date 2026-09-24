export type TypographyOwner = "omega" | "light" | "shadow" | "ambition";

/** A display-tradition id, or one of the retired `phosphor|dos|gui|smooth` aliases. */
export type Era = string;
export type TypographyScene = "opening" | "floor1" | "floor2" | "floor3";

// Lettering lives in `src/core/lettering/traditions.ts`. This file keeps scene ownership only.
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
