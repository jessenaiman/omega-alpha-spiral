/**
 * Spiral Breaker — a tiny keyed tween manager.
 *
 * Feedback tweens (stretch, squash, flashes) must animate with the REAL render
 * delta, never the gameplay delta, so they stay live during hitstop. `cancel`
 * lets a new contact replace a half-finished one (a squash mid-stretch) instead
 * of stacking. Treated as history after the window closes.
 */

export type Easing = (t: number) => number;

export const easeInQuad: Easing = (t) => t * t;
export const easeOutCubic: Easing = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutBack: Easing = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

interface ActiveTween {
  key: string;
  elapsed: number;
  duration: number;
  easing: Easing;
  onUpdate: (value: number) => void;
  onComplete?: () => void;
}

export interface TweenManager {
  /** Animates `onUpdate` from easing(0) to easing(1) over `durationSec`. */
  tween(
    key: string,
    durationSec: number,
    onUpdate: (value: number) => void,
    easing?: Easing,
    onComplete?: () => void
  ): void;
  /** Replaces a keyed tween immediately, ignoring its current value. */
  cancel(key: string): void;
  update(delta: number): void;
}

export function createTweenManager(): TweenManager {
  const tweens: ActiveTween[] = [];

  return {
    tween(key, durationSec, onUpdate, easing = easeOutCubic, onComplete) {
      const active = tweens.find((entry) => entry.key === key);
      if (active) {
        active.elapsed = 0;
        active.duration = durationSec;
        active.easing = easing;
        active.onUpdate = onUpdate;
        active.onComplete = onComplete;
        return;
      }
      tweens.push({
        key,
        elapsed: 0,
        duration: durationSec,
        easing,
        onUpdate,
        onComplete,
      });
    },
    cancel(key) {
      for (let index = tweens.length - 1; index >= 0; index -= 1) {
        if (tweens[index]?.key === key) {
          tweens.splice(index, 1);
          return;
        }
      }
    },
    update(delta) {
      for (let index = tweens.length - 1; index >= 0; index -= 1) {
        const tween = tweens[index] as ActiveTween;
        tween.elapsed += delta;
        const k = Math.min(tween.elapsed / tween.duration, 1);
        tween.onUpdate(tween.easing(k));
        if (tween.elapsed >= tween.duration) {
          tweens.splice(index, 1);
          tween.onComplete?.();
        }
      }
    },
  };
}
