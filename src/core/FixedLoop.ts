const STEP = 1 / 60;
const MAX_FRAME = 0.1;
const MAX_STEPS = 5;

export class FixedLoop {
  private accumulator = 0;
  private running = false;
  private lastMs: number | null = null;
  private frameId: number | null = null;

  constructor(
    private readonly update: (dt: number) => void,
    private readonly render: (alpha: number) => void,
    private readonly requestFrame: (callback: FrameRequestCallback) => number = (callback) => window.requestAnimationFrame(callback),
    private readonly cancelFrame: (id: number) => void = (id) => window.cancelAnimationFrame(id),
  ) {}

  private readonly onFrame = (nowMs: number): void => {
    if (!this.running) return;
    this.frameId = null;
    this.tick(nowMs);
    if (this.running && this.frameId === null) this.frameId = this.requestFrame(this.onFrame);
  };

  start(): void {
    if (this.running) return;
    this.running = true;
    this.accumulator = 0;
    this.lastMs = null;
    this.frameId = this.requestFrame(this.onFrame);
  }

  stop(): void {
    if (!this.running) return;
    this.running = false;
    if (this.frameId !== null) this.cancelFrame(this.frameId);
    this.frameId = null;
    this.lastMs = null;
    this.accumulator = 0;
  }

  tick(nowMs: number): void {
    if (this.lastMs === null) {
      this.lastMs = nowMs;
      this.render(0);
      return;
    }

    const frame = Math.min(Math.max((nowMs - this.lastMs) / 1000, 0), MAX_FRAME);
    this.lastMs = nowMs;
    this.accumulator += frame;
    let steps = 0;

    while (this.accumulator >= STEP && steps < MAX_STEPS) {
      this.update(STEP);
      this.accumulator -= STEP;
      steps += 1;
    }
    if (steps === MAX_STEPS) this.accumulator = 0;
    this.render(this.accumulator / STEP);
  }
}
