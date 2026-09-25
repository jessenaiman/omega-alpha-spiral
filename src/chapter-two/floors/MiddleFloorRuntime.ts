import * as THREE from "three";
import type { ChoiceDef, Oml, OmlStateValue } from "../../core/oml";
import { CHAPTER_ZERO_LEVELS_BY_ID } from "../../dialogue/chapter-zero-vite";
import { createMiddleFloor4 } from "./middle-floor-4";
import { createMiddleFloor5 } from "./middle-floor-5";
import { createMiddleFloor6 } from "./middle-floor-6";
import {
  advanceCombatEncounter,
  createCombatEncounter,
  evadeCombatPlayer,
  hitCombatEnemy,
  type CombatEchoRecord,
  type CombatEncounterState,
  type CombatEvent,
  type CombatOutcome,
  type CombatPhase,
  type CombatTelegraph,
} from "./CombatEncounter";
import {
  createMiddleFloorArtKit,
  type MiddleFloorArtResult,
} from "./MiddleFloorArtKit";
import type {
  FloorEffectCue,
  FloorLandmark,
  FloorPoint,
  MiddleFloorLayout,
  MiddleFloorNumber,
} from "./middle-types";

export type DreamweaverGuide = "Light" | "Shadow" | "Ambition";
export type MiddleFloorTransition = 5 | 6 | 7;

export interface AuthoredDreamweaverChoice {
  readonly guide: DreamweaverGuide;
  readonly text: string;
}

export interface MiddleFloorMovement {
  readonly x: number;
  readonly z: number;
}

export interface MiddleFloorRuntimeStatus {
  readonly floor: MiddleFloorNumber;
  readonly overallFloor: 8 | 9 | 10;
  readonly sceneId: string;
  readonly eraShaderId: string;
  readonly title: string;
  readonly question: string;
  readonly choices: readonly AuthoredDreamweaverChoice[];
  readonly playerPosition: FloorPoint;
  readonly playerHealth: number | null;
  readonly playerMaxHealth: number | null;
  readonly encounterPhase: CombatPhase | null;
  readonly enemies: CombatEncounterState["enemies"];
  readonly encounterOutcome: CombatOutcome | null;
  readonly exitUnlocked: boolean;
  readonly objective: string;
  readonly discoveredLandmarkIds: readonly string[];
  readonly activeEffectIds: readonly string[];
  readonly offerLandmarkId: string | null;
  readonly nearOffer: boolean;
  readonly selectedAnswer: DreamweaverGuide | null;
  readonly hitEnabled: boolean;
  readonly weaponEnabled: boolean;
  readonly transitionTo: MiddleFloorTransition | null;
}

interface ActiveEffect {
  readonly root: THREE.Object3D;
  remainingMs: number;
}

interface FallbackTelegraph {
  readonly root: THREE.Group;
  readonly marker: THREE.Object3D;
  readonly shape: "charge-lane" | "aimed-tile" | "sweep-arc";
}

const PLAYER_RADIUS = 0.35;
const MOVE_SPEED = 6;
const OUTER_RUN_DISTANCE = 3.5;
const OUTER_RUN_COOLDOWN_MS = 450;
const EXIT_CROSS_RADIUS = 0.85;
const MAX_UPDATE_MS = 5000;
const MAX_STEP_MS = 50;
const FALLBACK_TELEGRAPH_COLOR = 0xffb648;
const DREAMWEAVERS: readonly DreamweaverGuide[] = [
  "Light",
  "Shadow",
  "Ambition",
];

function guideFromOwner(owner: string): DreamweaverGuide {
  if (owner === "light") return "Light";
  if (owner === "shadow") return "Shadow";
  if (owner === "ambition") return "Ambition";
  throw new Error(`Unknown Dreamweaver owner: ${owner}`);
}

function authoredLevel(layout: MiddleFloorLayout): Oml {
  const level = CHAPTER_ZERO_LEVELS_BY_ID.get(layout.sceneId);
  if (!level) throw new Error(`Missing authored OML scene: ${layout.sceneId}`);
  return level;
}

function authoredChoice(level: Oml, guide: DreamweaverGuide): ChoiceDef {
  const owner = guide.toLowerCase();
  const choice = level.choices.find((candidate) => candidate.owner === owner);
  if (!choice)
    throw new Error(`${level.scene.id} has no answer authored by ${guide}.`);
  return choice;
}

function authoredStateValue(
  level: Oml,
  path: string
): OmlStateValue | undefined {
  return level.events.find(
    (event) => event.type === "set-state" && event.path === path
  )?.value;
}

/**
 * Owns middle-floor traversal and encounter state. Attach `group` once to the
 * scene; call `enterFloor` after a prior transition signal is consumed.
 */
export class MiddleFloorRuntime {
  public readonly group = new THREE.Group();
  private readonly _defaultSeed: number;
  private _layout: MiddleFloorLayout | null = null;
  private _art: MiddleFloorArtResult | null = null;
  private _combat: CombatEncounterState | null = null;
  private _playerPosition: FloorPoint = { x: 0, z: 0 };
  private _transitionSignal: MiddleFloorTransition | null = null;
  private _exitCrossed = false;
  private _disposed = false;
  private _clockMs = 0;
  private _runCooldownMs = 0;
  private readonly _insideLandmarks = new Set<string>();
  private readonly _discoveredLandmarks = new Set<string>();
  private readonly _activeEffects = new Map<string, ActiveEffect>();
  private readonly _cueReadyAt = new Map<string, number>();
  private readonly _fallbackTelegraphs = new Map<string, FallbackTelegraph>();
  private readonly _recordedEncounters = new Set<string>();
  private readonly _encounterEchoes: CombatEchoRecord[] = [];
  private readonly _dreamweaverAnswers: Partial<
    Record<MiddleFloorNumber, DreamweaverGuide>
  > = {};
  private _audioContext: AudioContext | null = null;

  public constructor(seed: number = 0) {
    this._defaultSeed = Number.isFinite(seed) ? Math.trunc(seed) : 0;
    this.group.name = "middle-floor-runtime";
  }

  public get layout(): MiddleFloorLayout | null {
    return this._layout;
  }

  public get playerPosition(): FloorPoint {
    return point(
      this._combat?.phase === "active"
        ? this._combat.player.position
        : this._playerPosition
    );
  }

  public get transitionSignal(): MiddleFloorTransition | null {
    return this._transitionSignal;
  }

  public get encounterEchoes(): readonly CombatEchoRecord[] {
    return this._encounterEchoes.slice();
  }

  public get dreamweaverAnswers(): Readonly<
    Partial<Record<MiddleFloorNumber, DreamweaverGuide>>
  > {
    return { ...this._dreamweaverAnswers };
  }

  public get status(): MiddleFloorRuntimeStatus | null {
    if (!this._layout) return null;
    const offer =
      this._layout.landmarks.find((landmark) => landmark.role === "offer") ??
      null;
    const position = this.playerPosition;
    const nearOffer = Boolean(
      offer && distanceBetween(position, offer.position) <= offer.reach
    );
    const level = authoredLevel(this._layout);
    const selectedAnswer =
      this._dreamweaverAnswers[this._layout.floor] ?? null;
    const hitEnabled = authoredStateValue(level, "gameplay.hit.enabled") !== false;
    const weaponEnabled = selectedAnswer
      ? authoredChoice(level, selectedAnswer).effects.some(
          (effect) =>
            effect.path === "gameplay.weapon.enabled" && effect.value === true
        )
      : false;
    const exitUnlocked = Boolean(this._combat?.resolution && selectedAnswer);
    const currentTelegraph =
      this._combat?.phase === "active"
        ? (this._combat.enemies.find((enemy) => enemy.telegraph)?.telegraph ??
          null)
        : null;
    const encounterObjective = !this._combat
      ? "Follow the marked route to the required encounter."
      : this._combat.phase === "active"
        ? currentTelegraph
          ? `Attack tell: ${currentTelegraph.label} Use Run to leave its marked area.`
          : hitEnabled
            ? weaponEnabled
              ? "Use the weapon Shadow opened for you. Run when an attack tell appears."
              : "Hit without a weapon. Run when an attack tell appears."
            : "You cannot Hit on this floor. Survive as long as you can."
        : this._combat.resolution?.outcome === "fallen"
          ? "You fell, but the floor kept your answer. Cross the marked exit."
          : "The encounter ended. Cross the marked exit.";
    const objective =
      !selectedAnswer
        ? nearOffer
          ? level.question.text ?? "Choose a Dreamweaver's answer."
          : "Reach the three Dreamweaver answers before the test."
        : encounterObjective;
    return {
      floor: this._layout.floor,
      overallFloor: this._layout.overallFloor,
      sceneId: level.scene.id ?? this._layout.sceneId,
      eraShaderId: level.scene.era_shader ?? this._layout.eraShaderId,
      title: level.scene.title ?? level.scene.id ?? "Never Go Alone",
      question: level.question.text ?? "",
      choices: level.choices.map((choice) => ({
        guide: guideFromOwner(choice.owner),
        text: choice.text,
      })),
      playerPosition: position,
      playerHealth: this._combat?.player.health ?? null,
      playerMaxHealth: this._combat?.player.maxHealth ?? null,
      encounterPhase: this._combat?.phase ?? null,
      enemies: this._combat?.enemies ?? [],
      encounterOutcome: this._combat?.resolution?.outcome ?? null,
      exitUnlocked,
      objective,
      discoveredLandmarkIds: [...this._discoveredLandmarks],
      activeEffectIds: [...this._activeEffects.keys()],
      offerLandmarkId: offer?.id ?? null,
      nearOffer,
      selectedAnswer,
      hitEnabled,
      weaponEnabled,
      transitionTo: this._transitionSignal,
    };
  }

  /** Load a floor's data/art while preserving earlier offer and encounter echoes. */
  public enterFloor(
    floor: MiddleFloorNumber,
    seed: number = this._defaultSeed
  ): void {
    if (this._disposed) return;
    this._clearFloorContent();
    const safeSeed = Number.isFinite(seed)
      ? Math.trunc(seed)
      : this._defaultSeed;
    this._layout = createLayout(floor, safeSeed);
    this._art = createMiddleFloorArtKit(this._layout);
    this.group.add(this._art.root);
    this._playerPosition = point(this._layout.spawn);
    this._combat = null;
    this._transitionSignal = null;
    this._exitCrossed = false;
    this._clockMs = 0;
    this._runCooldownMs = 0;
    this._insideLandmarks.clear();
    this._discoveredLandmarks.clear();
    this._activeEffects.clear();
    this._cueReadyAt.clear();
    this._recordedEncounters.clear();
    this._createFallbackTelegraphs();
    this._syncTelegraphSockets();
  }

  /** Advance traversal, collision, encounter telegraphs, cooldowns and event cues. */
  public update(
    deltaMs: number,
    movement: MiddleFloorMovement = { x: 0, z: 0 }
  ): void {
    if (
      this._disposed ||
      !this._layout ||
      !Number.isFinite(deltaMs) ||
      deltaMs <= 0 ||
      this._transitionSignal !== null
    )
      return;
    let remainingMs = Math.min(deltaMs, MAX_UPDATE_MS);
    while (remainingMs > 0 && this._transitionSignal === null) {
      const stepMs = Math.min(remainingMs, MAX_STEP_MS);
      this._clockMs += stepMs;
      this._runCooldownMs = Math.max(0, this._runCooldownMs - stepMs);
      if (this._combat?.phase === "active") {
        const allowedMovement = this._collisionSafeCombatMovement(
          this._combat.player.position,
          movement,
          stepMs,
          this._combat.player.maxHealth > 0
            ? this._combat.tuning.moveSpeed
            : MOVE_SPEED
        );
        this._applyCombatState(
          advanceCombatEncounter(this._combat, stepMs, allowedMovement)
        );
      } else {
        this._moveOnFloor(stepMs, movement);
        this._maybeEnterEncounter();
      }
      this._updateLandmarksAndExit();
      this._syncTelegraphSockets();
      this._updateEffectTimers(stepMs);
      remainingMs -= stepMs;
    }
  }

  /** Apply the encounter's Hit verb to its nearest living in-range enemy. */
  public hit(): boolean {
    if (this._disposed || !this._combat || this._combat.phase !== "active")
      return false;
    if (!this.status?.hitEnabled) return false;
    const previous = this._combat;
    const next = hitCombatEnemy(previous);
    const landed = next.events.some((event) => event.type === "enemy-damaged");
    this._applyCombatState(next);
    return landed;
  }

  /** Run to evade a live tell, or make a short collision-safe dash during traversal. */
  public run(direction: MiddleFloorMovement = { x: 0, z: 0 }): boolean {
    if (this._disposed || !this._layout || this._transitionSignal !== null)
      return false;
    if (this._combat?.phase === "active") {
      const before = this._combat;
      const escaped = evadeCombatPlayer(before, direction);
      const from = before.player.position;
      const requested = escaped.player.position;
      const destination = this._moveSegment(from, requested, true);
      if (distanceBetween(from, destination) < 0.01) return false;
      const events = escaped.events.map((event): CombatEvent =>
        event.type === "player-evaded"
          ? { ...event, to: point(destination) }
          : event
      );
      this._applyCombatState({
        ...escaped,
        player: { ...escaped.player, position: point(destination) },
        events,
      });
      this._updateLandmarksAndExit();
      this._syncTelegraphSockets();
      return true;
    }
    if (this._runCooldownMs > 0) return false;
    const vector = normalize(direction);
    if (vector.x === 0 && vector.z === 0) return false;
    const from = this._playerPosition;
    const requested = {
      x: from.x + vector.x * OUTER_RUN_DISTANCE,
      z: from.z + vector.z * OUTER_RUN_DISTANCE,
    };
    const destination = this._moveSegment(from, requested, false);
    if (distanceBetween(from, destination) < 0.01) return false;
    this._playerPosition = point(destination);
    this._runCooldownMs = OUTER_RUN_COOLDOWN_MS;
    this._maybeEnterEncounter();
    this._updateLandmarksAndExit();
    return true;
  }

  /** Choose the authored Dreamweaver answer while in reach of the mirror offer. */
  public chooseAnswer(guide: DreamweaverGuide): boolean {
    const offer = this._layout?.landmarks.find(
      (landmark) => landmark.role === "offer"
    );
    if (!offer || !DREAMWEAVERS.includes(guide)) return false;
    if (distanceBetween(this.playerPosition, offer.position) > offer.reach)
      return false;
    authoredChoice(authoredLevel(this._layout!), guide);
    this._dreamweaverAnswers[this._layout!.floor] = guide;
    return true;
  }

  /** Must be called from a user gesture before the first audio cue is scheduled. */
  public async unlockAudio(): Promise<boolean> {
    if (this._disposed || typeof AudioContext === "undefined") return false;
    try {
      this._audioContext ??= new AudioContext();
      if (this._audioContext.state !== "running")
        await this._audioContext.resume();
      return this._audioContext.state === "running";
    } catch {
      return false;
    }
  }

  public consumeTransitionSignal(): MiddleFloorTransition | null {
    const signal = this._transitionSignal;
    this._transitionSignal = null;
    return signal;
  }

  public dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this._clearFloorContent();
    this.group.clear();
    if (this._audioContext) {
      const context = this._audioContext;
      this._audioContext = null;
      void context.close().catch(() => undefined);
    }
  }

  private _moveOnFloor(deltaMs: number, movement: MiddleFloorMovement): void {
    const direction = normalize(movement);
    if (direction.x === 0 && direction.z === 0) return;
    const distance = (MOVE_SPEED * deltaMs) / 1000;
    const requested = {
      x: this._playerPosition.x + direction.x * distance,
      z: this._playerPosition.z + direction.z * distance,
    };
    this._playerPosition = point(
      this._slideMove(this._playerPosition, requested, false)
    );
  }

  private _collisionSafeCombatMovement(
    start: FloorPoint,
    movement: MiddleFloorMovement,
    deltaMs: number,
    speed: number
  ): MiddleFloorMovement {
    const direction = normalize(movement);
    if (direction.x === 0 && direction.z === 0) return direction;
    const distance = (speed * deltaMs) / 1000;
    const requested = {
      x: start.x + direction.x * distance,
      z: start.z + direction.z * distance,
    };
    if (this._canOccupy(requested, true)) return direction;
    const xOnly = { x: requested.x, z: start.z };
    const zOnly = { x: start.x, z: requested.z };
    const canMoveX = this._canOccupy(xOnly, true);
    const canMoveZ = this._canOccupy(zOnly, true);
    if (canMoveX && canMoveZ) {
      return Math.abs(direction.x) >= Math.abs(direction.z)
        ? { x: Math.sign(direction.x), z: 0 }
        : { x: 0, z: Math.sign(direction.z) };
    }
    if (canMoveX) return { x: Math.sign(direction.x), z: 0 };
    if (canMoveZ) return { x: 0, z: Math.sign(direction.z) };
    return { x: 0, z: 0 };
  }

  private _slideMove(
    start: FloorPoint,
    destination: FloorPoint,
    inArena: boolean
  ): FloorPoint {
    const dx = destination.x - start.x;
    const dz = destination.z - start.z;
    const direct = { x: start.x + dx, z: start.z + dz };
    if (this._canOccupy(direct, inArena)) return direct;
    const xOnly = { x: direct.x, z: start.z };
    const allowedX = this._canOccupy(xOnly, inArena) ? xOnly.x : start.x;
    const zOnly = { x: allowedX, z: direct.z };
    const allowedZ = this._canOccupy(zOnly, inArena) ? zOnly.z : start.z;
    return { x: allowedX, z: allowedZ };
  }

  private _moveSegment(
    start: FloorPoint,
    destination: FloorPoint,
    inArena: boolean
  ): FloorPoint {
    const distance = distanceBetween(start, destination);
    const steps = Math.max(1, Math.ceil(distance / 0.2));
    let position = point(start);
    for (let index = 1; index <= steps; index += 1) {
      const target = {
        x: start.x + ((destination.x - start.x) * index) / steps,
        z: start.z + ((destination.z - start.z) * index) / steps,
      };
      position = this._slideMove(position, target, inArena);
    }
    return position;
  }

  private _canOccupy(position: FloorPoint, inArena: boolean): boolean {
    const layout = this._layout;
    if (!layout) return false;
    if (
      position.x < layout.bounds.minX + PLAYER_RADIUS ||
      position.x > layout.bounds.maxX - PLAYER_RADIUS ||
      position.z < layout.bounds.minZ + PLAYER_RADIUS ||
      position.z > layout.bounds.maxZ - PLAYER_RADIUS
    )
      return false;
    if (
      inArena &&
      this._combat &&
      !insideEncounterArena(position, this._combat)
    )
      return false;
    return layout.collision.every((shape) => {
      if (shape.kind === "rect") {
        return (
          Math.abs(position.x - shape.center.x) >=
            shape.width / 2 + PLAYER_RADIUS ||
          Math.abs(position.z - shape.center.z) >=
            shape.depth / 2 + PLAYER_RADIUS
        );
      }
      return (
        distanceBetween(position, shape.center) >= shape.radius + PLAYER_RADIUS
      );
    });
  }

  private _maybeEnterEncounter(): void {
    const layout = this._layout;
    if (
      !layout ||
      this._combat ||
      !insideAuthoredArena(this._playerPosition, layout)
    )
      return;
    const level = authoredLevel(layout);
    const answer = this._dreamweaverAnswers[layout.floor] ?? null;
    const weaponEnabled = answer
      ? authoredChoice(level, answer).effects.some(
          (effect) =>
            effect.path === "gameplay.weapon.enabled" && effect.value === true
        )
      : false;
    const plan = authoredStateValue(level, "combat.outcome");
    this._combat = createCombatEncounter(layout.encounter, this._playerPosition, {
      hitDamage: weaponEnabled ? 2 : plan === "nearly-impossible" ? 0.25 : 1,
    });
    this._playerPosition = point(this._combat.player.position);
    this._syncTelegraphSockets();
  }

  private _applyCombatState(next: CombatEncounterState): void {
    this._combat = next;
    this._playerPosition = point(next.player.position);
    for (const event of next.events) this._handleCombatEvent(event);
    this._syncTelegraphSockets();
  }

  private _handleCombatEvent(event: CombatEvent): void {
    if (!this._layout) return;
    if (event.type === "telegraph-started") {
      this._activateMatchingCues("enemy-telegraph", { enemyId: event.enemyId });
    } else if (event.type === "resolved") {
      this._activateMatchingCues("encounter-resolved", {
        outcome: event.outcome,
      });
      const resolution = this._combat?.resolution;
      if (
        resolution &&
        !this._recordedEncounters.has(resolution.echo.encounterId)
      ) {
        this._recordedEncounters.add(resolution.echo.encounterId);
        this._encounterEchoes.push(resolution.echo);
      }
    }
  }

  private _updateLandmarksAndExit(): void {
    const layout = this._layout;
    if (!layout) return;
    const position = this.playerPosition;
    for (const landmark of layout.landmarks) {
      const inside =
        distanceBetween(position, landmark.position) <= landmark.reach;
      const wasInside = this._insideLandmarks.has(landmark.id);
      if (inside && !wasInside) {
        this._insideLandmarks.add(landmark.id);
        this._activateMatchingCues("enter-zone", { landmarkId: landmark.id });
      } else if (!inside && wasInside) {
        this._insideLandmarks.delete(landmark.id);
      }
      if (inside && !this._discoveredLandmarks.has(landmark.id)) {
        this._discoveredLandmarks.add(landmark.id);
        this._activateMatchingCues("discover-landmark", {
          landmarkId: landmark.id,
        });
      }
      const hasDreamweaverAnswer = Boolean(
        this._dreamweaverAnswers[layout.floor]
      );
      if (
        landmark.role === "exit" &&
        this._combat?.resolution &&
        hasDreamweaverAnswer &&
        inside
      ) {
        if (!wasInside)
          this._activateMatchingCues("reach-exit", { landmarkId: landmark.id });
        if (
          !this._exitCrossed &&
          distanceBetween(position, landmark.position) <= EXIT_CROSS_RADIUS
        ) {
          this._exitCrossed = true;
          this._transitionSignal = (layout.floor + 1) as MiddleFloorTransition;
        }
      }
    }
  }

  private _activateMatchingCues(
    trigger: FloorEffectCue["trigger"],
    match: {
      readonly landmarkId?: string;
      readonly enemyId?: string;
      readonly outcome?: CombatOutcome;
    }
  ): void {
    for (const cue of this._layout?.effects ?? []) {
      if (cue.trigger !== trigger) continue;
      if (cue.encounterId && cue.encounterId !== this._layout?.encounter.id)
        continue;
      if (cue.landmarkId && cue.landmarkId !== match.landmarkId) continue;
      if (cue.enemyId && cue.enemyId !== match.enemyId) continue;
      this._activateCue(cue, match.outcome);
    }
  }

  private _activateCue(cue: FloorEffectCue, outcome?: CombatOutcome): void {
    const readyAt = this._cueReadyAt.get(cue.id) ?? 0;
    if (this._clockMs < readyAt) return;
    const root = this.group.getObjectByName(`effect:${cue.id}`);
    if (!root) return;
    root.visible = true;
    root.scale.setScalar(outcome === "fallen" ? 0.86 : 1);
    root.userData.outcome = outcome ?? null;
    this._activeEffects.set(cue.id, {
      root,
      remainingMs: Math.max(100, cue.visual.durationMs),
    });
    this._cueReadyAt.set(
      cue.id,
      this._clockMs + Math.max(250, cue.visual.durationMs)
    );
    this._playAudio(cue);
  }

  private _updateEffectTimers(deltaMs: number): void {
    for (const [id, active] of this._activeEffects) {
      active.remainingMs -= deltaMs;
      if (active.remainingMs <= 0) {
        active.root.visible = false;
        active.root.scale.setScalar(1);
        this._activeEffects.delete(id);
      }
    }
  }

  private _syncTelegraphSockets(): void {
    const layout = this._layout;
    const art = this._art;
    const combat = this._combat;
    if (!layout || !art || !combat) return;
    for (const enemy of combat.enemies) {
      const telegraph = combat.phase === "active" ? enemy.telegraph : null;
      const targetSocket = this.group.getObjectByName(
        `telegraph-target:${enemy.id}`
      );
      if (telegraph) {
        art.aimTelegraph(enemy.id, telegraph.target);
        if (targetSocket) targetSocket.visible = true;
      } else if (targetSocket) {
        targetSocket.visible = false;
      }
      const fallback = this._fallbackTelegraphs.get(enemy.id);
      if (fallback) {
        fallback.root.visible = Boolean(telegraph);
        if (telegraph) this._aimFallback(fallback, enemy.position, telegraph);
      }
      const enemyArt = this.group.getObjectByName(`enemy-art:${enemy.id}`);
      if (enemyArt) enemyArt.visible = enemy.health > 0;
    }
  }

  private _createFallbackTelegraphs(): void {
    const layout = this._layout;
    if (!layout) return;
    const warning = new THREE.MeshBasicMaterial({
      color: FALLBACK_TELEGRAPH_COLOR,
      transparent: true,
      opacity: 0.58,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    for (const enemy of layout.encounter.enemies) {
      const hasAuthoredAimer = layout.effects.some(
        (cue) => cue.trigger === "enemy-telegraph" && cue.enemyId === enemy.id
      );
      if (hasAuthoredAimer) continue;
      const root = new THREE.Group();
      root.name = `telegraph-fallback:${enemy.id}`;
      root.position.set(enemy.spawn.x, 0, enemy.spawn.z);
      root.visible = false;
      let marker: THREE.Object3D;
      let shape: FallbackTelegraph["shape"];
      if (enemy.role === "ranged") {
        const target = new THREE.Group();
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.72, 0.96, 4),
          warning
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.045;
        target.add(ring);
        const tile = new THREE.Mesh(new THREE.CircleGeometry(0.62, 4), warning);
        tile.rotation.x = -Math.PI / 2;
        tile.position.y = 0.035;
        target.add(tile);
        this.group.add(root);
        root.add(target);
        marker = target;
        shape = "aimed-tile";
      } else if (enemy.role === "flanker") {
        const arc = new THREE.Mesh(
          new THREE.TorusGeometry(1.75, 0.055, 4, 12),
          warning
        );
        arc.rotation.x = Math.PI / 2;
        arc.position.y = 0.05;
        root.add(arc);
        this.group.add(root);
        marker = arc;
        shape = "sweep-arc";
      } else {
        const length = Math.min(enemy.attackRange + 1.5, 4.5);
        const lane = new THREE.Mesh(
          new THREE.PlaneGeometry(1.1, length),
          warning
        );
        lane.rotation.x = -Math.PI / 2;
        lane.position.set(0, 0.03, -length / 2);
        root.add(lane);
        const markerArrow = new THREE.Mesh(
          new THREE.ConeGeometry(0.26, 0.5, 3),
          warning
        );
        markerArrow.rotation.x = Math.PI / 2;
        markerArrow.position.set(0, 0.06, -length * 0.78);
        root.add(markerArrow);
        this.group.add(root);
        marker = lane;
        shape = "charge-lane";
      }
      this._fallbackTelegraphs.set(enemy.id, { root, marker, shape });
    }
  }

  private _aimFallback(
    fallback: FallbackTelegraph,
    origin: FloorPoint,
    telegraph: CombatTelegraph
  ): void {
    if (fallback.shape === "aimed-tile") {
      fallback.root.position.set(telegraph.target.x, 0, telegraph.target.z);
      return;
    }
    if (fallback.shape === "charge-lane") {
      const dx = telegraph.target.x - origin.x;
      const dz = telegraph.target.z - origin.z;
      if (Math.hypot(dx, dz) > 0.001)
        fallback.root.rotation.y = Math.atan2(-dx, -dz);
    }
  }

  private _playAudio(cue: FloorEffectCue): void {
    const context = this._audioContext;
    if (!context || context.state !== "running") return;
    const gainValue = Math.max(0.001, Math.min(0.3, cue.audio.gain));
    const duration = Math.max(0.04, cue.audio.durationMs / 1000);
    for (const [index, delayMs] of cue.audio.rhythmMs.entries()) {
      const startAt = context.currentTime + Math.max(0, delayMs) / 1000;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = cue.audio.waveform;
      oscillator.frequency.setValueAtTime(
        cue.audio.frequencyHz * (index % 2 === 0 ? 1 : 1.12),
        startAt
      );
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.linearRampToValueAtTime(gainValue, startAt + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.onended = (): void => {
        oscillator.disconnect();
        gain.disconnect();
      };
      oscillator.start(startAt);
      oscillator.stop(startAt + duration + 0.01);
    }
  }

  private _clearFloorContent(): void {
    if (this._art) {
      this.group.remove(this._art.root);
      this._art.dispose();
      this._art = null;
    }
    const disposedMaterials = new Set<THREE.Material>();
    for (const fallback of this._fallbackTelegraphs.values()) {
      fallback.root.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((material) => disposedMaterials.add(material));
        } else if (mesh.material) {
          disposedMaterials.add(mesh.material);
        }
      });
      this.group.remove(fallback.root);
    }
    for (const material of disposedMaterials) material.dispose();
    this._fallbackTelegraphs.clear();
    this._activeEffects.clear();
  }
}

function createLayout(
  floor: MiddleFloorNumber,
  seed: number
): MiddleFloorLayout {
  if (floor === 4) return createMiddleFloor4(seed);
  if (floor === 5) return createMiddleFloor5(seed);
  return createMiddleFloor6(seed);
}

function point(value: FloorPoint): FloorPoint {
  return { x: value.x, z: value.z };
}

function normalize(value: MiddleFloorMovement): MiddleFloorMovement {
  if (![value.x, value.z].every(Number.isFinite)) return { x: 0, z: 0 };
  const length = Math.hypot(value.x, value.z);
  return length > 0
    ? { x: value.x / length, z: value.z / length }
    : { x: 0, z: 0 };
}

function distanceBetween(left: FloorPoint, right: FloorPoint): number {
  return Math.hypot(left.x - right.x, left.z - right.z);
}

function insideEncounterArena(
  position: FloorPoint,
  combat: CombatEncounterState
): boolean {
  const { center, width, depth } = combat.arena;
  return (
    position.x >= center.x - width / 2 + PLAYER_RADIUS &&
    position.x <= center.x + width / 2 - PLAYER_RADIUS &&
    position.z >= center.z - depth / 2 + PLAYER_RADIUS &&
    position.z <= center.z + depth / 2 - PLAYER_RADIUS
  );
}

function insideAuthoredArena(
  position: FloorPoint,
  layout: MiddleFloorLayout
): boolean {
  const { center, width, depth } = layout.encounter.arena;
  return (
    position.x >= center.x - width / 2 + PLAYER_RADIUS &&
    position.x <= center.x + width / 2 - PLAYER_RADIUS &&
    position.z >= center.z - depth / 2 + PLAYER_RADIUS &&
    position.z <= center.z + depth / 2 - PLAYER_RADIUS
  );
}
