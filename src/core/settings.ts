/**
 * Scene settings.
 *
 * One store, read by players and by the acceptance hooks alike: the reduced
 * motion control a player flips in the pause flow is the same value the test
 * hooks flip, so a capture can never prove a state the game could not reach.
 *
 * Reduced motion follows the operating system preference at startup unless a
 * caller says otherwise.
 */

export interface SceneSettings {
  /** Replaces the journey, spins, and FOV movement with cuts and wipes. */
  readonly reducedMotion: boolean;
  /** Hides development and debug surfaces from the player's view. */
  readonly debugHidden: boolean;
}

export type SettingsListener = (value: SceneSettings) => void;

export interface SettingsStore {
  readonly value: SceneSettings;
  set(patch: Partial<SceneSettings>): SceneSettings;
  subscribe(listener: SettingsListener): () => void;
}

function prefersReducedMotion(): boolean {
  if (typeof globalThis.matchMedia !== 'function') return false;
  return globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function createSettings(
  initial: Partial<SceneSettings> = {},
  environment: { prefersReducedMotion?: () => boolean } = {},
): SettingsStore {
  const readPreference = environment.prefersReducedMotion ?? prefersReducedMotion;
  let value: SceneSettings = {
    reducedMotion: initial.reducedMotion ?? readPreference(),
    debugHidden: initial.debugHidden ?? false,
  };
  const listeners = new Set<SettingsListener>();

  return {
    get value(): SceneSettings {
      return value;
    },
    set(patch: Partial<SceneSettings>): SceneSettings {
      const next: SceneSettings = { ...value, ...patch };
      if (next.reducedMotion === value.reducedMotion && next.debugHidden === value.debugHidden) {
        return value;
      }
      value = next;
      for (const listener of [...listeners]) listener(value);
      return value;
    },
    subscribe(listener: SettingsListener): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
