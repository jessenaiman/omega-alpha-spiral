export type ChamberObjectId = 'door' | 'monster' | 'chest';

export interface ChamberObject {
  readonly id: ChamberObjectId;
  readonly label: string;
  readonly tile: { readonly x: number; readonly z: number };
  readonly action: { readonly kind: string };
  readonly story: string;
}

export interface ChamberOutcome {
  readonly objectId: ChamberObjectId;
  readonly action: { readonly kind: string };
  readonly story: string;
}

export const LIGHT_CHAMBER_OBJECTS: readonly ChamberObject[] = [
  {
    id: 'door',
    label: 'Door',
    tile: { x: 3, z: 3 },
    action: { kind: 'prompt' },
    story: 'A question waits beyond the frame. The chamber remembers that you approached it.',
  },
  {
    id: 'monster',
    label: 'Monster',
    tile: { x: 0, z: 2 },
    action: { kind: 'encounter' },
    story: 'The shape tests your nerve, then recedes into its own reflection.',
  },
  {
    id: 'chest',
    label: 'Chest',
    tile: { x: 2, z: 2 },
    action: { kind: 'reveal' },
    story: 'The lid opens on a broken compass. Its needle points back at you.',
  },
];

export interface ChamberRun {
  readonly outcome: ChamberOutcome | null;
  activate(id: ChamberObjectId): ChamberOutcome | null;
  restart(): void;
}

export function createChamberRun(objects: readonly ChamberObject[]): ChamberRun {
  let outcome: ChamberOutcome | null = null;

  return {
    get outcome(): ChamberOutcome | null {
      return outcome;
    },
    activate(id: ChamberObjectId): ChamberOutcome | null {
      const object = objects.find(candidate => candidate.id === id);
      outcome = object
        ? { objectId: object.id, action: { ...object.action }, story: object.story }
        : null;
      return outcome;
    },
    restart(): void {
      outcome = null;
    },
  };
}
