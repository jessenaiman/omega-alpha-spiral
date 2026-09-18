/**
 * Spiral Breaker — sound.
 *
 * Every noise is synthesised from oscillators and a little noise, so the game
 * ships with no audio files. The context is created on the first gesture and
 * stays muted until then; a mute toggle is exposed for the HUD. Variation runs
 * through the seeded generator, never the platform global.
 */

import { createRng } from '../../core';
import type { ArcadeEvent } from '../game';

export interface Sfx {
  readonly unlocked: boolean;
  readonly muted: boolean;
  /** Call from a real user gesture. Safe to call repeatedly. */
  unlock(): void;
  setMuted(muted: boolean): boolean;
  handle(events: readonly ArcadeEvent[]): void;
  dispose(): void;
}

export function createSfx(): Sfx {
  const rng = createRng('spiral-breaker-audio');
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let muted = false;

  const ensure = (): AudioContext | null => {
    if (context) return context;
    const Ctor =
      globalThis.AudioContext ??
      (globalThis as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
    master = context.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(context.destination);
    return context;
  };

  const tone = (
    frequency: number,
    duration: number,
    type: OscillatorType,
    gain: number,
    glideTo?: number,
  ): void => {
    const ctx = ensure();
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const envelope = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, now);
    if (glideTo !== undefined) osc.frequency.exponentialRampToValueAtTime(Math.max(30, glideTo), now + duration);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(gain, now + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.connect(envelope).connect(master);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  };

  const noise = (duration: number, gain: number, from: number, to: number): void => {
    const ctx = ensure();
    if (!ctx || !master) return;
    const now = ctx.currentTime;
    const frames = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, frames, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let index = 0; index < frames; index += 1) data[index] = rng.next() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(from, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(60, to), now + duration);
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(gain, now);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter).connect(envelope).connect(master);
    source.start(now);
    source.stop(now + duration + 0.02);
  };

  return {
    get unlocked(): boolean {
      return context !== null;
    },
    get muted(): boolean {
      return muted;
    },
    unlock(): void {
      const ctx = ensure();
      if (ctx && ctx.state === 'suspended') void ctx.resume();
    },
    setMuted(value: boolean): boolean {
      muted = Boolean(value);
      if (master && context) master.gain.setTargetAtTime(muted ? 0 : 0.5, context.currentTime, 0.02);
      return muted;
    },
    handle(events: readonly ArcadeEvent[]): void {
      if (!context) return;
      for (const event of events) {
        switch (event.type) {
          case 'dash.start':
            noise(0.18, 0.28, 1600, 320);
            break;
          case 'shard.destroy':
            if (event.kind === 'heart') {
              tone(880, 0.18, 'triangle', 0.2, 1320);
              break;
            }
            tone(520 + rng.next() * 220, 0.14, 'triangle', 0.22, 880);
            if (event.kind === 'splitter') noise(0.1, 0.18, 3000, 800);
            if (event.kind === 'shielded') noise(0.09, 0.22, 1400, 400);
            if (event.kind === 'mini') tone(1400, 0.05, 'square', 0.1, 1100);
            break;
          case 'shard.blocked':
            tone(1400, 0.07, 'square', 0.14, 500);
            break;
          case 'core.heal':
            tone(440, 0.26, 'sine', 0.2, 980);
            break;
          case 'score.change':
            if (event.chain >= 3) tone(660 + event.chain * 40, 0.16, 'square', 0.12, 1320);
            break;
          case 'player.knockback':
            tone(180, 0.22, 'sawtooth', 0.26, 70);
            break;
          case 'core.breach':
            tone(150, 0.5, 'sine', 0.4, 48);
            noise(0.4, 0.3, 700, 120);
            break;
          case 'wave.start':
            tone(392, 0.18, 'triangle', 0.16, 588);
            break;
          case 'ghost.takeover':
            tone(880, 0.3, 'sine', 0.12, 660);
            break;
          case 'game.over':
            if (event.victory) {
              tone(523, 0.16, 'triangle', 0.2, 523);
              tone(659, 0.16, 'triangle', 0.2, 659);
              tone(784, 0.3, 'triangle', 0.24, 1046);
            } else {
              tone(300, 0.7, 'sawtooth', 0.3, 60);
            }
            break;
          default:
            break;
        }
      }
    },
    dispose(): void {
      void context?.close();
      context = null;
      master = null;
    },
  };
}
