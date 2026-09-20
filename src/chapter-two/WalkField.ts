import { DESCENT_FLOORS, type DescentFloor, type Guide, type ObjectKind, type RoomObject } from './floors';
import { Whispers } from './Whispers';

const FIELD_BOUNDARY: number = 22;
const WALK_SPEED: number = 6;
const SPRINT_SPEED: number = 10;
const STAMINA_DRAIN: number = 0.25;   // per second at full sprint
const STAMINA_REGAIN: number = 0.18;  // per second resting
const DODGE_COST: number = 0.34;
const DODGE_BURST: number = 2.2;      // distance multiplier
const MAX_HEALTH: number = 3;
const MAX_STEP: number = 0.1;
const START_Z: number = 12;
const REACH: number = 3;
const SOLID_RADIUS: number = 1.4;

export interface FieldPosition { x: number; z: number }
export interface MoveIntent { sprint?: boolean }
export interface EchoChoice { room: Guide; object: ObjectKind; alignment: Guide; answer: string; points: number }
export type Outcome = 'victory' | 'defeat' | null;

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
  public lastOutcome: Outcome = null;
  public strikesLanded: number = 0;
  public stamina: number = 1;
  public health: number = MAX_HEALTH;
  public listened: boolean = false;
  private _fightRemaining: number = 0;
  private _whispers: Whispers | null = null;

  constructor(whispers?: Whispers) { this._whispers = whispers ?? null; }

  public get floor(): DescentFloor { return DESCENT_FLOORS[Math.min(this.roomIndex, DESCENT_FLOORS.length - 1)]!; }
  public get objects(): RoomObject[] { return this.floor.objects; }
  public get floorCount(): number { return DESCENT_FLOORS.length; }
  public get scriptRevision(): number { return this.roomIndex + 1; }
  public get attacksAvailable(): boolean { return this.floor.attacksAllowed; }
  public get scriptPreview(): string {
    const index: number = this.roomIndex + (this.phase === 'rewriting' ? 1 : 0);
    const room = DESCENT_FLOORS[Math.min(index, DESCENT_FLOORS.length - 1)]!;
    // ponytail: in-world shell-shaped text, never evaluated. The trusted room
    // data below is also what the runtime applies; no second scripting engine.
    return [
      '# OMEGA / next floor script',
      `REVISION=${index + 1}`,
      `DUNGEON_MASTER=${JSON.stringify(room.owner)}`,
      ...room.objects.map(object => `${object.kind.toUpperCase()}=${JSON.stringify(object.text)}`),
    ].join('\n');
  }
  public get introPreview(): string { return DESCENT_FLOORS[Math.min(this.roomIndex + 1, DESCENT_FLOORS.length - 1)]!.intro; }
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
    this.lastOutcome = null;
    this.strikesLanded = 0;
    this._fightRemaining = 0;
  }

  public update(delta: number, x: number, z: number, intent?: MoveIntent): void {
    if (![delta, x, z].every(Number.isFinite) || delta <= 0) return;
    this.framesAdvanced += 1;
    if (this.phase === 'fighting') {
      this._fightRemaining -= Math.min(delta, MAX_STEP);
      if (this._fightRemaining <= 0) this._resolve('');
    }
    if (this.phase !== 'exploring') return;
    const moving: boolean = x !== 0 || z !== 0;
    const wantSprint: boolean = Boolean(intent?.sprint) && moving && this.stamina > 0;
    if (wantSprint) this.stamina = Math.max(0, this.stamina - STAMINA_DRAIN * delta);
    else if (!moving) this.stamina = Math.min(1, this.stamina + STAMINA_REGAIN * delta);
    const length: number = Math.max(1, Math.hypot(x, z));
    const speed: number = wantSprint ? SPRINT_SPEED : WALK_SPEED;
    const distance: number = Math.min(delta, MAX_STEP) * speed;
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
    if (this.selected.kind === 'monster') {
      this._fightRemaining = this.floor.fightSeconds;
      this.strikesLanded = 0;
    }
    if (this.selected.kind === 'chest') this._resolve('');
    return true;
  }

  public attack(): boolean {
    if (this.phase !== 'fighting' || !this.floor.attacksAllowed || !this.selected) return false;
    this.strikesLanded += 1;
    if (this.strikesLanded >= this.floor.attacksRequired) this._resolve('');
    return true;
  }

  public answer(text: string): boolean {
    if (this.phase !== 'prompt' || !text.trim()) return false;
    this._resolve(text.trim().slice(0, 240));
    return true;
  }

  private _resolve(answer: string): void {
    if (!this.selected || this.choices.length > this.roomIndex) return;
    const monster: boolean = this.selected.kind === 'monster';
    this.lastOutcome = monster ? (this.strikesLanded >= this.floor.attacksRequired && this.floor.attacksAllowed ? 'victory' : 'defeat') : null;
    const owner: Guide = this.floor.owner;
    this.choices.push({ room: owner, object: this.selected.kind, alignment: this.selected.alignment, answer, points: this.selected.alignment === owner ? 2 : 1 });
    // Chosen exit = affinity option: the aligned Dreamweaver speaks (issue #37).
    if (this.selected.voiceLine) this._whispers?.say(this.selected.alignment, this.selected.voiceLine);
    this.phase = 'result';
  }

  public continue(): void {
    if (this.phase === 'rewriting') {
      this.roomIndex += 1;
      this.player = { x: 0, z: START_Z };
      this.selected = null;
      this.lastOutcome = null;
      this.phase = 'exploring';
      return;
    }
    if (this.phase !== 'result') return;
    if (this.roomIndex + 1 < DESCENT_FLOORS.length) {
      this.phase = 'rewriting';
      return;
    }
    const totals: Record<Guide, number> = { Light: 0, Shadow: 0, Ambition: 0 };
    for (const choice of this.choices) totals[choice.alignment] += choice.points;
    const highest: number = Math.max(...Object.values(totals));
    const tied: Guide[] = DESCENT_FLOORS.map((floor): Guide => floor.owner).filter((id: Guide): boolean => totals[id] === highest);
    // Provisional deterministic tie rule: prefer the Stage 1 thread, then room order.
    this.guide = tied.find((id: Guide): boolean => id === this.thread) ?? tied[0];
    this.phase = 'complete';
  }
}
