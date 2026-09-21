import type { FeedbackEvent, GameAction, LandmarkId } from '../game/types.js';
import { TOWN_LAYOUT } from '../world/layout.js';

const LANDMARKS: readonly LandmarkId[] = ['archive', 'refuge', 'gate'];
const BLACKOUT_TELL_SECONDS = 0.75;
const BLACKOUT_ACTIVE_SECONDS = 1.25;
const BLACKOUT_FREEZE_SECONDS = 0.25;
const BLACKOUT_STRIPS = [
  { id: 'north-crossing', x: 0, z: 5, width: 22, depth: 0.8 },
  { id: 'square-crossing', x: 0, z: 1, width: 0.8, depth: 12 },
] as const;

type BlackoutPhase = 'off' | 'tell' | 'active';

export class ExplorationPhase {
  private player = { x: 0, z: 0 };
  private restored = new Set<LandmarkId>();
  private blackoutPhase: BlackoutPhase = 'off';
  private blackoutIndex = 0;
  private blackoutRemaining = 0;
  private freezeRemaining = 0;
  private stripContacted = false;

  constructor(
    private readonly commit: (action: GameAction) => void,
    private readonly feedback: (event: FeedbackEvent) => void,
  ) {}

  snapshot() {
    const blackoutStrip = this.blackoutPhase === 'off' ? null : {
      ...BLACKOUT_STRIPS[this.blackoutIndex],
      phase: this.blackoutPhase,
    };
    return {
      player: { ...this.player },
      restored: [...this.restored],
      target: this.target(),
      complete: this.restored.size === 3,
      blackoutStrip,
      freezeRemaining: this.freezeRemaining,
    };
  }

  update(dt: number, movement: { x: number; z: number }): void {
    if (!Number.isFinite(dt) || dt <= 0) return;
    const step = Math.min(dt, 0.05);
    this.advanceBlackout(step);

    if (this.freezeRemaining > 0) {
      this.freezeRemaining = this.freezeRemaining <= step + Number.EPSILON
        ? 0
        : this.freezeRemaining - step;
      return;
    }
    if (this.contactBlackout() || this.restored.size === 3) return;

    const length = Math.hypot(movement.x, movement.z);
    if (!Number.isFinite(length) || length === 0) return;
    const scale = length > 1 ? 1 / length : 1;
    const distance = 4.8 * step;
    const bounds = TOWN_LAYOUT.bounds;
    this.player.x = Math.max(bounds.minX, Math.min(bounds.maxX, this.player.x + movement.x * scale * distance));
    this.player.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, this.player.z + movement.z * scale * distance));
    this.contactBlackout();
  }

  act(): boolean {
    const landmark = this.target();
    if (!landmark) return false;
    this.commit({ type: 'landmark.completed', landmark });
    this.restored.add(landmark);
    this.feedback({ type: 'act.commit', sourceId: landmark });
    this.feedback({ type: 'landmark.restore', sourceId: landmark });
    if (this.restored.size === 1) this.beginBlackouts();
    return true;
  }

  private beginBlackouts(): void {
    this.blackoutPhase = 'tell';
    this.blackoutRemaining = BLACKOUT_TELL_SECONDS;
    this.feedback({ type: 'threat.tell', sourceId: BLACKOUT_STRIPS[this.blackoutIndex].id });
  }

  private advanceBlackout(dt: number): void {
    if (this.blackoutPhase === 'off') return;
    this.blackoutRemaining -= dt;
    if (this.blackoutRemaining > Number.EPSILON) return;

    if (this.blackoutPhase === 'tell') {
      this.blackoutPhase = 'active';
      this.blackoutRemaining = BLACKOUT_ACTIVE_SECONDS;
      this.stripContacted = false;
      return;
    }

    this.blackoutIndex = (this.blackoutIndex + 1) % BLACKOUT_STRIPS.length;
    this.blackoutPhase = 'tell';
    this.blackoutRemaining = BLACKOUT_TELL_SECONDS;
    this.stripContacted = false;
    this.feedback({ type: 'threat.tell', sourceId: BLACKOUT_STRIPS[this.blackoutIndex].id });
  }

  private contactBlackout(): boolean {
    if (this.blackoutPhase !== 'active' || this.stripContacted) return false;
    const strip = BLACKOUT_STRIPS[this.blackoutIndex];
    const inside = Math.abs(this.player.x - strip.x) <= strip.width / 2
      && Math.abs(this.player.z - strip.z) <= strip.depth / 2;
    if (!inside) return false;

    this.stripContacted = true;
    this.freezeRemaining = BLACKOUT_FREEZE_SECONDS;
    this.feedback({ type: 'threat.contact', sourceId: strip.id, value: BLACKOUT_FREEZE_SECONDS });
    return true;
  }

  private target(): LandmarkId | null {
    return LANDMARKS.find(id => !this.restored.has(id)
      && Math.hypot(this.player.x - TOWN_LAYOUT[id].x, this.player.z - TOWN_LAYOUT[id].z) <= 1.1) ?? null;
  }
}
