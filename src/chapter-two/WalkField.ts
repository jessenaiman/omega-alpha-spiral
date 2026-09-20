import { ECHO_ROOMS, type Guide, type ObjectKind, type RoomObject } from './rooms';

const FIELD_BOUNDARY: number = 22;
const WALK_SPEED: number = 6;
const MAX_STEP: number = 0.1;
const START_Z: number = 12;
const REACH: number = 3;
const SOLID_RADIUS: number = 1.4;
const AUTO_FIGHT_SECONDS: number = 1.2;

export interface FieldPosition { x: number; z: number }
export interface EchoChoice { room: Guide; object: ObjectKind; alignment: Guide; answer: string; points: number }

/** Small graybox movement model; renderer and keyboard both consume this state. */
export class WalkField {
  public readonly boundary: number = FIELD_BOUNDARY;
  public player: FieldPosition = { x: 0, z: START_Z };
  public thread: string = '';
  public framesAdvanced: number = 0;
  public distanceTravelled: number = 0;
  public roomIndex: number = 0;
  public phase: 'exploring' | 'prompt' | 'fighting' | 'result' | 'rewriting' | 'complete' = 'exploring';
  public choices: EchoChoice[] = [];
  public selected: RoomObject | null = null;
  public guide: Guide | null = null;
  private _fightRemaining: number = 0;

  public get objects(): RoomObject[] { return ECHO_ROOMS[this.roomIndex].objects; }
  public get scriptRevision(): number { return this.roomIndex + 1; }
  public get scriptPreview(): string {
    const index: number = this.roomIndex + (this.phase === 'rewriting' ? 1 : 0);
    const room = ECHO_ROOMS[index];
    // ponytail: in-world shell-shaped text, never evaluated. The trusted room
    // data below is also what the runtime applies; no second scripting engine.
    return [
      '# OMEGA / next floor script',
      `REVISION=${index + 1}`,
      `DUNGEON_MASTER=${JSON.stringify(room.owner)}`,
      ...room.objects.map(object => `${object.kind.toUpperCase()}=${JSON.stringify(object.text)}`),
    ].join('\n');
  }
  public get nearest(): RoomObject | null {
    return this.objects.find((object: RoomObject): boolean => Math.hypot(object.x - this.player.x, object.z - this.player.z) <= REACH) ?? null;
  }

  public start(thread: string): void {
    this.player = { x: 0, z: START_Z };
    this.thread = thread;
    this.framesAdvanced = 0;
    this.distanceTravelled = 0;
    this.roomIndex = 0;
    this.phase = 'exploring';
    this.choices = [];
    this.selected = null;
    this.guide = null;
    this._fightRemaining = 0;
  }

  public update(delta: number, x: number, z: number): void {
    if (![delta, x, z].every(Number.isFinite) || delta <= 0) return;
    this.framesAdvanced += 1;
    if (this.phase === 'fighting') {
      this._fightRemaining -= Math.min(delta, MAX_STEP);
      if (this._fightRemaining <= 0) this._resolve('');
    }
    if (this.phase !== 'exploring') return;
    const length: number = Math.max(1, Math.hypot(x, z));
    const distance: number = Math.min(delta, MAX_STEP) * WALK_SPEED;
    const nextX: number = Math.max(-this.boundary, Math.min(this.boundary, this.player.x + x / length * distance));
    const nextZ: number = Math.max(-this.boundary, Math.min(this.boundary, this.player.z + z / length * distance));
    const clear = (px: number, pz: number): boolean => this.objects.every((object: RoomObject): boolean => Math.hypot(object.x - px, object.z - pz) >= SOLID_RADIUS);
    const allowedX: number = clear(nextX, this.player.z) ? nextX : this.player.x;
    const allowedZ: number = clear(allowedX, nextZ) ? nextZ : this.player.z;
    this.distanceTravelled += Math.hypot(allowedX - this.player.x, allowedZ - this.player.z);
    this.player.x = allowedX;
    this.player.z = allowedZ;
  }

  public interact(): boolean {
    if (this.phase !== 'exploring' || !this.nearest) return false;
    this.selected = this.nearest;
    this.phase = this.selected.kind === 'door' ? 'prompt' : this.selected.kind === 'monster' ? 'fighting' : 'result';
    if (this.selected.kind === 'monster') this._fightRemaining = AUTO_FIGHT_SECONDS;
    if (this.selected.kind === 'chest') this._resolve('');
    return true;
  }

  public answer(text: string): boolean {
    if (this.phase !== 'prompt' || !text.trim()) return false;
    this._resolve(text.trim().slice(0, 240));
    return true;
  }

  private _resolve(answer: string): void {
    if (!this.selected || this.choices.length > this.roomIndex) return;
    const owner: Guide = ECHO_ROOMS[this.roomIndex].owner;
    this.choices.push({ room: owner, object: this.selected.kind, alignment: this.selected.alignment, answer, points: this.selected.alignment === owner ? 2 : 1 });
    this.phase = 'result';
  }

  public continue(): void {
    if (this.phase === 'rewriting') {
      this.roomIndex += 1;
      this.player = { x: 0, z: START_Z };
      this.selected = null;
      this.phase = 'exploring';
      return;
    }
    if (this.phase !== 'result') return;
    if (this.roomIndex + 1 < ECHO_ROOMS.length) {
      this.phase = 'rewriting';
      return;
    }
    const totals: Record<Guide, number> = { Light: 0, Shadow: 0, Ambition: 0 };
    for (const choice of this.choices) totals[choice.alignment] += choice.points;
    const highest: number = Math.max(...Object.values(totals));
    const tied: Guide[] = ECHO_ROOMS.map((room): Guide => room.owner).filter((id: Guide): boolean => totals[id] === highest);
    // Provisional deterministic tie rule: prefer the Stage 1 thread, then room order.
    this.guide = tied.find((id: Guide): boolean => id === this.thread) ?? tied[0];
    this.phase = 'complete';
  }
}
