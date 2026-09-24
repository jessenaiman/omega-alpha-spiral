import {
  FLOOR_7_TOWN,
  type LateFloorPoint,
  type TownRoute,
} from "./late-floor-7-town";
import { FLOOR_8_FINALE } from "./late-floor-8-finale";
import type { Guide } from "../rooms";

export type LateFloorId = 7 | 8;
export type LateFloorStatus =
  | "exploring"
  | "ready-to-choose"
  | "route-selected"
  | "core-approach"
  | "complete";
export type CollectorPhase =
  "telegraphing" | "sweeping" | "cooldown" | "stunned";
export type LateFloorInteraction =
  | "dw-light"
  | "dw-shadow"
  | "dw-ambition"
  | "exit-boulevard"
  | "exit-alleys"
  | "exit-core"
  | "healing-core";

export interface LateFloorAxes {
  readonly x: number;
  readonly z: number;
}

export interface CollectorSnapshot {
  readonly id: string;
  readonly position: LateFloorPoint;
  readonly phase: CollectorPhase;
  readonly health: number;
  readonly stunnedSeconds: number;
  readonly pressure: number;
}

/**
 * Small deterministic state owner for the Floor 7 town and Floor 8 core approach.
 * It has no Three.js, DOM, audio, timer, or renderer dependencies.
 */
export class LateFloorState {
  public floor: LateFloorId = 7;
  public readonly player: { x: number; z: number } = { x: 0, z: 0 };
  private _status: LateFloorStatus = "exploring";
  private readonly gathered: Set<Guide> = new Set();
  private _selectedRoute: TownRoute["id"] | null = null;
  private _transitionSignal: 8 | "complete" | null = null;
  private _collectorClock = 0;
  private _collectorPressure = 0;
  private _memoryRecycles = 0;
  private readonly _collectorHealth = [2, 2];
  private readonly _collectorStunSeconds = [0, 0];

  public constructor() {
    this.start(7);
  }

  public get status(): LateFloorStatus {
    return this._status;
  }

  public get partySize(): number {
    return FLOOR_7_TOWN.party.memberCount;
  }

  public get gatheredDreamweavers(): readonly Guide[] {
    return (["Light", "Shadow", "Ambition"] as const).filter((guide) =>
      this.gathered.has(guide)
    );
  }

  public get selectedRoute(): TownRoute["id"] | null {
    return this._selectedRoute;
  }

  public get collectorPressure(): number {
    return this._collectorPressure;
  }

  public get memoryRecycles(): number {
    return this._memoryRecycles;
  }

  public get collectors(): readonly CollectorSnapshot[] {
    if (this.floor !== 7) return [];
    return FLOOR_7_TOWN.encounters
      .filter((encounter) => encounter.kind === "collector")
      .map((encounter, index) => {
        const patrol = FLOOR_7_TOWN.garbageCollectors.patrols[index];
        const period = 8;
        const phaseTime = (this._collectorClock + index * 3.2) % 6.4;
        const along = (this._collectorClock % period) / period;
        const pingPong = along < 0.5 ? along * 2 : 2 - along * 2;
        return {
          id: encounter.id,
          position: {
            x: patrol.from.x + (patrol.to.x - patrol.from.x) * pingPong,
            z: patrol.from.z + (patrol.to.z - patrol.from.z) * pingPong,
          },
          phase:
            this._collectorStunSeconds[index] > 0
              ? "stunned"
              : phaseTime < 0.9
                ? "telegraphing"
                : phaseTime < 2.4
                  ? "sweeping"
                  : "cooldown",
          health: this._collectorHealth[index],
          stunnedSeconds: this._collectorStunSeconds[index],
          pressure: this._collectorPressure,
        } satisfies CollectorSnapshot;
      });
  }

  /** Start a fresh Floor 7 town or Floor 8 finale state. */
  public start(floor: LateFloorId): void {
    this.floor = floor;
    const origin = floor === 7 ? FLOOR_7_TOWN.start : FLOOR_8_FINALE.start;
    this.player.x = origin.x;
    this.player.z = origin.z;
    this._status = floor === 7 ? "exploring" : "core-approach";
    this.gathered.clear();
    this._selectedRoute = null;
    this._transitionSignal = null;
    this._collectorClock = 0;
    this._collectorPressure = 0;
    this._memoryRecycles = 0;
    this._collectorHealth[0] = 2;
    this._collectorHealth[1] = 2;
    this._collectorStunSeconds[0] = 0;
    this._collectorStunSeconds[1] = 0;
  }

  /** Move in x/z world axes, then advance collector telegraphs and floor transitions. */
  public update(deltaSeconds: number, axes: LateFloorAxes): void {
    if (
      this._status === "complete" ||
      !Number.isFinite(deltaSeconds) ||
      deltaSeconds <= 0
    )
      return;
    const dt = Math.min(deltaSeconds, 0.1);
    const layout = this.floor === 7 ? FLOOR_7_TOWN : FLOOR_8_FINALE;
    this._move(layout, dt, axes);

    if (this.floor === 7) {
      this._updateCollectors(dt);
      if (this._selectedRoute) this._tryEnterFloor8();
    } else {
      const core = FLOOR_8_FINALE.landmarks.find(
        (landmark) => landmark.id === "healing-core"
      );
      if (core && distance(this.player, core.position) <= 2.6) this._complete();
    }
  }

  /**
   * Gather a nearby Dreamweaver, select an exit at the plaza after gathering all three,
   * or complete the finale on arrival at the healing core.
   */
  public interact(targetId?: LateFloorInteraction): boolean {
    if (this._status === "complete") return false;

    if (this.floor === 8) {
      if (targetId !== undefined && targetId !== "healing-core") return false;
      const core = FLOOR_8_FINALE.landmarks.find(
        (landmark) => landmark.id === "healing-core"
      );
      if (!core || distance(this.player, core.position) > 2.6) return false;
      this._complete();
      return true;
    }

    const dreamweaverId = targetId?.startsWith("dw-")
      ? targetId
      : targetId === undefined
        ? this._nearestDreamweaver()
        : null;
    if (dreamweaverId) return this._gather(dreamweaverId);

    const routeByExit: Record<string, TownRoute["id"]> = {
      "exit-boulevard": "boulevard",
      "exit-alleys": "alleys",
      "exit-core": "core",
    };
    const routeId = targetId ? routeByExit[targetId] : undefined;
    if (!routeId || this._status !== "ready-to-choose") return false;
    const hub = FLOOR_7_TOWN.routes[0].from;
    if (distance(this.player, hub) > 4.5) return false;
    this._selectedRoute = routeId;
    this._status = "route-selected";
    return true;
  }

  /** Hit the nearest collector within reach, or the named collector. Two hits stun it for six seconds. */
  public hit(targetId?: string): boolean {
    if (this.floor !== 7 || this._status === "complete") return false;
    const candidates = this.collectors
      .filter(
        (collector) =>
          collector.phase !== "stunned" &&
          (targetId === undefined || collector.id === targetId)
      )
      .map((collector) => ({
        collector,
        range: distance(this.player, collector.position),
      }))
      .filter(({ range }) => range <= 2.25)
      .sort((a, b) => a.range - b.range);
    const target = candidates[0]?.collector;
    if (!target) return false;
    const index = target.id === "collector-sweeper" ? 0 : 1;
    this._collectorHealth[index] = Math.max(
      0,
      this._collectorHealth[index] - 1
    );
    if (this._collectorHealth[index] === 0) {
      this._collectorStunSeconds[index] = 6;
      this._collectorPressure = Math.max(0, this._collectorPressure - 0.8);
    }
    return true;
  }

  /** Returns and clears the pending level transition, if one occurred. */
  public consumeTransitionSignal(): 8 | "complete" | null {
    const signal = this._transitionSignal;
    this._transitionSignal = null;
    return signal;
  }

  private _nearestDreamweaver(): string | null {
    const nearest = FLOOR_7_TOWN.landmarks
      .filter((landmark) => landmark.kind === "dreamweaver")
      .map((landmark) => ({
        landmark,
        range: distance(this.player, landmark.position),
      }))
      .filter(({ range }) => range <= 3)
      .sort((a, b) => a.range - b.range)[0];
    return nearest?.landmark.id ?? null;
  }

  private _gather(id: string): boolean {
    const guideById: Record<string, Guide> = {
      "dw-light": "Light",
      "dw-shadow": "Shadow",
      "dw-ambition": "Ambition",
    };
    const guide = guideById[id];
    const landmark = FLOOR_7_TOWN.landmarks.find((item) => item.id === id);
    if (
      !guide ||
      !landmark ||
      distance(this.player, landmark.position) > 3 ||
      this.gathered.has(guide)
    )
      return false;
    this.gathered.add(guide);
    if (this.gathered.size === 3) this._status = "ready-to-choose";
    return true;
  }

  private _move(
    layout: typeof FLOOR_7_TOWN | typeof FLOOR_8_FINALE,
    dt: number,
    axes: LateFloorAxes
  ): void {
    if (!Number.isFinite(axes.x) || !Number.isFinite(axes.z)) return;
    const magnitude = Math.max(1, Math.hypot(axes.x, axes.z));
    const step = Math.min(dt, 0.1) * 6;
    const bounds = layout.bounds;
    const nextX = clamp(
      this.player.x + (axes.x / magnitude) * step,
      bounds.x - bounds.width / 2,
      bounds.x + bounds.width / 2
    );
    const nextZ = clamp(
      this.player.z + (axes.z / magnitude) * step,
      bounds.z - bounds.depth / 2,
      bounds.z + bounds.depth / 2
    );
    const radius = FLOOR_7_TOWN.playerCollision.radius;
    const tryAxis = (x: number, z: number): boolean =>
      layout.collision.every((box) => !circleOverlapsBox(x, z, radius, box));
    const x = tryAxis(nextX, this.player.z) ? nextX : this.player.x;
    const z = tryAxis(x, nextZ) ? nextZ : this.player.z;
    this.player.x = x;
    this.player.z = z;
  }

  private _updateCollectors(dt: number): void {
    this._collectorClock += dt;
    for (let i = 0; i < this._collectorStunSeconds.length; i++) {
      if (this._collectorStunSeconds[i] <= 0) continue;
      this._collectorStunSeconds[i] = Math.max(
        0,
        this._collectorStunSeconds[i] - dt
      );
      if (this._collectorStunSeconds[i] === 0) this._collectorHealth[i] = 2;
    }
    const activeCollectors = this.collectors.filter(
      (collector) => collector.phase !== "stunned"
    );
    const exposed = activeCollectors.some(
      (collector) =>
        collector.phase !== "cooldown" &&
        distance(this.player, collector.position) <= 3.2
    );
    const contact = activeCollectors.some(
      (collector) =>
        collector.phase === "sweeping" &&
        distance(this.player, collector.position) <= 1.25
    );
    this._collectorPressure = clamp(
      this._collectorPressure +
        (exposed ? dt : -dt * 0.18) +
        (contact ? dt * 2 : 0),
      0,
      3
    );
    if (this._collectorPressure >= 3) {
      // Recycled memory is local scenery; gathered guides, route state, and progress survive.
      this._memoryRecycles += 1;
      this._collectorPressure = 0;
    }
  }

  private _tryEnterFloor8(): void {
    const route = FLOOR_7_TOWN.routes.find(
      (candidate) => candidate.id === this._selectedRoute
    );
    const exit =
      route &&
      FLOOR_7_TOWN.exits.find((candidate) => candidate.id === route.exitId);
    if (!exit || !this._overlapsExit(exit.bounds)) return;
    this.floor = 8;
    this.player.x = FLOOR_8_FINALE.start.x;
    this.player.z = FLOOR_8_FINALE.start.z;
    this._status = "core-approach";
    this._transitionSignal = 8;
  }

  private _overlapsExit(bounds: {
    x: number;
    z: number;
    width: number;
    depth: number;
  }): boolean {
    const radius = FLOOR_7_TOWN.playerCollision.radius;
    return (
      Math.abs(this.player.x - bounds.x) <= bounds.width / 2 + radius &&
      Math.abs(this.player.z - bounds.z) <= bounds.depth / 2 + radius
    );
  }

  private _complete(): void {
    this._status = "complete";
    this._transitionSignal = "complete";
  }
}

function distance(a: LateFloorPoint, b: LateFloorPoint): number {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function circleOverlapsBox(
  x: number,
  z: number,
  radius: number,
  box: { x: number; z: number; width: number; depth: number }
): boolean {
  const dx = Math.max(Math.abs(x - box.x) - box.width / 2, 0);
  const dz = Math.max(Math.abs(z - box.z) - box.depth / 2, 0);
  return dx * dx + dz * dz < radius * radius;
}
