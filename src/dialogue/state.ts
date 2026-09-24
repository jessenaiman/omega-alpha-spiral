import type { OmlStateEffect } from "../core/oml";

export type DialogueStateSnapshot = Record<string, unknown>;

/** Applies the schema-approved state operations authored in .oml choices. */
export class DialogueState {
  private values: DialogueStateSnapshot = {};

  apply(effects: readonly OmlStateEffect[]): void {
    for (const effect of effects) this.applyOne(effect);
  }

  snapshot(): DialogueStateSnapshot {
    return structuredClone(this.values);
  }

  reset(): void {
    this.values = {};
  }

  private applyOne(effect: OmlStateEffect): void {
    const parts = effect.path.split(".").filter(Boolean);
    if (!parts.length) throw new Error("Dialogue state path cannot be empty.");
    let target = this.values;
    for (const part of parts.slice(0, -1)) {
      const current = target[part];
      if (
        typeof current !== "object" ||
        current === null ||
        Array.isArray(current)
      )
        target[part] = {};
      target = target[part] as DialogueStateSnapshot;
    }
    const key = parts.at(-1)!;
    if (effect.operation === "set") {
      target[key] = effect.value;
      return;
    }
    const current = target[key];
    if (current !== undefined && typeof current !== "number")
      throw new Error(
        `Cannot increment non-number dialogue state: ${effect.path}`
      );
    if (typeof effect.value !== "number")
      throw new Error(`Increment value must be numeric: ${effect.path}`);
    target[key] = (current ?? 0) + effect.value;
  }
}
