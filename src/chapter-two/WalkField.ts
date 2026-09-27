import {
  createEchoRooms,
  type Guide,
  type EchoRoom,
  type ObjectKind,
  type RoomObject,
} from "./rooms";
import type { EarlyFloorLayout } from "./floors/early-layout";
import type { OmlStateEffect, OmlStateValue } from "../core/oml";

const FIELD_BOUNDARY: number = 22;
const WALK_SPEED: number = 6;
const MAX_STEP: number = 0.1;
const START_Z: number = 12;
const REACH: number = 3;
const SOLID_RADIUS: number = 1.4;
const PLAYER_RADIUS: number = 0.45;
const AUTO_FIGHT_SECONDS: number = 1.2;
const EXIT_CROSS_RADIUS: number = 0.8;

export interface FieldPosition {
  x: number;
  z: number;
}
export interface EchoChoice {
  room: Guide;
  object: ObjectKind;
  alignment: Guide;
  answer: string;
  points: number;
  combatOutcome?: "fallen";
}

export interface RoomTransitionSignal {
  /** Zero-based room indices. The final signal points to the next floor index. */
  fromRoomIndex: number;
  toRoomIndex: number;
  object: ObjectKind;
  complete: boolean;
}

/** Small graybox movement model; renderer and keyboard both consume this state. */
export class WalkField {
  private _rooms: EchoRoom[] = createEchoRooms();
  private readonly _transitionSignals: RoomTransitionSignal[] = [];
  public get boundary(): number {
    return FIELD_BOUNDARY;
  }
  public player: FieldPosition = { x: 0, z: START_Z };
  public thread: string = "";
  public framesAdvanced: number = 0;
  public distanceTravelled: number = 0;
  public roomIndex: number = 0;
  public phase:
    "exploring" | "prompt" | "fighting" | "result" | "rewriting" | "complete" =
    "exploring";
  public choices: EchoChoice[] = [];
  public state: Record<string, OmlStateValue> = {};
  public emittedEvents: string[] = [];
  public selected: RoomObject | null = null;
  public guide: Guide | null = null;
  private _fightRemaining: number = 0;

  public get activeRoom(): EchoRoom {
    return this._rooms[this.roomIndex];
  }
  public get layout(): EarlyFloorLayout | null {
    return this.activeRoom.layout ?? null;
  }
  public get transitionSignal(): RoomTransitionSignal | null {
    return this._transitionSignals[0] ?? null;
  }

  public consumeTransitionSignal(): RoomTransitionSignal | null {
    return this._transitionSignals.shift() ?? null;
  }

  public get objects(): RoomObject[] {
    return this.activeRoom.objects;
  }
  public get scriptRevision(): number {
    return this.roomIndex + 1;
  }
  public get scriptPreview(): string {
    const index: number = this.roomIndex + (this.phase === "rewriting" ? 1 : 0);
    const room = this._rooms[index];
    // ponytail: in-world shell-shaped text, never evaluated. The trusted room
    // data below is also what the runtime applies; no second scripting engine.
    return [
      "# OMEGA / next floor script",
      `REVISION=${index + 1}`,
      `DUNGEON_MASTER=${JSON.stringify(room.owner)}`,
      ...room.objects.map(
        (object) =>
          `${object.kind.toUpperCase()}=${JSON.stringify(object.text)}`
      ),
    ].join("\n");
  }
  public get nearest(): RoomObject | null {
    return (
      this.objects.find(
        (object: RoomObject): boolean =>
          Math.hypot(object.x - this.player.x, object.z - this.player.z) <=
          REACH
      ) ?? null
    );
  }

  public start(thread: string, variationSeed: number = 0): void {
    this._rooms = createEchoRooms(variationSeed);
    this.player = {
      ...(this._rooms[0].heroStart ?? { x: 0, z: START_Z }),
    };
    this.thread = thread;
    this.framesAdvanced = 0;
    this.distanceTravelled = 0;
    this.roomIndex = 0;
    this.phase = "exploring";
    this.choices = [];
    this.state = {};
    this.emittedEvents = [];
    this.selected = null;
    this.guide = null;
    this._fightRemaining = 0;
    this._transitionSignals.length = 0;
  }

  public update(delta: number, x: number, z: number): void {
    if (![delta, x, z].every(Number.isFinite) || delta <= 0) return;
    this.framesAdvanced += 1;
    if (this.phase === "fighting") {
      this._fightRemaining -= Math.min(delta, MAX_STEP);
      if (this._fightRemaining <= 0) {
        const choice = this.choices[this.roomIndex];
        if (choice?.object === "monster") choice.combatOutcome = "fallen";
        this.phase = "result";
      }
    }
    if (this.phase !== "exploring" && this.phase !== "result") return;
    const length: number = Math.max(1, Math.hypot(x, z));
    const distance: number = Math.min(delta, MAX_STEP) * WALK_SPEED;
    const nextX: number = Math.max(
      -this.boundary,
      Math.min(this.boundary, this.player.x + (x / length) * distance)
    );
    const nextZ: number = Math.max(
      -this.boundary,
      Math.min(this.boundary, this.player.z + (z / length) * distance)
    );
    const clear = (px: number, pz: number): boolean =>
      this.objects.every((object: RoomObject): boolean => {
        const isSelectedExit =
          this.selected === object && this.choices.length > this.roomIndex;
        return (
          isSelectedExit ||
          Math.hypot(object.x - px, object.z - pz) >= SOLID_RADIUS
        );
      }) &&
      (this.activeRoom.blocks ?? []).every((block): boolean => {
        const dx = px - block.x;
        const dz = pz - block.z;
        const angle = block.rotationRadians ?? 0;
        const localX = dx * Math.cos(angle) + dz * Math.sin(angle);
        const localZ = -dx * Math.sin(angle) + dz * Math.cos(angle);
        return (
          Math.abs(localX) >= block.width / 2 + PLAYER_RADIUS ||
          Math.abs(localZ) >= block.depth / 2 + PLAYER_RADIUS
        );
      });
    const allowedX: number = clear(nextX, this.player.z)
      ? nextX
      : this.player.x;
    const allowedZ: number = clear(allowedX, nextZ) ? nextZ : this.player.z;
    this.distanceTravelled += Math.hypot(
      allowedX - this.player.x,
      allowedZ - this.player.z
    );
    this.player.x = allowedX;
    this.player.z = allowedZ;
    if (
      this.phase === "result" &&
      this.selected &&
      this.choices.length > this.roomIndex &&
      Math.hypot(
        this.selected.x - this.player.x,
        this.selected.z - this.player.z
      ) <= EXIT_CROSS_RADIUS
    ) {
      this._crossSelectedExit();
    }
  }

  public interact(): boolean {
    if (this.phase !== "exploring" || !this.nearest) return false;
    this.selected = this.nearest;
    this.phase =
      this.selected.kind === "door"
        ? "prompt"
        : this.selected.kind === "monster"
          ? "fighting"
          : "result";
    if (this.selected.kind === "monster") {
      this._resolve("");
      this.phase = "fighting";
      this._fightRemaining = AUTO_FIGHT_SECONDS;
    }
    if (this.selected.kind === "chest") this._resolve("");
    return true;
  }

  public answer(text: string): boolean {
    if (this.phase !== "prompt" || !text.trim()) return false;
    this._resolve(text.trim().slice(0, 240));
    return true;
  }

  private _resolve(answer: string): void {
    if (!this.selected || this.choices.length > this.roomIndex) return;
    const owner: Guide = this.activeRoom.owner;
    this.choices.push({
      room: owner,
      object: this.selected.kind,
      alignment: this.selected.alignment,
      answer,
      points: this.selected.alignment === owner ? 2 : 1,
    });
    for (const effect of this.selected.effects) this._applyEffect(effect);
    if (this.selected.emit) this.emittedEvents.push(this.selected.emit);
    this.phase = "result";
  }

  private _applyEffect(effect: OmlStateEffect): void {
    if (effect.operation === "set") {
      this.state[effect.path] = effect.value;
      return;
    }
    const current = this.state[effect.path];
    const increment = typeof effect.value === "number" ? effect.value : 0;
    this.state[effect.path] =
      (typeof current === "number" ? current : 0) + increment;
  }

  public continue(): void {
    // Retained for older callers. Floor progress now requires crossing the chosen exit.
  }

  private _crossSelectedExit(): void {
    if (!this.selected || this.choices.length <= this.roomIndex) return;
    const fromRoomIndex = this.roomIndex;
    const toRoomIndex = fromRoomIndex + 1;
    const complete = toRoomIndex >= this._rooms.length;
    this._transitionSignals.push({
      fromRoomIndex,
      toRoomIndex,
      object: this.selected.kind,
      complete,
    });
    if (!complete) {
      this.roomIndex = toRoomIndex;
      this.player = {
        ...(this.activeRoom.heroStart ?? { x: 0, z: START_Z }),
      };
      this.selected = null;
      this.phase = "exploring";
      return;
    }
    const totals: Record<Guide, number> = { Light: 0, Shadow: 0, Ambition: 0 };
    for (const choice of this.choices)
      totals[choice.alignment] += choice.points;
    const highest: number = Math.max(...Object.values(totals));
    const tied: Guide[] = this._rooms
      .map((room): Guide => room.owner)
      .filter((id: Guide): boolean => totals[id] === highest);
    // Provisional deterministic tie rule: prefer the Stage 1 thread, then room order.
    this.guide =
      tied.find((id: Guide): boolean => id === this.thread) ?? tied[0];
    this.phase = "complete";
  }
}
