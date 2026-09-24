import type { FloorEvent } from '../game/floor-one';

type Cue = 'step' | 'hit' | 'miss' | 'damage' | 'pickup' | 'door' | 'exit' | 'death' | 'warning' | 'pause' | 'retry' | 'inspect';

/** Restrained procedural audio for the turn-based floor; no files or service keys. */
export class FloorAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambience: OscillatorNode[] = [];
  private lastPlayed = new Map<Cue, number>();
  private pending: FloorEvent[] = [];
  private pauseToken = 0;
  private muted = false;

  get unlocked(): boolean { return this.context?.state === 'running'; }

  async unlock(): Promise<void> {
    try {
      if (!this.context) {
        if (!globalThis.AudioContext) return;
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = this.muted ? 0 : 0.28;
        this.master.connect(this.context.destination);
      }
      if (this.context.state !== 'running') await this.context.resume();
      if (this.ambience.length === 0) this.startAmbience();
      if (this.pending.length > 0) this.play(this.pending.splice(0));
    } catch {
      // Audio can be unavailable or denied without interrupting gameplay.
    }
  }

  play(events: readonly FloorEvent[]): void {
    if (!this.unlocked) {
      this.pending.push(...events.slice(-20));
      if (this.pending.length > 20) this.pending.splice(0, this.pending.length - 20);
      return;
    }
    for (const event of events) {
      switch (event.type) {
        case 'moved': this.cue('step'); break;
        case 'hit': this.cue('hit'); break;
        case 'miss': this.cue('miss'); break;
        case 'damage': this.cue('damage'); break;
        case 'pickup': this.cue('pickup'); break;
        case 'door': if (event.open) this.cue('door'); break;
        case 'exit': this.cue('exit'); break;
        case 'death': this.cue('death'); break;
        case 'disposition': if (event.value === 'hostile' || event.value === 'suspicious') this.cue('warning'); break;
      }
    }
  }

  ui(action: 'pause' | 'retry' | 'inspect'): void { this.cue(action); }

  setMuted(value: boolean): void {
    this.muted = value;
    if (this.context && this.master) {
      this.master.gain.setTargetAtTime(value ? 0 : 0.28, this.context.currentTime, 0.02);
    }
  }

  async suspend(): Promise<void> {
    const token = ++this.pauseToken;
    await new Promise<void>(resolve => setTimeout(resolve, 100));
    try {
      if (token === this.pauseToken && this.context?.state === 'running') await this.context.suspend();
    } catch { /* audio failure must not stop the game */ }
  }

  async resume(): Promise<void> {
    ++this.pauseToken;
    try {
      if (this.context?.state === 'suspended') await this.context.resume();
    } catch { /* audio failure must not stop the game */ }
  }

  destroy(): void {
    for (const oscillator of this.ambience) {
      try { oscillator.stop(); } catch { /* already stopped */ }
      oscillator.disconnect();
    }
    this.ambience = [];
    void this.context?.close();
    this.context = null;
    this.master = null;
    this.pending = [];
  }

  private startAmbience(): void {
    if (!this.context || !this.master) return;
    for (const [frequency, level] of [[41.2, 0.055], [61.7, 0.018]]) {
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      gain.gain.value = level;
      oscillator.connect(gain).connect(this.master);
      oscillator.start();
      this.ambience.push(oscillator);
    }
  }

  private cue(name: Cue): void {
    if (!this.context || !this.master || this.context.state !== 'running' || this.muted) return;
    const now = performance.now();
    const cooldown = name === 'step' ? 95 : name === 'warning' ? 450 : 60;
    if (now - (this.lastPlayed.get(name) ?? -Infinity) < cooldown) return;
    this.lastPlayed.set(name, now);
    switch (name) {
      case 'step': this.tone(82, 65, 0.045, 0.09, 'triangle'); break;
      case 'hit': this.tone(175, 62, 0.13, 0.3, 'sawtooth'); break;
      case 'miss': this.tone(240, 180, 0.09, 0.11, 'triangle'); break;
      case 'damage': this.tone(88, 38, 0.24, 0.28, 'sawtooth'); break;
      case 'pickup': this.tone(330, 660, 0.24, 0.22, 'sine'); break;
      case 'door': this.tone(110, 260, 0.48, 0.22, 'triangle'); break;
      case 'exit': this.tone(220, 440, 0.75, 0.25, 'sine'); break;
      case 'death': this.tone(93, 35, 0.62, 0.25, 'triangle'); break;
      case 'warning': this.tone(170, 165, 0.17, 0.11, 'square'); break;
      case 'pause': this.tone(310, 230, 0.08, 0.1, 'sine'); break;
      case 'retry': this.tone(165, 330, 0.2, 0.17, 'triangle'); break;
      case 'inspect': this.tone(420, 500, 0.07, 0.075, 'sine'); break;
    }
  }

  private tone(startHz: number, endHz: number, duration: number, level: number, wave: OscillatorType): void {
    if (!this.context || !this.master) return;
    const start = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(startHz, start);
    oscillator.frequency.exponentialRampToValueAtTime(endHz, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(this.master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.01);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
  }
}
