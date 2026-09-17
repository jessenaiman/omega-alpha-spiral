/**
 * Typed events — the seam between rules and presentation.
 *
 * Gameplay emits events. UI, audio, and VFX react to them. Nothing reaches
 * around this bus to mutate presentation directly, and nothing on the
 * presentation side mutates run state.
 *
 * The union below covers Scene 1's beats. A ticket that needs a new event adds
 * it here rather than inventing a second bus.
 */

import type { Affinity, Dreamweaver } from '../game/affinity';
import type { Rung } from '../game/ladder';

/** Omega is not a Dreamweaver and owns no affinity slot, but it does speak. */
export type SceneSpeaker = Dreamweaver | 'omega';

export type SceneEvent =
  | { readonly type: 'run.begin'; readonly seed: string; readonly echo: number }
  | {
      readonly type: 'question.ask';
      readonly speaker: SceneSpeaker;
      readonly questionId: string;
      readonly rung: Rung;
    }
  | {
      readonly type: 'choice.commit';
      readonly speaker: SceneSpeaker;
      readonly optionOwner: Dreamweaver;
    }
  | { readonly type: 'affinity.change'; readonly affinity: Affinity }
  | { readonly type: 'ladder.advance'; readonly step: number; readonly rung: Rung }
  /** A Dreamweaver asking whether it should keep typing or talk. Audio hook. */
  | { readonly type: 'dreamweaver.ask-to-speak'; readonly dreamweaver: Dreamweaver }
  /** A Dreamweaver speaking in a carrier without a language yet. Audio hook. */
  | { readonly type: 'dreamweaver.carrier'; readonly dreamweaver: Dreamweaver }
  | { readonly type: 'name.submit'; readonly value: string }
  | {
      readonly type: 'run.complete';
      readonly pairing: Dreamweaver | null;
      readonly rotation: readonly Dreamweaver[];
    };

export type SceneEventType = SceneEvent['type'];

export type SceneEventOf<T extends SceneEventType> = Extract<SceneEvent, { type: T }>;

export type SceneEventHandler<T extends SceneEventType> = (event: SceneEventOf<T>) => void;

/** Unsubscribe by calling the function `on` returns. */
export type Unsubscribe = () => void;

export interface EventBus {
  on<T extends SceneEventType>(type: T, handler: SceneEventHandler<T>): Unsubscribe;
  off<T extends SceneEventType>(type: T, handler: SceneEventHandler<T>): void;
  emit(event: SceneEvent): void;
  /** How many handlers are attached to a given event type. */
  count(type: SceneEventType): number;
  clear(): void;
}

export function createEventBus(): EventBus {
  const handlers = new Map<SceneEventType, Set<(event: SceneEvent) => void>>();

  return {
    on<T extends SceneEventType>(type: T, handler: SceneEventHandler<T>): Unsubscribe {
      let set = handlers.get(type);
      if (!set) {
        set = new Set();
        handlers.set(type, set);
      }
      set.add(handler as (event: SceneEvent) => void);
      return () => {
        set?.delete(handler as (event: SceneEvent) => void);
      };
    },
    off<T extends SceneEventType>(type: T, handler: SceneEventHandler<T>): void {
      handlers.get(type)?.delete(handler as (event: SceneEvent) => void);
    },
    emit(event: SceneEvent): void {
      const set = handlers.get(event.type);
      if (!set) return;
      // Iterate a copy so a handler may unsubscribe itself mid-emit.
      for (const handler of [...set]) handler(event);
    },
    count(type: SceneEventType): number {
      return handlers.get(type)?.size ?? 0;
    },
    clear(): void {
      handlers.clear();
    },
  };
}

/** Forward a list of events through a bus, in order. */
export function emitAll(bus: EventBus, events: readonly SceneEvent[]): void {
  for (const event of events) bus.emit(event);
}
