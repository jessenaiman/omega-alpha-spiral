type AudioGroup = 'ui' | 'sfx' | 'ambience' | 'voice';
type GhostCue = 'begin' | 'type' | 'erase' | 'hesitation' | 'correction';

const GROUP_LEVELS: Record<AudioGroup, number> = {
  ui: 0.46,
  sfx: 0.3,
  ambience: 0.055,
  voice: 0.17,
};

/** Small procedural mixer: the opening remains portable and every sound maps to a real event. */
export class IntroAudio {
  private _context: AudioContext | null = null;
  private _master: GainNode | null = null;
  private _groups: Partial<Record<AudioGroup, GainNode>> = {};
  private _ambience: OscillatorNode[] = [];
  private _muted: boolean = false;
  private _unlocked: boolean = false;
  private _lastAt: Map<string, number> = new Map();
  private _cueCount: number = 0;
  private _cueCounts: Record<GhostCue, number> = { begin: 0, type: 0, erase: 0, hesitation: 0, correction: 0 };
  private _noiseBuffer: AudioBuffer | null = null;

  public get unlocked(): boolean { return this._unlocked; }
  public get muted(): boolean { return this._muted; }
  public get cueCount(): number { return this._cueCount; }
  public get cueCounts(): Readonly<Record<GhostCue, number>> { return this._cueCounts; }

  public async unlock(): Promise<boolean> {
    if (!this._context) this._createGraph();
    if (!this._context) return false;
    try {
      if (this._context.state !== 'running') await this._context.resume();
      this._unlocked = this._context.state === 'running';
      if (this._unlocked && this._ambience.length === 0) this._startAmbience();
      return this._unlocked;
    } catch {
      return false;
    }
  }

  public setMuted(muted: boolean): void {
    this._muted = muted;
    if (!this._context || !this._master) return;
    this._master.gain.cancelScheduledValues(this._context.currentTime);
    this._master.gain.setTargetAtTime(muted ? 0 : 0.82, this._context.currentTime, 0.025);
  }

  public type(era: number, erasing: boolean = false): void {
    if (erasing) { this.erase(era); return; }
    if (!this._ready() || !this._cooldown('type', 20)) return;
    this._registerCue('type');
    const wave: OscillatorType[] = ['square', 'square', 'triangle', 'sawtooth', 'sine'];
    const base: number[] = [86, 104, 128, 158, 212];
    const variation: number = ((performance.now() * 0.173) % 1 - 0.5) * 18;
    this._noise(0.026, 'ui', 0.2, 1350 + era * 260);
    this._tone(base[Math.min(era, 4)] + variation, 0.038, 'ui', 0.14, wave[Math.min(era, 4)]);
    if (era >= 3) this._tone(820 + variation * 5, 0.014, 'ui', 0.04, 'sine', 0.004);
  }

  public begin(): void {
    if (!this._ready()) return;
    this._registerCue('begin');
    this._noise(0.055, 'ui', 0.28, 900);
    this._tone(126, 0.065, 'ui', 0.24, 'square');
    this._tone(68, 0.11, 'ui', 0.1, 'triangle', 0.012);
  }

  public erase(era: number): void {
    if (!this._ready() || !this._cooldown('erase', 28)) return;
    this._registerCue('erase');
    this._noise(0.045, 'ui', 0.22, 620 + era * 90);
    this._tone(64 + era * 11, 0.07, 'ui', 0.18, 'square');
  }

  public hesitate(era: number): void {
    if (!this._ready() || !this._cooldown('hesitation', 260)) return;
    this._registerCue('hesitation');
    this._noise(0.035, 'ui', 0.12, 760);
    this._tone(54 + era * 9, 0.085, 'ui', 0.11, 'triangle');
    this._tone(48 + era * 7, 0.06, 'ui', 0.07, 'triangle', 0.105);
  }

  public correct(era: number): void {
    if (!this._ready() || !this._cooldown('correction', 240)) return;
    this._registerCue('correction');
    this._noise(0.04, 'ui', 0.24, 1800);
    this._tone(190 + era * 34, 0.045, 'ui', 0.17, 'square');
    this._tone(285 + era * 48, 0.055, 'ui', 0.12, 'square', 0.058);
  }

  public era(era: number): void {
    if (!this._ready() || !this._cooldown('era', 90)) return;
    this._tone(110 + era * 57, 0.18, 'sfx', 0.12, era < 2 ? 'square' : 'triangle', 0.015);
    this._tone(165 + era * 86, 0.26, 'sfx', 0.055, 'sine', 0.055);
  }

  public dreamweaver(index: number): void {
    if (!this._ready() || !this._cooldown(`voice-${index}`, 220)) return;
    const roots: number[] = [392, 92, 233];
    const waves: OscillatorType[] = ['sine', 'sawtooth', 'triangle'];
    const pan: number[] = [-0.62, 0, 0.62];
    this._tone(roots[index], 0.42, 'voice', 0.12, waves[index], 0.035, pan[index]);
    this._tone(roots[index] * (index === 2 ? 1.49 : 1.25), 0.58, 'voice', 0.045, waves[index], 0.11, pan[index]);
  }

  public commentary(index: number): void {
    if (!this._ready() || !this._cooldown(`commentary-${index}`, 650)) return;
    const pan: number[] = [-0.62, 0, 0.62];
    if (index === 0) {
      this._tone(784, 0.34, 'voice', 0.11, 'sine', 0, pan[index]);
      this._tone(1176, 0.16, 'voice', 0.035, 'sine', 0.035, pan[index]);
      return;
    }
    if (index === 1) {
      this._noise(0.028, 'voice', 0.13, 420, 0, pan[index]);
      this._tone(78, 0.065, 'voice', 0.1, 'square', 0, pan[index]);
      this._tone(69, 0.065, 'voice', 0.08, 'square', 0.17, pan[index]);
      return;
    }
    this._sweep(174, 262, 0.62, 'voice', 0.09, 'triangle', 0, pan[index]);
    this._tone(139, 0.42, 'voice', 0.035, 'sine', 0.54, pan[index]);
  }

  public choose(index: number): void {
    if (!this._ready()) return;
    const roots: number[] = [330, 110, 220];
    this._tone(roots[index], 0.16, 'sfx', 0.16, index === 0 ? 'sine' : index === 1 ? 'sawtooth' : 'triangle', 0.01);
    this._tone(roots[index] * 1.5, 0.32, 'sfx', 0.08, 'sine', 0.07);
  }

  public move(stage: number): void {
    if (!this._ready() || !this._cooldown('move', 145)) return;
    const base: number = 58 + Math.max(0, Math.min(4, stage)) * 18;
    this._noise(0.032, 'sfx', 0.08, 540 + stage * 120);
    this._tone(base, 0.075, 'sfx', 0.07, stage < 2 ? 'square' : 'triangle');
  }

  public transition(): void {
    if (!this._ready() || !this._cooldown('transition', 350)) return;
    [98, 147, 221].forEach((frequency: number, index: number): void => {
      this._tone(frequency, 0.72, 'sfx', 0.055, index === 2 ? 'triangle' : 'sine', index * 0.075);
    });
  }

  public threshold(): void {
    if (!this._ready() || !this._cooldown('threshold', 1500)) return;
    [43, 64.5, 97].forEach((frequency: number, index: number): void => {
      this._tone(frequency, 2.4, 'sfx', 0.12 - index * 0.02, index === 2 ? 'triangle' : 'sine', index * 0.12);
    });
  }

  public async suspend(): Promise<void> {
    if (this._context?.state === 'running') await this._context.suspend();
  }

  public async resume(): Promise<void> {
    if (this._unlocked && this._context?.state === 'suspended') await this._context.resume();
  }

  public destroy(): void {
    this._ambience.forEach((oscillator: OscillatorNode): void => {
      try { oscillator.stop(); } catch { /* already stopped */ }
      oscillator.disconnect();
    });
    this._ambience = [];
    void this._context?.close();
    this._context = null;
    this._master = null;
    this._groups = {};
    this._unlocked = false;
    this._noiseBuffer = null;
  }

  private _createGraph(): void {
    const AudioContextClass: typeof AudioContext | undefined = window.AudioContext;
    if (!AudioContextClass) return;
    this._context = new AudioContextClass();
    this._master = this._context.createGain();
    this._master.gain.value = this._muted ? 0 : 0.82;
    this._master.connect(this._context.destination);
    (Object.keys(GROUP_LEVELS) as AudioGroup[]).forEach((name: AudioGroup): void => {
      if (!this._context || !this._master) return;
      const gain: GainNode = this._context.createGain();
      gain.gain.value = GROUP_LEVELS[name];
      gain.connect(this._master);
      this._groups[name] = gain;
    });
    this._noiseBuffer = this._context.createBuffer(1, Math.ceil(this._context.sampleRate * 0.12), this._context.sampleRate);
    const samples: Float32Array = this._noiseBuffer.getChannelData(0);
    let state: number = 472;
    for (let index: number = 0; index < samples.length; index += 1) {
      state = (1664525 * state + 1013904223) >>> 0;
      samples[index] = state / 2147483648 - 1;
    }
  }

  private _startAmbience(): void {
    if (!this._context || !this._groups.ambience) return;
    [36.7, 55].forEach((frequency: number, index: number): void => {
      if (!this._context || !this._groups.ambience) return;
      const oscillator: OscillatorNode = this._context.createOscillator();
      const gain: GainNode = this._context.createGain();
      oscillator.type = index === 0 ? 'sine' : 'triangle';
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index === 0 ? -7 : 5;
      gain.gain.value = index === 0 ? 0.72 : 0.18;
      oscillator.connect(gain).connect(this._groups.ambience);
      oscillator.start();
      this._ambience.push(oscillator);
    });
  }

  private _ready(): boolean {
    return Boolean(this._unlocked && !this._muted && this._context && this._context.state === 'running');
  }

  private _registerCue(cue: GhostCue): void {
    this._cueCount += 1;
    this._cueCounts[cue] += 1;
  }

  private _cooldown(id: string, milliseconds: number): boolean {
    const now: number = performance.now();
    const previous: number = this._lastAt.get(id) ?? -Infinity;
    if (now - previous < milliseconds) return false;
    this._lastAt.set(id, now);
    return true;
  }

  private _tone(frequency: number, duration: number, group: AudioGroup, level: number, type: OscillatorType, delay: number = 0, pan: number = 0): void {
    if (!this._context || !this._groups[group]) return;
    const start: number = this._context.currentTime + delay;
    const oscillator: OscillatorNode = this._context.createOscillator();
    const gain: GainNode = this._context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(24, frequency), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(24, frequency * 0.93), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + Math.min(0.008, duration * 0.25));
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    const panner: StereoPannerNode = this._context.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    oscillator.connect(gain).connect(panner).connect(this._groups[group]);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  private _sweep(from: number, to: number, duration: number, group: AudioGroup, level: number, type: OscillatorType, delay: number = 0, pan: number = 0): void {
    if (!this._context || !this._groups[group]) return;
    const start: number = this._context.currentTime + delay;
    const oscillator: OscillatorNode = this._context.createOscillator();
    const gain: GainNode = this._context.createGain();
    const panner: StereoPannerNode = this._context.createStereoPanner();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(Math.max(24, from), start);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(24, to), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    oscillator.connect(gain).connect(panner).connect(this._groups[group]);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  private _noise(duration: number, group: AudioGroup, level: number, highpassFrequency: number, delay: number = 0, pan: number = 0): void {
    if (!this._context || !this._groups[group] || !this._noiseBuffer) return;
    const start: number = this._context.currentTime + delay;
    const source: AudioBufferSourceNode = this._context.createBufferSource();
    const filter: BiquadFilterNode = this._context.createBiquadFilter();
    const gain: GainNode = this._context.createGain();
    source.buffer = this._noiseBuffer;
    filter.type = 'highpass';
    filter.frequency.value = highpassFrequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(level, start + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    const panner: StereoPannerNode = this._context.createStereoPanner();
    panner.pan.value = Math.max(-1, Math.min(1, pan));
    source.connect(filter).connect(gain).connect(panner).connect(this._groups[group]);
    source.start(start, 0, duration);
    source.stop(start + duration + 0.01);
  }
}
