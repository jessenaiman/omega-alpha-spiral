import type {
  EncounterEnemy,
  FloorPoint,
  MiddleFloorEncounter,
} from "./middle-types";

export type CombatOutcome = "won" | "fallen";
export type CombatPhase = "active" | CombatOutcome;
export type CombatAttackShape = "charge-lane" | "aimed-tile" | "sweep-arc";

export interface CombatTelegraph {
  readonly shape: CombatAttackShape;
  readonly label: string;
  readonly origin: FloorPoint;
  /** Attack aim is snapshotted at telegraph time, leaving room to evade. */
  readonly target: FloorPoint;
  readonly remainingMs: number;
}

export interface CombatEnemyState {
  readonly id: string;
  readonly role: EncounterEnemy["role"];
  readonly position: FloorPoint;
  readonly health: number;
  readonly maxHealth: number;
  readonly attackRange: number;
  readonly windupMs: number;
  readonly cooldownMs: number;
  readonly damage: number;
  readonly telegraphLabel: string;
  readonly cooldownRemainingMs: number;
  readonly telegraph: CombatTelegraph | null;
}

export interface CombatPlayerState {
  readonly position: FloorPoint;
  readonly health: number;
  readonly maxHealth: number;
  readonly hitCooldownRemainingMs: number;
  readonly evadeCooldownRemainingMs: number;
  readonly recoveryProgressMs: number;
}

export interface CombatEchoRecord {
  readonly encounterId: string;
  readonly outcome: CombatOutcome;
  readonly playerHealthAtResolution: number;
  readonly defeatedEnemyIds: readonly string[];
}

export interface CombatResolution {
  readonly outcome: CombatOutcome;
  readonly exitUnlocked: true;
  readonly progression: "advance";
  readonly checkpoint: FloorPoint;
  readonly echo: CombatEchoRecord;
}

export type CombatEvent =
  | { readonly type: "telegraph-started"; readonly enemyId: string; readonly shape: CombatAttackShape; readonly label: string; readonly target: FloorPoint }
  | { readonly type: "enemy-damaged"; readonly enemyId: string; readonly damage: number; readonly health: number }
  | { readonly type: "player-damaged"; readonly enemyId: string; readonly damage: number; readonly health: number }
  | { readonly type: "player-evaded"; readonly from: FloorPoint; readonly to: FloorPoint }
  | { readonly type: "player-recovered"; readonly amount: number; readonly health: number }
  | { readonly type: "resolved"; readonly outcome: CombatOutcome };

export interface CombatEncounterState {
  readonly encounterId: string;
  readonly phase: CombatPhase;
  readonly checkpoint: FloorPoint;
  readonly arena: MiddleFloorEncounter["arena"];
  readonly player: CombatPlayerState;
  readonly enemies: readonly CombatEnemyState[];
  /** Events produced by the most recent reducer call; consume after scene reactions. */
  readonly events: readonly CombatEvent[];
  readonly resolution: CombatResolution | null;
  readonly tuning: Required<CombatEncounterOptions>;
}

export interface CombatEncounterOptions {
  readonly maxHealth?: number;
  readonly moveSpeed?: number;
  readonly hitDamage?: number;
  readonly hitReach?: number;
  readonly hitCooldownMs?: number;
  readonly evadeDistance?: number;
  readonly evadeCooldownMs?: number;
}

export interface CombatMoveInput {
  readonly x: number;
  readonly z: number;
}

const DEFAULTS: Required<CombatEncounterOptions> = {
  maxHealth: 3,
  moveSpeed: 6,
  hitDamage: 1,
  hitReach: 1.8,
  hitCooldownMs: 420,
  evadeDistance: 4.5,
  evadeCooldownMs: 650,
};

const MAX_FRAME_MS = 100;
const MAX_ADVANCE_MS = 5000;
const PLAYER_RADIUS = 0.35;
const CHARGE_HALF_WIDTH = 1.15;
const AIMED_TILE_RADIUS = 1.2;
const SWEEP_RADIUS = 1.9;
const RECOVERY_INTERVAL_MS = 2200;
const RECOVERY_HEAL = 1;
const FALLEN_RECOVERY_RATIO = 0.35;

/**
 * Create a deterministic, scene-independent encounter reducer state.
 * Call only when the scene moves the hero into this authored arena. `playerStart`
 * must already be inside it; outer floor traversal/collision belongs to the scene
 * adapter. The encounter checkpoint may be outside the arena, so the adapter owns
 * placing the hero there after a fall and entering the arena again.
 * Encounter data owns enemy timing and damage; options tune the player's verbs.
 */
export function createCombatEncounter(
  encounter: MiddleFloorEncounter,
  playerStart: FloorPoint = encounter.checkpoint,
  options: CombatEncounterOptions = {}
): CombatEncounterState {
  if (encounter.enemies.length < 1 || encounter.enemies.length > 2) {
    throw new Error(`Encounter ${encounter.id} must contain one or two enemies.`);
  }
  if (!isInsideArena(playerStart, encounter.arena)) {
    throw new Error(
      `Encounter ${encounter.id} requires an in-arena playerStart; the scene adapter owns exterior travel and checkpoint entry.`
    );
  }
  const tuning: Required<CombatEncounterOptions> = {
    maxHealth: positive(options.maxHealth, DEFAULTS.maxHealth),
    moveSpeed: positive(options.moveSpeed, DEFAULTS.moveSpeed),
    hitDamage: positive(options.hitDamage, DEFAULTS.hitDamage),
    hitReach: positive(options.hitReach, DEFAULTS.hitReach),
    hitCooldownMs: positive(options.hitCooldownMs, DEFAULTS.hitCooldownMs),
    evadeDistance: positive(options.evadeDistance, DEFAULTS.evadeDistance),
    evadeCooldownMs: positive(options.evadeCooldownMs, DEFAULTS.evadeCooldownMs),
  };
  const maxHealth = tuning.maxHealth;
  return {
    encounterId: encounter.id,
    phase: "active",
    checkpoint: point(encounter.checkpoint),
    arena: {
      center: point(encounter.arena.center),
      width: encounter.arena.width,
      depth: encounter.arena.depth,
      recoveryZones: encounter.arena.recoveryZones.map((zone) => ({
        center: point(zone.center),
        radius: zone.radius,
      })),
    },
    player: {
      position: point(playerStart),
      health: maxHealth,
      maxHealth,
      hitCooldownRemainingMs: 0,
      evadeCooldownRemainingMs: 0,
      recoveryProgressMs: 0,
    },
    enemies: encounter.enemies.map((enemy) => ({
      id: enemy.id,
      role: enemy.role,
      position: point(enemy.spawn),
      health: enemy.health,
      maxHealth: enemy.health,
      attackRange: enemy.attackRange,
      windupMs: enemy.windupMs,
      cooldownMs: enemy.cooldownMs,
      damage: enemy.damage,
      telegraphLabel: enemy.telegraph,
      cooldownRemainingMs: 0,
      telegraph: null,
    })),
    events: [],
    resolution: null,
    tuning,
  };
}

/** Move and advance all enemy tells/attacks in real time. Call once per frame. */
export function advanceCombatEncounter(
  state: CombatEncounterState,
  deltaMs: number,
  movement: CombatMoveInput = { x: 0, z: 0 }
): CombatEncounterState {
  if (state.phase !== "active" || !Number.isFinite(deltaMs) || deltaMs <= 0) {
    return withEvents(state, []);
  }
  let remainingMs = Math.min(deltaMs, MAX_ADVANCE_MS);
  let current: CombatEncounterState = { ...state, events: [] };
  const allEvents: CombatEvent[] = [];
  while (remainingMs > 0 && current.phase === "active") {
    const frameMs = Math.min(remainingMs, MAX_FRAME_MS);
    current = advanceFrame(current, frameMs, movement);
    allEvents.push(...current.events);
    remainingMs -= frameMs;
  }
  return { ...current, events: allEvents };
}

/** Hit the nearest living enemy inside the authored reach. Misses still use cooldown. */
export function hitCombatEnemy(
  state: CombatEncounterState
): CombatEncounterState {
  if (state.phase !== "active" || state.player.hitCooldownRemainingMs > 0) {
    return withEvents(state, []);
  }
  let nearestIndex = -1;
  let nearestDistance = state.tuning.hitReach;
  state.enemies.forEach((enemy, index) => {
    if (enemy.health <= 0) return;
    const distance = distanceBetween(state.player.position, enemy.position);
    if (distance <= nearestDistance) {
      nearestDistance = distance;
      nearestIndex = index;
    }
  });
  const enemies = state.enemies.slice();
  const events: CombatEvent[] = [];
  if (nearestIndex >= 0) {
    const target = enemies[nearestIndex]!;
    const health = Math.max(0, target.health - state.tuning.hitDamage);
    enemies[nearestIndex] = { ...target, health };
    events.push({
      type: "enemy-damaged",
      enemyId: target.id,
      damage: target.health - health,
      health,
    });
  }
  let next: CombatEncounterState = {
    ...state,
    enemies,
    player: {
      ...state.player,
      hitCooldownRemainingMs: state.tuning.hitCooldownMs,
    },
    events,
  };
  if (enemies.every((enemy) => enemy.health <= 0)) {
    next = resolveEncounter(next, "won", events);
  }
  return next;
}

/** Directional Run/evade action; moves outside the current telegraph where space allows. */
export function evadeCombatPlayer(
  state: CombatEncounterState,
  direction: CombatMoveInput
): CombatEncounterState {
  if (state.phase !== "active" || state.player.evadeCooldownRemainingMs > 0) {
    return withEvents(state, []);
  }
  const preferred = normalize(direction);
  const nearestThreat = state.enemies
    .filter((enemy) => enemy.health > 0)
    .sort(
      (left, right) =>
        distanceBetween(left.position, state.player.position) -
        distanceBetween(right.position, state.player.position)
    )[0];
  const away = nearestThreat
    ? normalize({
        x: state.player.position.x - nearestThreat.position.x,
        z: state.player.position.z - nearestThreat.position.z,
    })
    : { x: 0, z: 1 };
  const distanceToThreat = nearestThreat
    ? distanceBetween(state.player.position, nearestThreat.position)
    : 0;
  const escapingThreat = Boolean(
    nearestThreat && distanceToThreat <= nearestThreat.attackRange + 0.5
  );
  const vector = escapingThreat || (preferred.x === 0 && preferred.z === 0)
    ? away
    : normalize({
        x: preferred.x + away.x * 0.35,
        z: preferred.z + away.z * 0.35,
      });
  const escapeDistance = escapingThreat && nearestThreat
    ? Math.max(
        state.tuning.evadeDistance,
        nearestThreat.attackRange + 1 - distanceToThreat
      )
    : state.tuning.evadeDistance;
  const from = point(state.player.position);
  const destination = clampToArena(
    {
      x: from.x + vector.x * escapeDistance,
      z: from.z + vector.z * escapeDistance,
    },
    state.arena
  );
  const events: CombatEvent[] = [
    { type: "player-evaded", from, to: point(destination) },
  ];
  return {
    ...state,
    player: {
      ...state.player,
      position: destination,
      evadeCooldownRemainingMs: state.tuning.evadeCooldownMs,
    },
    events,
  };
}

function advanceFrame(
  state: CombatEncounterState,
  deltaMs: number,
  movement: CombatMoveInput
): CombatEncounterState {
  const events: CombatEvent[] = [];
  const direction = normalize(movement);
  const playerPosition = clampToArena(
    {
      x: state.player.position.x + direction.x * state.tuning.moveSpeed * deltaMs / 1000,
      z: state.player.position.z + direction.z * state.tuning.moveSpeed * deltaMs / 1000,
    },
    state.arena
  );
  let player: CombatPlayerState = {
    ...state.player,
    position: playerPosition,
    hitCooldownRemainingMs: Math.max(0, state.player.hitCooldownRemainingMs - deltaMs),
    evadeCooldownRemainingMs: Math.max(0, state.player.evadeCooldownRemainingMs - deltaMs),
  };
  const inRecovery = state.arena.recoveryZones.some(
    (zone) => distanceBetween(playerPosition, zone.center) <= zone.radius
  );
  if (inRecovery && player.health < player.maxHealth) {
    const progress = player.recoveryProgressMs + deltaMs;
    if (progress >= RECOVERY_INTERVAL_MS) {
      const amount = Math.min(RECOVERY_HEAL, player.maxHealth - player.health);
      player = {
        ...player,
        health: player.health + amount,
        recoveryProgressMs: progress - RECOVERY_INTERVAL_MS,
      };
      events.push({
        type: "player-recovered",
        amount,
        health: player.health,
      });
    } else {
      player = { ...player, recoveryProgressMs: progress };
    }
  } else if (!inRecovery) {
    player = { ...player, recoveryProgressMs: 0 };
  }

  let next: CombatEncounterState = { ...state, player, events };
  const enemies = state.enemies.map((enemy) => {
    if (enemy.health <= 0) return enemy;
    if (enemy.telegraph) {
      const remainingMs = enemy.telegraph.remainingMs - deltaMs;
      if (remainingMs > 0) {
        return {
          ...enemy,
          telegraph: { ...enemy.telegraph, remainingMs },
          cooldownRemainingMs: Math.max(0, enemy.cooldownRemainingMs - deltaMs),
        };
      }
      if (attackHits(enemy.telegraph, playerPosition)) {
        const health = Math.max(0, next.player.health - enemy.damage);
        events.push({
          type: "player-damaged",
          enemyId: enemy.id,
          damage: next.player.health - health,
          health,
        });
        next = { ...next, player: { ...next.player, health } };
      }
      return {
        ...enemy,
        telegraph: null,
        cooldownRemainingMs: enemy.cooldownMs,
      };
    }
    const cooldownRemainingMs = Math.max(0, enemy.cooldownRemainingMs - deltaMs);
    if (
      cooldownRemainingMs === 0 &&
      distanceBetween(enemy.position, playerPosition) <= enemy.attackRange
    ) {
      const telegraph: CombatTelegraph = {
        shape: attackShape(enemy.role),
        label: enemy.telegraphLabel,
        origin: point(enemy.position),
        target: point(playerPosition),
        remainingMs: enemy.windupMs,
      };
      events.push({
        type: "telegraph-started",
        enemyId: enemy.id,
        shape: telegraph.shape,
        label: telegraph.label,
        target: telegraph.target,
      });
      return { ...enemy, cooldownRemainingMs, telegraph };
    }
    return { ...enemy, cooldownRemainingMs };
  });
  next = { ...next, enemies, events };
  if (next.player.health <= 0) return resolveEncounter(next, "fallen", events);
  if (enemies.every((enemy) => enemy.health <= 0)) {
    return resolveEncounter(next, "won", events);
  }
  return next;
}

function resolveEncounter(
  state: CombatEncounterState,
  outcome: CombatOutcome,
  events: CombatEvent[]
): CombatEncounterState {
  const playerHealthAtResolution = state.player.health;
  const defeatedEnemyIds = state.enemies
    .filter((enemy) => enemy.health <= 0)
    .map((enemy) => enemy.id);
  const fallen = outcome === "fallen";
  const resolution: CombatResolution = {
    outcome,
    exitUnlocked: true,
    progression: "advance",
    checkpoint: point(state.checkpoint),
    echo: {
      encounterId: state.encounterId,
      outcome,
      playerHealthAtResolution,
      defeatedEnemyIds,
    },
  };
  events.push({ type: "resolved", outcome });
  return {
    ...state,
    phase: outcome,
    player: {
      ...state.player,
      position: fallen ? point(state.checkpoint) : state.player.position,
      health: fallen
        ? Math.max(1, Math.ceil(state.player.maxHealth * FALLEN_RECOVERY_RATIO))
        : state.player.health,
    },
    events,
    resolution,
  };
}

function attackShape(role: EncounterEnemy["role"]): CombatAttackShape {
  if (role === "charger") return "charge-lane";
  if (role === "ranged") return "aimed-tile";
  return "sweep-arc";
}

function attackHits(telegraph: CombatTelegraph, player: FloorPoint): boolean {
  if (telegraph.shape === "aimed-tile") {
    return distanceBetween(player, telegraph.target) <= AIMED_TILE_RADIUS;
  }
  if (telegraph.shape === "sweep-arc") {
    return distanceBetween(player, telegraph.origin) <= SWEEP_RADIUS;
  }
  return distanceToSegment(player, telegraph.origin, telegraph.target) <= CHARGE_HALF_WIDTH;
}

function positive(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && (value ?? 0) > 0 ? value as number : fallback;
}

function withEvents(
  state: CombatEncounterState,
  events: readonly CombatEvent[]
): CombatEncounterState {
  return { ...state, events };
}

function point(value: FloorPoint): FloorPoint {
  return { x: value.x, z: value.z };
}

function normalize(value: CombatMoveInput): CombatMoveInput {
  if (![value.x, value.z].every(Number.isFinite)) return { x: 0, z: 0 };
  const length = Math.hypot(value.x, value.z);
  return length > 0 ? { x: value.x / length, z: value.z / length } : { x: 0, z: 0 };
}

function distanceBetween(left: FloorPoint, right: FloorPoint): number {
  return Math.hypot(left.x - right.x, left.z - right.z);
}

function clampToArena(
  position: FloorPoint,
  arena: MiddleFloorEncounter["arena"]
): FloorPoint {
  const halfWidth = Math.max(0, arena.width / 2 - PLAYER_RADIUS);
  const halfDepth = Math.max(0, arena.depth / 2 - PLAYER_RADIUS);
  return {
    x: Math.max(arena.center.x - halfWidth, Math.min(arena.center.x + halfWidth, position.x)),
    z: Math.max(arena.center.z - halfDepth, Math.min(arena.center.z + halfDepth, position.z)),
  };
}

function isInsideArena(
  position: FloorPoint,
  arena: MiddleFloorEncounter["arena"]
): boolean {
  const bounds = clampToArena(position, arena);
  return bounds.x === position.x && bounds.z === position.z;
}

function distanceToSegment(pointValue: FloorPoint, start: FloorPoint, end: FloorPoint): number {
  const dx = end.x - start.x;
  const dz = end.z - start.z;
  const lengthSquared = dx * dx + dz * dz;
  if (lengthSquared === 0) return distanceBetween(pointValue, start);
  const projection = Math.max(
    0,
    Math.min(1, ((pointValue.x - start.x) * dx + (pointValue.z - start.z) * dz) / lengthSquared)
  );
  return distanceBetween(pointValue, {
    x: start.x + projection * dx,
    z: start.z + projection * dz,
  });
}
