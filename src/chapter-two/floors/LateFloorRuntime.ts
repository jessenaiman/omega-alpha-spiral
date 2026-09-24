import * as THREE from "three";
import { LateFloorState, type LateFloorAxes, type LateFloorId, type LateFloorInteraction, type LateFloorStatus, type CollectorSnapshot } from "./LateFloorState";
import { createFloor7TownArt, createFloor8FinaleArt } from "./LateFloorArtKit";
import { createTownStreetscape } from "./TownStreetscape";
import { FLOOR_7_TOWN } from "./late-floor-7-town";
import { FLOOR_8_FINALE } from "./late-floor-8-finale";
import type { Guide } from "../rooms";

export interface LateFloorRuntimeStatus {
  readonly floor: LateFloorId;
  readonly phase: LateFloorStatus;
  readonly objective: string;
  readonly partySize: number;
  readonly gatheredDreamweavers: readonly Guide[];
  readonly selectedRoute: string | null;
  readonly collectorPressure: number;
  readonly memoryRecycles: number;
  readonly collectors: readonly CollectorSnapshot[];
}

export type LateFloorRecruitChoices = Readonly<Partial<Record<4 | 5 | 6, Guide>>>;

/** Owns the two late-floor art groups, local effects, WebAudio cues, and LateFloorState adapter. */
export class LateFloorRuntime {
  public readonly group = new THREE.Group();
  private readonly _state = new LateFloorState();
  private readonly _townArt = createFloor7TownArt(FLOOR_7_TOWN);
  private readonly _townStreetscape = createTownStreetscape(FLOOR_7_TOWN);
  private readonly _finaleArt = createFloor8FinaleArt(FLOOR_8_FINALE);
  private readonly _townGroup = new THREE.Group();
  private readonly _finaleGroup = new THREE.Group();
  private readonly _partyGroup = new THREE.Group();
  private readonly _partyFollowers: readonly PartyFollower[];
  private readonly _finalePath = createFinaleApproachPath();
  private readonly _audio = new LocalCueAudio();
  private readonly _lastCollectorPhases = new Map<string, CollectorSnapshot["phase"]>();
  private readonly _floaterBase: THREE.Vector3;
  private _elapsed = 0;
  private _recycleTimer = 0;
  private _seenRecycleCount = 0;
  private _previousPhase: LateFloorStatus = "exploring";
  private readonly _lastPlayerPosition = new THREE.Vector3();
  private readonly _trailDirection = new THREE.Vector2(0, -1);
  private _followerPhase = 0;
  private _disposed = false;

  public constructor(recruitChoices: LateFloorRecruitChoices = {}) {
    this.group.name = "late-floor-runtime";
    this._townGroup.name = "floor-7-town-runtime";
    this._finaleGroup.name = "floor-8-finale-runtime";
    this._townGroup.add(this._townStreetscape.group, this._townArt.group);
    this._finalePath.name = "floor-8-visible-approach-path";
    this._finaleGroup.add(this._finalePath, this._finaleArt.group);
    this._partyGroup.name = "four-hero-party-followers";
    this._partyFollowers = createPartyFollowers(recruitChoices);
    for (const follower of this._partyFollowers) this._partyGroup.add(follower.root);
    this.group.add(this._partyGroup);
    this.group.add(this._townGroup, this._finaleGroup);
    this._lastPlayerPosition.set(this._state.player.x, 0, this._state.player.z);
    this._floaterBase = this._townArt.group.getObjectByName("floating-sign")?.position.clone() ?? new THREE.Vector3(5, 0, -3);
    this._setVisibleFloor(7);
  }

  public get playerPosition(): Readonly<{ x: number; z: number }> {
    return { x: this._state.player.x, z: this._state.player.z };
  }

  public get status(): LateFloorRuntimeStatus {
    const phase = this._state.status;
    const objective = this._state.floor === 7
      ? phase === "route-selected"
        ? `Reach the ${this._state.selectedRoute} exit`
        : phase === "ready-to-choose"
          ? "Choose an escape idea at the plaza"
          : "Find all three Dreamweavers"
      : phase === "complete"
        ? "Finale complete"
        : "Approach the healing core";
    return {
      floor: this._state.floor,
      phase,
      objective,
      partySize: this._state.partySize,
      gatheredDreamweavers: this._state.gatheredDreamweavers,
      selectedRoute: this._state.selectedRoute,
      collectorPressure: this._state.collectorPressure,
      memoryRecycles: this._state.memoryRecycles,
      collectors: this._state.collectors,
    };
  }

  /** Begin a floor only when it differs from the state floor; transitions remain progress-preserving. */
  public enterFloor(floor: 7 | 8): void {
    if (this._disposed) return;
    if (this._state.floor !== floor) {
      this._state.start(floor);
      this._seenRecycleCount = this._state.memoryRecycles;
      this._recycleTimer = 0;
      this._previousPhase = this._state.status;
      this._lastCollectorPhases.clear();
    }
    this._setVisibleFloor(floor);
  }

  /** Advance movement/state plus local Three.js effects. reducedMotion freezes decorative pulses and flicker. */
  public update(deltaSeconds: number, axes: LateFloorAxes, reducedMotion = false): void {
    if (this._disposed || !Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return;
    const dt = Math.min(deltaSeconds, 0.1);
    this._elapsed += dt;
    this._state.update(deltaSeconds, axes);
    this._setVisibleFloor(this._state.floor);
    this._updatePartyFollowers(dt, reducedMotion);

    if (this._state.memoryRecycles !== this._seenRecycleCount) {
      this._seenRecycleCount = this._state.memoryRecycles;
      this._recycleTimer = FLOOR_7_TOWN.effects.find((effect) => effect.cue === "memory-recycle")?.durationSeconds ?? 1.1;
      this._audio.cue(310, 0.12, 0.018);
    }
    this._recycleTimer = Math.max(0, this._recycleTimer - dt);
    this._animateTown(dt, reducedMotion);
    this._animateFinale(reducedMotion);
    this._playCollectorPhaseCues();

    if (this._state.status === "complete" && this._previousPhase !== "complete") this._audio.cue(523.25, 0.42, 0.025);
    this._previousPhase = this._state.status;
  }

  /** Interactions count as a user gesture and unlock local synthesized cues. */
  public interact(targetId?: LateFloorInteraction): boolean {
    if (this._disposed) return false;
    const changed = this._state.interact(targetId);
    if (changed) {
      this._audio.unlockFromGesture();
      this._audio.cue(targetId?.startsWith("dw-") ? 660 : 440, 0.09, 0.018);
    }
    return changed;
  }

  /** Hit a nearby garbage collector; two hits create a short safe window. */
  public hit(): boolean {
    if (this._disposed) return false;
    this._audio.unlockFromGesture();
    const changed = this._state.hit();
    if (changed) {
      const stunned = this._state.collectors.some((collector) => collector.phase === "stunned");
      this._audio.cue(stunned ? 125 : 190, stunned ? 0.18 : 0.1, 0.03);
    }
    return changed;
  }

  public consumeTransitionSignal(): 8 | "complete" | null {
    return this._state.consumeTransitionSignal();
  }

  public dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    this._townArt.dispose();
    this._townStreetscape.dispose();
    this._finaleArt.dispose();
    this._finalePath.geometry.dispose();
    disposeMaterial(this._finalePath.material);
    for (const follower of this._partyFollowers) {
      for (const geometry of follower.geometries) geometry.dispose();
      for (const material of follower.materials) material.dispose();
    }
    this._audio.dispose();
    this.group.clear();
  }

  private _setVisibleFloor(floor: LateFloorId): void {
    this._townGroup.visible = floor === 7;
    this._finaleGroup.visible = floor === 8;
    this._partyGroup.visible = true;
  }

  private _updatePartyFollowers(dt: number, reducedMotion: boolean): void {
    const playerX = this._state.player.x;
    const playerZ = this._state.player.z;
    const dx = playerX - this._lastPlayerPosition.x;
    const dz = playerZ - this._lastPlayerPosition.z;
    if (dx * dx + dz * dz > 0.000004) {
      const magnitude = Math.hypot(dx, dz);
      this._trailDirection.set(dx / magnitude, dz / magnitude);
    }
    this._lastPlayerPosition.set(playerX, 0, playerZ);
    this._followerPhase += reducedMotion ? 0 : dt;

    const backX = -this._trailDirection.x;
    const backZ = -this._trailDirection.y;
    const sideX = -backZ;
    const sideZ = backX;
    const offsets = [
      { back: 1.45, side: 0 },
      { back: 2.65, side: -0.95 },
      { back: 2.65, side: 0.95 },
    ];
    this._partyFollowers.forEach((follower, index) => {
      const offset = offsets[index];
      follower.root.position.set(
        playerX + backX * offset.back + sideX * offset.side,
        reducedMotion ? 0 : Math.sin(this._followerPhase * 3.1 + index * 1.7) * 0.035,
        playerZ + backZ * offset.back + sideZ * offset.side,
      );
      follower.root.rotation.y = Math.atan2(this._trailDirection.x, this._trailDirection.y);
    });
  }

  private _animateTown(dt: number, reducedMotion: boolean): void {
    if (this._state.floor !== 7) return;
    const sign = this._townArt.group.getObjectByName("floating-sign");
    if (sign) {
      sign.position.y = this._floaterBase.y + (reducedMotion ? 0 : Math.sin(this._elapsed * 1.1) * 0.11);
      sign.rotation.y = reducedMotion ? 0 : Math.sin(this._elapsed * 0.7) * 0.035;
    }

    const terminalScreen = this._townArt.group.getObjectByName("local-terminal")?.getObjectByName("terminal-screen");
    if (terminalScreen) {
      const activeRestart = this._recycleTimer > 0;
      const blink = activeRestart && !reducedMotion ? 0.65 + 0.35 * Math.sin(this._elapsed * 26) : 1;
      terminalScreen.scale.y = blink;
      setEmissive(terminalScreen, activeRestart ? (reducedMotion ? 0.18 : 0.15 + blink * 0.5) : 0.05);
    }

    const memory = this._townArt.group.getObjectByName("memory-well");
    if (memory) {
      const fragments = memory.children.filter((child) => child.name === "memory-fragment");
      fragments.forEach((fragment, index) => {
        if (this._recycleTimer <= 0) { fragment.visible = true; return; }
        const progress = 1 - this._recycleTimer / (FLOOR_7_TOWN.effects.find((effect) => effect.cue === "memory-recycle")?.durationSeconds ?? 1.1);
        const dissolveIndex = Math.floor(progress * (fragments.length + 1));
        fragment.visible = reducedMotion ? true : index >= dissolveIndex;
        if (!reducedMotion && fragment.visible) fragment.rotation.y += dt * (index % 2 ? 1 : -1);
      });
    }

    for (const collector of this._state.collectors) {
      const actor = this._townArt.group.getObjectByName(collector.id);
      if (!actor) continue;
      actor.position.set(collector.position.x, 0, collector.position.z);
      actor.rotation.y = collector.phase === "stunned" || reducedMotion ? 0 : this._elapsed * 0.7;
      actor.rotation.z = collector.phase === "stunned" ? 0.08 : 0;
      const fan = actor.getObjectByName("forward-scan-fan") ?? actor.getObjectByName("cyan-leading-ring");
      if (fan) fan.visible = collector.phase === "telegraphing" || collector.phase === "sweeping";
      if (collector.phase === "stunned") actor.scale.setScalar(0.88);
      else actor.scale.setScalar(1);
    }
  }

  private _animateFinale(reducedMotion: boolean): void {
    if (this._state.floor !== 8) return;
    const threshold = this._finaleArt.group.getObjectByName("final-threshold");
    const convergence = Math.max(0, Math.min(1, (20 - this._state.player.z) / 3));
    const arch = threshold?.getObjectByName("threshold-light-arch");
    if (arch) {
      const pulse = reducedMotion ? 1 : 1 + Math.sin(this._elapsed * 2.4) * 0.035 * convergence;
      arch.scale.setScalar(pulse);
      setEmissive(arch, 0.12 + convergence * (reducedMotion ? 0.32 : 0.25 + Math.sin(this._elapsed * 2.4) * 0.12));
    }

    const coreGroup = this._finaleArt.group.getObjectByName("core-lightwell");
    const core = coreGroup?.getObjectByName("healing-core-crystal");
    const ring = coreGroup?.getObjectByName("core-lightwell-ring");
    const distanceToCore = Math.hypot(this._state.player.x, this._state.player.z + 15);
    const proximity = Math.max(0, Math.min(1, (9 - distanceToCore) / 7));
    const pulse = reducedMotion ? 1 : 1 + Math.sin(this._elapsed * 2.8) * 0.07 * proximity;
    if (core) {
      core.scale.setScalar(pulse);
      if (!reducedMotion) core.rotation.y += 0.004 + proximity * 0.012;
      setEmissive(core, 0.45 + proximity * (reducedMotion ? 0.3 : 0.35 + Math.sin(this._elapsed * 2.8) * 0.2));
    }
    if (ring) ring.scale.setScalar(pulse);
  }

  private _playCollectorPhaseCues(): void {
    for (const collector of this._state.collectors) {
      const last = this._lastCollectorPhases.get(collector.id);
      if (collector.phase === "sweeping" && last !== "sweeping") this._audio.cue(92, 0.1, 0.012);
      this._lastCollectorPhases.set(collector.id, collector.phase);
    }
  }
}

interface PartyFollower {
  readonly root: THREE.Group;
  readonly geometries: readonly THREE.BufferGeometry[];
  readonly materials: readonly THREE.Material[];
}

/** Decorative echoes of the four-hero party; these are separate from the town's three Dreamweavers. */
function createPartyFollowers(recruitChoices: LateFloorRecruitChoices): readonly PartyFollower[] {
  const defaultPalette = [0xd9bd72, 0x7c82dc, 0x73c6b4];
  const alignmentPalette: Record<Guide, number> = {
    Light: 0xd9bd72,
    Shadow: 0x7c82dc,
    Ambition: 0xe28754,
  };
  const forms: Array<"scout" | "scribe" | "vanguard"> = ["scout", "scribe", "vanguard"];
  return forms.map((form, index) => {
    const floor = (index + 4) as 4 | 5 | 6;
    const guide = recruitChoices[floor];
    const accentColor = guide
      ? alignmentPalette[guide]
      : defaultPalette[index];
    const accent = new THREE.MeshStandardMaterial({ color: accentColor, emissive: accentColor, emissiveIntensity: 0.12, roughness: 0.62 });
    const body = new THREE.MeshStandardMaterial({ color: 0x30364d, roughness: 0.78 });
    const light = new THREE.MeshStandardMaterial({ color: 0xd7d9dc, roughness: 0.68 });
    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [accent, body, light];
    const root = new THREE.Group();
    root.name = `party-echo-0${index + 1}`;

    const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material, name: string, y: number): THREE.Mesh => {
      geometries.push(geometry);
      const item = new THREE.Mesh(geometry, material);
      item.name = name;
      item.position.y = y;
      item.castShadow = true;
      item.receiveShadow = true;
      root.add(item);
      return item;
    };
    const capsule = (radius: number, length: number, material: THREE.Material, name: string, y: number): THREE.Mesh =>
      mesh(new THREE.CapsuleGeometry(radius, length, 3, 6), material, name, y);

    capsule(form === "vanguard" ? 0.34 : 0.27, form === "scout" ? 0.53 : 0.66, body, "silhouette-torso", 0.66);
    const head = capsule(0.2, 0.04, light, "silhouette-head", 1.27);
    head.scale.set(0.88, 0.88, 0.82);
    if (form === "scout") {
      const hood = mesh(new THREE.ConeGeometry(0.32, 0.52, 5), accent, "scout-hood", 1.25);
      hood.rotation.x = Math.PI;
      const cloak = mesh(new THREE.ConeGeometry(0.45, 0.82, 5, 1, true), body, "scout-cloak", 0.56);
      cloak.rotation.x = Math.PI;
    } else if (form === "scribe") {
      const halo = mesh(new THREE.TorusGeometry(0.31, 0.045, 5, 12), accent, "scribe-halo", 1.5);
      halo.rotation.x = Math.PI / 2;
      const sash = capsule(0.075, 0.72, accent, "scribe-sash", 0.69);
      sash.rotation.z = Math.PI / 3.4;
    } else {
      const mantle = capsule(0.42, 0.2, accent, "vanguard-mantle", 1.02);
      mantle.scale.set(1.45, 0.52, 0.74);
      const plume = mesh(new THREE.ConeGeometry(0.13, 0.55, 5), accent, "vanguard-plume", 1.57);
      plume.rotation.z = -0.25;
    }
    const feet = mesh(new THREE.TorusGeometry(0.29, 0.025, 4, 14), accent, "grounding-ring", 0.08);
    feet.rotation.x = Math.PI / 2;
    root.scale.setScalar(0.68);
    return { root, geometries, materials };
  });
}

/** Route floor is authored from the finale route bounds, below all landmarks and outside collision logic. */
function createFinaleApproachPath(): THREE.Mesh {
  const route = FLOOR_8_FINALE.route;
  const length = Math.abs(route.to.z - route.from.z) + 4;
  const centerZ = (route.to.z + route.from.z) / 2;
  const geometry = new THREE.PlaneGeometry(route.width, length, 1, Math.max(8, Math.ceil(length / 4)));
  const material = new THREE.MeshStandardMaterial({ color: 0x273047, roughness: 0.94, metalness: 0.04 });
  const path = new THREE.Mesh(geometry, material);
  path.rotation.x = -Math.PI / 2;
  path.position.set((route.from.x + route.to.x) / 2, -0.12, centerZ);
  path.receiveShadow = true;
  return path;
}

function disposeMaterial(material: THREE.Material | THREE.Material[]): void {
  for (const item of Array.isArray(material) ? material : [material]) item.dispose();
}

class LocalCueAudio {
  private _context: AudioContext | null = null;

  public unlockFromGesture(): void {
    if (typeof window === "undefined" || typeof window.AudioContext === "undefined") return;
    if (!this._context) this._context = new window.AudioContext();
    if (this._context.state !== "running") void this._context.resume();
  }

  public cue(frequency: number, duration: number, volume: number): void {
    const context = this._context;
    if (!context || context.state === "closed") return;
    const play = (): void => {
      if (context.state !== "running") return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, volume), now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.015);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    };
    if (context.state === "running") play();
    else void context.resume().then(play).catch(() => undefined);
  }

  public dispose(): void {
    if (this._context && this._context.state !== "closed") void this._context.close();
    this._context = null;
  }
}

function setEmissive(object: THREE.Object3D, intensity: number): void {
  if (!(object instanceof THREE.Mesh)) return;
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  for (const material of materials) {
    const standard = material as THREE.MeshStandardMaterial;
    if ("emissiveIntensity" in standard) standard.emissiveIntensity = intensity;
  }
}
