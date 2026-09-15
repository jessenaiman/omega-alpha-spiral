import type { Lineage } from './types.js';

const LINEAGE_KEY = 'omega-spiral.lineage.v1';

const isLineage = (value: unknown): value is Lineage => {
  if (typeof value !== 'object' || value === null) return false;
  const lineage = value as Record<string, unknown>;
  return Number.isInteger(lineage.baseInstanceId)
    && (lineage.baseInstanceId as number) >= 100
    && (lineage.baseInstanceId as number) <= 999
    && Number.isInteger(lineage.loopCount)
    && (lineage.loopCount as number) >= 0;
};

export const saveLineage = (storage: Storage, lineage: Lineage): void => {
  storage.setItem(LINEAGE_KEY, JSON.stringify(lineage));
};

export const loadLineage = (storage: Storage, random: () => number): Lineage => {
  const stored = storage.getItem(LINEAGE_KEY);
  if (stored !== null) {
    try {
      const lineage: unknown = JSON.parse(stored);
      if (isLineage(lineage)) {
        return {
          baseInstanceId: lineage.baseInstanceId,
          loopCount: lineage.loopCount,
        };
      }
    } catch {
      // Replace malformed session data below.
    }
  }

  const lineage = {
    baseInstanceId: 100 + Math.floor(random() * 900),
    loopCount: 0,
  };
  saveLineage(storage, lineage);
  return lineage;
};
