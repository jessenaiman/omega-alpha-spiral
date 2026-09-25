import {
  AmbientLight,
  Box3,
  BoxGeometry,
  CanvasTexture,
  Color,
  DirectionalLight,
  Fog,
  Group,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  Scene,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { WalkField } from "./WalkField";
import {
  MiddleFloorRuntime,
  type RecruitGuide,
} from "./floors/MiddleFloorRuntime";
import { LateFloorRuntime } from "./floors/LateFloorRuntime";
import { FLOOR_7_TOWN } from "./floors/late-floor-7-town";
import { FLOOR_8_FINALE } from "./floors/late-floor-8-finale";
import { ECHO_ROOMS } from "./rooms";
import { createRng } from "../core/random";
import "./styles.css";

const FIELD_SIZE: number = 48;
const PALETTE: number[] = [0x071426, 0x161427, 0x20182b];

/** Playable chamber; asset loading never blocks movement. */
export class ChapterTwoScene {
  public active: boolean = false;
  private _world: WalkField = new WalkField();
  private _scene: Scene = new Scene();
  private _camera: OrthographicCamera = new OrthographicCamera(
    -20,
    20,
    12,
    -12,
    0.1,
    120
  );
  private _hero: Group = new Group();
  private _heroBody: Mesh<BoxGeometry, MeshStandardMaterial> | null = null;
  private _heroColor: number = 0xcbd7df;
  private _monster: Group = new Group();
  private _door: Group = new Group();
  private _chest: Group = new Group();
  private _roomKit: Group = new Group();
  private _middle: MiddleFloorRuntime | null = null;
  private _late: LateFloorRuntime | null = null;
  private _floorMesh: Mesh | null = null;
  private _handoffDelay: number = -1;
  private _marker: Mesh<BoxGeometry, MeshStandardMaterial> = new Mesh(
    new BoxGeometry(2.9, 0.06, 2.9),
    new MeshStandardMaterial({ color: 0xe8d393, emissive: 0x493512 })
  );
  private _keys: Set<string> = new Set();
  private _abort: AbortController = new AbortController();
  private _hud: HTMLElement | null = null;
  private _root: HTMLElement | null = null;
  private _paused: boolean = false;
  private _lastUi: string = "";
  private _effectClock: number = 0;
  private _fallenFlash: number = 0;
  private _lastEarlyPhase: string = "exploring";
  private _questionLabel: Sprite | null = null;
  private _textures: CanvasTexture[] = [];
  private _target: Vector3 = new Vector3();
  private _labelPosition: Vector3 = new Vector3();
  private _floorMaterial: MeshStandardMaterial = new MeshStandardMaterial({
    color: PALETTE[0],
    roughness: 1,
  });
  private _thresholdPreview: WebGLRenderTarget | null = null;
  private _destroyed: boolean = false;
  private _variationSeed: number = 0;

  public init(root: HTMLElement, debug: boolean): void {
    this._root = root;
    this._scene.background = new Color(0x070e19);
    this._scene.add(new AmbientLight(0xaac9ec, 0.85));
    const light: DirectionalLight = new DirectionalLight(0xffe4b9, 1.6);
    light.position.set(-8, 18, 10);
    this._scene.add(light);
    const floor: Mesh = new Mesh(
      new BoxGeometry(FIELD_SIZE, 0.3, FIELD_SIZE),
      this._floorMaterial
    );
    floor.position.y = -0.2;
    this._floorMesh = floor;
    this._scene.add(floor);
    this._heroBody = this._box(this._hero, 0, 0.8, 0, 0.7, 1, 0.45, this._heroColor);
    this._box(this._hero, 0, 1.6, 0, 0.5, 0.5, 0.5, 0xebd6b3);
    this._box(this._hero, -0.21, 0.2, 0, 0.24, 0.4, 0.3, 0x6b7c91);
    this._box(this._hero, 0.21, 0.2, 0, 0.24, 0.4, 0.3, 0x6b7c91);
    this._scene.add(this._hero);
    this._hero.position.set(this._world.player.x, 0, this._world.player.z);
    this._door.position.x = -8;
    const doorFallback: Group = new Group();
    this._box(doorFallback, -1, 1.8, 0, 0.45, 3.6, 0.6, 0xa7b8c4);
    this._box(doorFallback, 1, 1.8, 0, 0.45, 3.6, 0.6, 0xa7b8c4);
    this._box(doorFallback, 0, 3.4, 0, 2.5, 0.45, 0.6, 0xa7b8c4);
    this._door.add(doorFallback, this._label("D  DOOR", 0, 4.8, 0, 4));
    this._scene.add(this._door);
    void new GLTFLoader()
      .loadAsync("/assets/intro/intro-door-assemble.glb")
      .then(({ scene: model }): void => {
        if (this._destroyed) return;
        const bounds: Box3 = new Box3().setFromObject(model);
        const size: Vector3 = bounds.getSize(new Vector3());
        const center: Vector3 = bounds.getCenter(new Vector3());
        if (size.y <= 0) return;
        model.scale.setScalar(4.5 / size.y);
        model.position.set(
          -center.x * model.scale.x,
          -bounds.min.y * model.scale.y,
          -center.z * model.scale.z
        );
        this._door.add(model);
        doorFallback.visible = false;
      })
      .catch((error: unknown): void => {
        console.warn("Unable to load Floor 1 door", error);
      });
    this._box(this._monster, 0, 0.8, 0, 1.7, 1.5, 1.2, 0xb06565);
    this._box(this._monster, -0.5, 1.8, 0, 0.3, 0.8, 0.35, 0xd7c4b0);
    this._box(this._monster, 0.5, 1.8, 0, 0.3, 0.8, 0.35, 0xd7c4b0);
    this._monster.add(this._label("M  MONSTER", 0, 4.6, 0, 4));
    this._scene.add(this._monster);
    this._chest.position.x = 8;
    this._box(this._chest, 0, 0.6, 0, 2, 1.2, 1.5, 0x947951);
    this._box(this._chest, 0, 1.3, 0, 2.1, 0.28, 1.6, 0xd4b275);
    this._chest.add(this._label("C  CHEST", 0, 4.6, 0, 4));
    this._scene.add(this._chest, this._marker);
    this._scene.add(this._roomKit);
    this._buildRoomKit(0);
    this._hud = document.createElement("section");
    this._hud.className = "echo-hud";
    this._hud.hidden = true;
    this._hud.setAttribute("aria-label", "Echo chamber gameplay");
    this._hud.innerHTML = `<header><strong id="echo-title"></strong><span>WASD / arrows · E interact · Esc pause · R restart</span><button id="echo-pause" type="button">Pause</button><button id="echo-restart" type="button">Restart journey</button></header><section class="echo-prompt"><p id="echo-copy" aria-live="polite"></p><pre id="echo-script" aria-label="Next floor script" hidden></pre><form id="echo-form" hidden><label for="echo-answer">Your answer</label><input id="echo-answer" name="answer" required maxlength="240" autocomplete="off"><button type="submit">Answer</button></form><button id="echo-interact" type="button">E · Interact</button><button id="echo-next" type="button" hidden>Continue</button><button id="echo-hit" type="button" hidden>Space · Hit</button><button id="echo-run" type="button" hidden>Shift · Run</button><div id="echo-recruits" hidden><span>Choose whose companion recommendation to follow:</span><button type="button" data-recruit="Light">1 · Light</button><button type="button" data-recruit="Shadow">2 · Shadow</button><button type="button" data-recruit="Ambition">3 · Ambition</button></div><div id="echo-routes" hidden><span>Choose an escape idea at the plaza:</span><button type="button" data-route="exit-boulevard">1 · Together</button><button type="button" data-route="exit-alleys">2 · Slip through</button><button type="button" data-route="exit-core">3 · Break the lock</button></div></section>`;
    root.append(this._hud);
    const signal: AbortSignal = this._abort.signal;
    this._element("echo-interact").addEventListener(
      "click",
      (): void => {
        if (!this.active || this._paused) return;
        if (this._late) this._late.interact();
        else if (!this._middle) this._world.interact();
        this._keys.clear();
      },
      { signal }
    );
    this._element("echo-next").addEventListener(
      "click",
      (): void => {
        if (!this.active || this._paused) return;
        this._world.continue();
        this._keys.clear();
      },
      { signal }
    );
    this._element("echo-hit").addEventListener(
      "click",
      (): void => {
        if (!this.active || this._paused) return;
        void this._middle?.unlockAudio();
        this._middle?.hit();
        this._late?.hit();
      },
      { signal }
    );
    this._element("echo-run").addEventListener(
      "click",
      (): void => {
        if (!this.active || this._paused) return;
        void this._middle?.unlockAudio();
        this._middle?.run(this._movementAxes());
      },
      { signal }
    );
    this._element("echo-recruits").addEventListener(
      "click",
      (event: Event): void => {
        if (!this.active || this._paused || !this._middle) return;
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) return;
        const guide = target.dataset.recruit as RecruitGuide | undefined;
        if (guide) this._middle.chooseRecruit(guide);
      },
      { signal }
    );
    this._element("echo-routes").addEventListener(
      "click",
      (event: Event): void => {
        if (!this.active || this._paused || !this._late) return;
        const target = event.target;
        if (!(target instanceof HTMLButtonElement)) return;
        const route = target.dataset.route;
        if (
          route === "exit-boulevard" ||
          route === "exit-alleys" ||
          route === "exit-core"
        ) {
          this._late.interact(route);
        }
      },
      { signal }
    );
    this._element("echo-pause").addEventListener(
      "click",
      (): void => {
        this._paused = !this._paused;
        this._keys.clear();
      },
      { signal }
    );
    this._element("echo-restart").addEventListener(
      "click",
      (): void => this.start(this._world.thread),
      { signal }
    );
    this._element("echo-form").addEventListener(
      "submit",
      (event: Event): void => {
        event.preventDefault();
        if (!this.active || this._paused) return;
        const input: HTMLInputElement = this._input();
        if (this._world.answer(input.value)) {
          input.value = "";
          input.blur();
        }
      },
      { signal }
    );
    window.addEventListener("keydown", this._onKey, { signal });
    window.addEventListener(
      "keyup",
      (event: KeyboardEvent): void => {
        this._keys.delete(event.key.toLowerCase());
      },
      { signal }
    );
    window.addEventListener(
      "blur",
      (): void => {
        this._keys.clear();
      },
      { signal }
    );
    document.addEventListener(
      "visibilitychange",
      (): void => {
        this._keys.clear();
      },
      { signal }
    );
    if (debug)
      Object.assign(window, {
        __CHAPTER_TWO_DIAGNOSTICS__: {
          getState: (): object => {
            const middle = this._middle;
            const middleStatus = middle?.status;
            const late = this._late;
            const lateStatus = late?.status;
            return {
              active: this.active,
              phase: this._world.phase,
              roomIndex: this._world.roomIndex,
              scriptRevision: this._world.scriptRevision,
              player: { ...this._world.player },
              framesAdvanced: this._world.framesAdvanced,
              distanceTravelled: this._world.distanceTravelled,
              thread: this._world.thread,
              playerColor: this._heroColor,
              guide: this._world.guide,
              choices: this._world.choices.map((choice) => ({ ...choice })),
              variationSeed: this._variationSeed,
              objects: this._world.activeRoom.objects.map(({ kind, x, z }) => ({
                kind,
                x,
                z,
              })),
              nearest: this._world.nearest?.kind ?? null,
              routes:
                this._world.activeRoom.layout?.routes ??
                this._world.activeRoom.routes ??
                null,
              blocks: this._world.activeRoom.blocks ?? [],
              paused: this._paused,
              journey: middle && middleStatus
                ? {
                    kind: "middle",
                    floor: middleStatus.floor,
                    phase: middleStatus.encounterPhase,
                    player: middleStatus.playerPosition,
                    status: middleStatus,
                    routes: middle.layout?.routes ?? [],
                    landmarks: middle.layout?.landmarks ?? [],
                  }
                : late && lateStatus
                  ? {
                      kind: "late",
                      floor: lateStatus.floor,
                      phase: lateStatus.phase,
                      player: late.playerPosition,
                      status: lateStatus,
                      landmarks:
                        lateStatus.floor === 7
                          ? FLOOR_7_TOWN.landmarks
                          : FLOOR_8_FINALE.landmarks,
                      routes:
                        lateStatus.floor === 7 ? FLOOR_7_TOWN.routes : [],
                    }
                  : {
                      kind: "early",
                      floor: this._world.roomIndex + 1,
                      phase: this._world.phase,
                      player: { ...this._world.player },
                    },
            };
          },
        },
      });
  }

  private _element(id: string): HTMLElement {
    const node: Element | null | undefined = this._hud?.querySelector(`#${id}`);
    if (!(node instanceof HTMLElement))
      throw new Error(`Missing gameplay control: ${id}`);
    return node;
  }
  private _input(): HTMLInputElement {
    const node: HTMLElement = this._element("echo-answer");
    if (!(node instanceof HTMLInputElement))
      throw new Error("Missing answer input");
    return node;
  }

  public start(thread: string, playerColor: number = this._heroColor): void {
    this._heroColor = playerColor;
    this._heroBody?.material.color.setHex(playerColor);
    if (this._middle) {
      this._scene.remove(this._middle.group);
      this._middle.dispose();
      this._middle = null;
    }
    if (this._late) {
      this._scene.remove(this._late.group);
      this._late.dispose();
      this._late = null;
    }
    this._roomKit.visible = true;
    this._door.visible = true;
    this._monster.visible = true;
    this._chest.visible = true;
    if (this._floorMesh) this._floorMesh.visible = true;
    this._scene.background = new Color(0x070e19);
    this._scene.fog = null;
    this._scene.visible = true;
    this._handoffDelay = -1;
    this._variationSeed = this._journeyVariationSeed();
    this._world.start(thread, this._variationSeed);
    this.active = true;
    this._paused = false;
    this._keys.clear();
    this._lastUi = "";
    this._effectClock = 0;
    this._fallenFlash = 0;
    this._lastEarlyPhase = "exploring";
    this._hero.scale.setScalar(1);
    this._input().value = "";
    if (this._hud) this._hud.hidden = false;
    if (this._root) this._root.dataset.chapter = "2";
  }

  private _journeyVariationSeed(): number {
    const requested = new URLSearchParams(globalThis.location.search).get(
      "seed"
    );
    if (requested !== null) {
      const numeric = Number(requested);
      return requested.trim() !== "" && Number.isSafeInteger(numeric)
        ? numeric
        : createRng(requested).int(0x7fffffff);
    }
    try {
      const entropy = new Uint32Array(1);
      globalThis.crypto.getRandomValues(entropy);
      return entropy[0] ?? 0;
    } catch {
      return createRng(`${Date.now()}:${performance.now()}`).int(0x7fffffff);
    }
  }

  public stop(): void {
    this.active = false;
    this._keys.clear();
    if (this._hud) this._hud.hidden = true;
    if (this._root) this._root.dataset.chapter = "1";
  }

  /** A still of the actual first room, seen through the intro's Blender threshold. */
  public renderThresholdPreview(renderer: WebGLRenderer): WebGLRenderTarget {
    if (this._thresholdPreview) return this._thresholdPreview;
    const target = new WebGLRenderTarget(384, 512);
    const camera = new OrthographicCamera(-10.5, 10.5, 14, -14, 0.1, 120);
    camera.position.set(0, 16, 20);
    camera.lookAt(0, 0, 2);
    camera.updateProjectionMatrix();
    const previousTarget = renderer.getRenderTarget();
    const previousMarker = this._marker.visible;
    const labels: Array<{ sprite: Sprite; visible: boolean }> = [];
    this._scene.traverse((object): void => {
      if (object instanceof Sprite) {
        labels.push({ sprite: object, visible: object.visible });
        object.visible = false;
      }
    });
    this._marker.visible = false;
    try {
      renderer.setRenderTarget(target);
      renderer.render(this._scene, camera);
    } finally {
      renderer.setRenderTarget(previousTarget);
      this._marker.visible = previousMarker;
      labels.forEach(({ sprite, visible }): void => {
        sprite.visible = visible;
      });
    }
    this._thresholdPreview = target;
    return target;
  }

  private _onKey = (event: KeyboardEvent): void => {
    if (!this.active || event.ctrlKey || event.metaKey || event.altKey) return;
    const key: string = event.key.toLowerCase();
    // Escape remains global while typing; movement/restart must not eat answers.
    if (key === "escape") {
      event.preventDefault();
      if (!event.repeat) {
        this._paused = !this._paused;
        this._keys.clear();
      }
      return;
    }
    if (event.target instanceof HTMLInputElement) return;
    if (this._late) {
      if ((key === " " || key === "space") && !event.repeat && !this._paused) {
        event.preventDefault();
        this._late.hit();
        return;
      }
      if (key === "e" && !event.repeat && !this._paused) {
        event.preventDefault();
        this._late.interact();
        return;
      }
      if (["1", "2", "3"].includes(key) && !event.repeat && !this._paused) {
        const routes = ["exit-boulevard", "exit-alleys", "exit-core"] as const;
        this._late.interact(routes[Number(key) - 1]);
        return;
      }
    }
    if (this._middle) {
      if (key === " " || key === "space") {
        event.preventDefault();
        if (!event.repeat && !this._paused) {
          void this._middle.unlockAudio();
          this._middle.hit();
        }
        return;
      }
      if (key === "shift") {
        if (!event.repeat && !this._paused) {
          void this._middle.unlockAudio();
          this._middle.run(this._movementAxes());
        }
        return;
      }
      if (["1", "2", "3"].includes(key) && !event.repeat && !this._paused) {
        const guide: RecruitGuide = (["Light", "Shadow", "Ambition"] as const)[
          Number(key) - 1
        ];
        this._middle.chooseRecruit(guide);
        return;
      }
    }
    if (
      [
        "w",
        "a",
        "s",
        "d",
        "arrowup",
        "arrowdown",
        "arrowleft",
        "arrowright",
      ].includes(key)
    ) {
      event.preventDefault();
      this._keys.add(key);
    }
    if (event.repeat) return;
    if (key === "r") this.start(this._world.thread);
    if (key === "e" && !this._paused && this._world.phase === "exploring") {
      event.preventDefault();
      this._world.interact();
      this._keys.clear();
    }
  };

  public update(
    delta: number,
    renderer: WebGLRenderer,
    reduced: boolean
  ): void {
    const axis = (positive: string[], negative: string[]): number =>
      Number(positive.some((key) => this._keys.has(key))) -
      Number(negative.some((key) => this._keys.has(key)));
    if (this._late) {
      this._updateLate(delta, renderer, reduced);
      return;
    }
    if (this._middle) {
      this._updateMiddle(delta, renderer, reduced);
      return;
    }
    if (!this._paused)
      this._world.update(
        delta,
        axis(["d", "arrowright"], ["a", "arrowleft"]),
        axis(["s", "arrowdown"], ["w", "arrowup"])
      );
    if (
      this._lastEarlyPhase === "fighting" &&
      this._world.phase === "result" &&
      this._world.choices[this._world.roomIndex]?.combatOutcome === "fallen"
    ) {
      this._fallenFlash = 0.75;
    }
    this._lastEarlyPhase = this._world.phase;
    const transition = this._world.consumeTransitionSignal();
    if (transition?.complete) this._handoffDelay = 1.6;
    if (this._handoffDelay >= 0 && !this._paused) {
      this._handoffDelay -= Math.max(0, delta);
      if (this._handoffDelay <= 0) {
        this._enterMiddle();
        this._updateMiddle(delta, renderer, reduced);
        return;
      }
    }
    this._fallenFlash = Math.max(0, this._fallenFlash - Math.max(0, delta));
    this._hero.scale.setScalar(
      this._fallenFlash > 0 ? 1 - (0.55 * this._fallenFlash) / 0.75 : 1
    );
    this._hero.position.set(this._world.player.x, 0, this._world.player.z);
    const moving: boolean =
      this._keys.size > 0 &&
      this._world.phase === "exploring" &&
      !this._paused &&
      !reduced;
    this._hero.rotation.z = moving
      ? Math.sin(this._world.distanceTravelled * 4) * 0.055
      : 0;
    this._monster.rotation.z =
      !reduced && this._world.phase === "fighting"
        ? Math.sin(this._world.framesAdvanced * 0.6) * 0.13
        : 0;
    this._marker.visible =
      this._world.phase === "exploring" && this._world.nearest !== null;
    if (this._world.nearest)
      this._marker.position.set(
        this._world.nearest.x,
        0.02,
        this._world.nearest.z
      );
    const aspect: number = innerWidth / innerHeight;
    const halfHeight: number = Math.max(11, 14 / aspect);
    this._camera.left = -halfHeight * aspect;
    this._camera.right = halfHeight * aspect;
    this._camera.top = halfHeight;
    this._camera.bottom = -halfHeight;
    // Keep the controlled character above the bottom prompt instead of letting
    // it disappear under UI when walking toward the near edge of the field.
    this._target.set(this._world.player.x * 0.6, 0, this._world.player.z - 3);
    this._camera.position.set(this._target.x, 23, this._target.z + 23);
    this._camera.lookAt(this._target);
    this._camera.updateProjectionMatrix();
    this._refreshUi();
    this._animateEarlyEffects(delta, reduced);
    // Reveal world labels when they clear the HUD, rather than clipping words
    // across the top of the screen during the initial approach.
    this._camera.updateMatrixWorld();
    const headerBottom: number =
      this._hud?.querySelector("header")?.getBoundingClientRect().bottom ?? 0;
    this._scene.traverse((object): void => {
      if (!(object instanceof Sprite)) return;
      object.getWorldPosition(this._labelPosition).project(this._camera);
      const top: number =
        ((1 - this._labelPosition.y) * innerHeight) / 2 -
        (object.scale.y * innerHeight) / (halfHeight * 4);
      object.visible = top > headerBottom + 8;
    });
    // Cut away from the old floor while its replacement script awaits input.
    this._scene.visible = this._world.phase !== "rewriting";
    renderer.render(this._scene, this._camera);
  }

  private _movementAxes(): { x: number; z: number } {
    const axis = (positive: string[], negative: string[]): number =>
      Number(positive.some((key) => this._keys.has(key))) -
      Number(negative.some((key) => this._keys.has(key)));
    return {
      x: axis(["d", "arrowright"], ["a", "arrowleft"]),
      z: axis(["s", "arrowdown"], ["w", "arrowup"]),
    };
  }

  private _enterMiddle(): void {
    const middle = new MiddleFloorRuntime();
    middle.enterFloor(4);
    this._middle = middle;
    this._scene.add(middle.group);
    this._roomKit.visible = false;
    this._door.visible = false;
    this._monster.visible = false;
    this._chest.visible = false;
    this._marker.visible = false;
    if (this._questionLabel) this._questionLabel.visible = false;
    if (this._floorMesh) this._floorMesh.visible = false;
    this._scene.background = new Color(0x091322);
    this._scene.fog = null;
    this._scene.visible = true;
    this._lastUi = "";
  }

  private _updateMiddle(
    delta: number,
    renderer: WebGLRenderer,
    reduced: boolean
  ): void {
    const middle = this._middle;
    if (!middle) return;
    if (!this._paused) middle.update(delta * 1000, this._movementAxes());
    const next = middle.transitionSignal;
    if (next === 7) {
      middle.consumeTransitionSignal();
      this._enterLate();
      this._updateLate(delta, renderer, reduced);
      return;
    }
    if (next === 5 || next === 6) {
      middle.consumeTransitionSignal();
      middle.enterFloor(next);
      this._scene.fog = next === 6 ? new Fog(0x091322, 42, 78) : null;
      this._lastUi = "";
    }
    const player = middle.playerPosition;
    this._hero.position.set(player.x, 0, player.z);
    this._hero.rotation.z =
      !reduced && !this._paused && this._keys.size > 0
        ? Math.sin(performance.now() * 0.012) * 0.05
        : 0;
    const aspect = innerWidth / innerHeight;
    const halfHeight = Math.max(11, 14 / aspect);
    this._camera.left = -halfHeight * aspect;
    this._camera.right = halfHeight * aspect;
    this._camera.top = halfHeight;
    this._camera.bottom = -halfHeight;
    this._target.set(player.x * 0.6, 0, player.z - 3);
    this._camera.position.set(this._target.x, 23, this._target.z + 23);
    this._camera.lookAt(this._target);
    this._camera.updateProjectionMatrix();
    const status = middle.status;
    if (status) {
      const key = `${status.floor}:${status.encounterPhase}:${status.playerHealth}:${status.nearOffer}:${status.recruitChoice}:${status.objective}:${this._paused}`;
      if (key !== this._lastUi) {
        this._lastUi = key;
        this._element("echo-title").textContent =
          `FLOOR ${status.floor} — ${status.title.toUpperCase()}`;
        this._element("echo-copy").textContent = this._paused
          ? "Paused"
          : `${status.objective}${status.playerHealth === null ? "" : `  HP ${status.playerHealth}/${status.playerMaxHealth}`}`;
        this._element("echo-form").hidden = true;
        this._element("echo-script").hidden = true;
        this._element("echo-next").hidden = true;
        this._element("echo-interact").hidden = true;
        this._element("echo-hit").hidden =
          status.encounterPhase !== "active" || this._paused;
        this._element("echo-run").hidden =
          status.encounterPhase !== "active" || this._paused;
        this._element("echo-recruits").hidden =
          !status.nearOffer || this._paused;
        this._element("echo-pause").textContent = this._paused
          ? "Resume"
          : "Pause";
      }
    }
    renderer.render(this._scene, this._camera);
  }

  private _enterLate(): void {
    const recruitChoices = { ...(this._middle?.recruitChoices ?? {}) };
    if (this._middle) {
      this._scene.remove(this._middle.group);
      this._middle.dispose();
      this._middle = null;
    }
    const late = new LateFloorRuntime(recruitChoices);
    late.enterFloor(7);
    this._late = late;
    this._scene.add(late.group);
    this._roomKit.visible = false;
    this._door.visible = false;
    this._monster.visible = false;
    this._chest.visible = false;
    this._marker.visible = false;
    if (this._questionLabel) this._questionLabel.visible = false;
    if (this._floorMesh) this._floorMesh.visible = false;
    this._scene.background = new Color(0x10202d);
    this._scene.fog = null;
    this._scene.visible = true;
    this._lastUi = "";
  }

  private _updateLate(
    delta: number,
    renderer: WebGLRenderer,
    reduced: boolean
  ): void {
    const late = this._late;
    if (!late) return;
    if (!this._paused) late.update(delta, this._movementAxes(), reduced);
    const transition = late.consumeTransitionSignal();
    if (transition === 8) {
      late.enterFloor(8);
      this._scene.background = new Color(0x0e1728);
      this._lastUi = "";
    }
    const player = late.playerPosition;
    this._hero.position.set(player.x, 0, player.z);
    this._hero.rotation.z =
      !reduced && !this._paused && this._keys.size > 0
        ? Math.sin(performance.now() * 0.012) * 0.05
        : 0;
    const aspect = innerWidth / innerHeight;
    const halfHeight = Math.max(11, 14 / aspect);
    this._camera.left = -halfHeight * aspect;
    this._camera.right = halfHeight * aspect;
    this._camera.top = halfHeight;
    this._camera.bottom = -halfHeight;
    this._target.set(player.x * 0.6, 0, player.z - 3);
    this._camera.position.set(this._target.x, 23, this._target.z + 23);
    this._camera.lookAt(this._target);
    this._camera.updateProjectionMatrix();
    const status = late.status;
    this._element("echo-title").textContent =
      status.floor === 7 ? "FLOOR 7 — RECYCLED TOWN" : "FLOOR 8 — HEALING CORE";
    this._element("echo-copy").textContent = this._paused
      ? "Paused"
      : `${status.objective}. Party ${status.partySize}/4. Dreamweavers ${status.gatheredDreamweavers.length}/3.${status.floor === 7 ? ` Collector pressure ${status.collectorPressure.toFixed(1)}` : ""}`;
    this._element("echo-form").hidden = true;
    this._element("echo-script").hidden = true;
    this._element("echo-next").hidden = true;
    this._element("echo-recruits").hidden = true;
    this._element("echo-run").hidden = true;
    this._element("echo-hit").hidden = status.floor !== 7 || this._paused;
    const nearDreamweaver =
      status.floor === 7 &&
      FLOOR_7_TOWN.landmarks.some(
        (landmark) =>
          landmark.kind === "dreamweaver" &&
          !status.gatheredDreamweavers.some(
            (guide) => landmark.id === `dw-${guide.toLowerCase()}`
          ) &&
          Math.hypot(
            player.x - landmark.position.x,
            player.z - landmark.position.z
          ) <= 3
      );
    this._element("echo-interact").hidden = !nearDreamweaver || this._paused;
    const plaza = FLOOR_7_TOWN.routes[0].from;
    const nearPlaza = Math.hypot(player.x - plaza.x, player.z - plaza.z) <= 4.5;
    this._element("echo-routes").hidden =
      status.phase !== "ready-to-choose" || !nearPlaza || this._paused;
    this._element("echo-pause").textContent = this._paused ? "Resume" : "Pause";
    renderer.render(this._scene, this._camera);
  }

  private _refreshUi(): void {
    const world: WalkField = this._world;
    const key: string = `${world.roomIndex}:${world.phase}:${world.nearest?.kind}:${this._paused}`;
    if (key === this._lastUi) return;
    const roomChanged: boolean =
      this._lastUi.split(":")[0] !== String(world.roomIndex);
    this._lastUi = key;
    this._element("echo-title").textContent =
      `FLOOR ${world.roomIndex + 1} — ${world.activeRoom.owner.toUpperCase()}`;
    this._element("echo-copy").textContent = this._paused
      ? "Paused"
      : world.phase === "rewriting"
        ? "Floor ended. Next script ready."
        : world.phase === "complete"
          ? `${world.guide}: “I’m coming with you. Don’t lose me this time.”`
          : world.phase === "result" && world.selected
            ? world.choices[world.roomIndex]?.combatOutcome === "fallen"
              ? "You fell. The room remembers your choice. Walk through its exit."
              : `${world.selected.text}  Follow this route through its exit.`
            : (world.selected?.text ??
              (world.nearest
                ? `E · ${world.nearest.kind}`
                : "Approach a door, monster, or chest. Choose one path through this room."));
    const script: HTMLElement = this._element("echo-script");
    script.hidden = world.phase !== "rewriting" || this._paused;
    script.textContent = world.phase === "rewriting" ? world.scriptPreview : "";
    this._element("echo-form").hidden =
      world.phase !== "prompt" || this._paused;
    this._element("echo-next").hidden = true;
    this._element("echo-hit").hidden = true;
    this._element("echo-run").hidden = true;
    this._element("echo-recruits").hidden = true;
    this._element("echo-routes").hidden = true;
    this._element("echo-next").textContent =
      world.phase === "rewriting" ? "Reboot into next floor" : "Continue";
    this._element("echo-interact").hidden =
      world.phase !== "exploring" || this._paused || !world.nearest;
    const interact: HTMLElement = this._element("echo-interact");
    if (interact instanceof HTMLButtonElement)
      interact.disabled = !world.nearest;
    this._element("echo-pause").textContent = this._paused ? "Resume" : "Pause";
    if (world.phase === "prompt" && !this._paused) this._input().focus();
    if (roomChanged) {
      this._buildRoomKit(world.roomIndex);
      this._floorMaterial.color.setHex(PALETTE[world.roomIndex] ?? PALETTE[0]);
      const objects = world.activeRoom.objects;
      const door = objects.find((object) => object.kind === "door");
      const monster = objects.find((object) => object.kind === "monster");
      const chest = objects.find((object) => object.kind === "chest");
      if (door) this._door.position.set(door.x, 0, door.z);
      if (monster) this._monster.position.set(monster.x, 0, monster.z);
      if (chest) this._chest.position.set(chest.x, 0, chest.z);
      if (this._questionLabel) {
        this._scene.remove(this._questionLabel);
        const oldTexture = this._questionLabel.material.map;
        oldTexture?.dispose();
        this._textures = this._textures.filter(
          (texture) => texture !== oldTexture
        );
        this._questionLabel.material.dispose();
      }
      this._questionLabel = this._label(
        world.activeRoom.objects[0].text,
        world.activeRoom.objects[0].x,
        5.8,
        world.activeRoom.objects[0].z,
        7
      );
      this._scene.add(this._questionLabel);
    }
  }

  private _buildRoomKit(roomIndex: number): void {
    for (const child of [...this._roomKit.children]) {
      this._roomKit.remove(child);
      child.traverse((object): void => {
        if (!(object instanceof Mesh)) return;
        object.geometry.dispose();
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material])
          material.dispose();
      });
    }
    if (roomIndex > 0) {
      const room = this._world.activeRoom;
      const layout = room.layout;
      if (!layout) return;
      const routeColor = roomIndex === 1 ? 0x477fc4 : 0x9e78d1;
      const blockColor = roomIndex === 1 ? 0x2a4568 : 0x51436d;
      for (const route of Object.values(layout.routes)) {
        for (let index = 1; index < route.length; index++) {
          const from = route[index - 1];
          const to = route[index];
          const dx = to.x - from.x;
          const dz = to.z - from.z;
          const length = Math.hypot(dx, dz);
          const segment = new Mesh(
            new BoxGeometry(0.14, 0.035, length),
            new MeshStandardMaterial({
              color: routeColor,
              emissive: routeColor,
              emissiveIntensity: 0.18,
            })
          );
          segment.position.set((from.x + to.x) / 2, 0.025, (from.z + to.z) / 2);
          segment.rotation.y = Math.atan2(dx, dz);
          segment.userData.effect = "route";
          this._roomKit.add(segment);
        }
      }
      for (const block of room.blocks ?? []) {
        const stack = new Group();
        stack.position.set(block.x, 0, block.z);
        stack.rotation.y = block.rotationRadians ?? 0;
        this._box(
          stack,
          0,
          0.48,
          0,
          block.width,
          0.96,
          block.depth,
          blockColor
        );
        const cap = this._box(
          stack,
          0,
          0.99,
          0,
          block.width,
          0.08,
          block.depth,
          routeColor
        );
        cap.userData.effect = roomIndex === 1 ? "syntax" : "step";
        cap.userData.step = this._roomKit.children.length;
        cap.material.emissive.setHex(routeColor);
        this._roomKit.add(stack);
        if (roomIndex === 1 && this._roomKit.children.length % 2 === 0) {
          const ash = this._box(
            this._roomKit,
            block.x + 0.5,
            1.3,
            block.z,
            0.14,
            0.14,
            0.14,
            0xe0a65f
          );
          ash.userData.effect = "ash";
          ash.userData.baseY = 1.3;
        }
      }
      for (const exit of layout.exits) {
        const pad = this._box(
          this._roomKit,
          exit.position.x,
          0.06,
          exit.position.z,
          2.5,
          0.12,
          2.5,
          0xa27955
        );
        pad.userData.effect = "exit";
        pad.userData.kind = exit.kind;
      }
      return;
    }
    // Three straight Atari-like lanes. The raised bars use the same rectangles as movement collision.
    for (const x of [-8, 0, 8]) {
      this._box(this._roomKit, x, 0.015, 5.5, 4.7, 0.035, 13, 0x153550);
      this._box(this._roomKit, x, 0.045, 5.5, 0.09, 0.07, 13, 0x55a5ce);
      this._box(this._roomKit, x, 0.05, -0.8, 4.8, 0.08, 0.15, 0xe09355);
    }
    for (const block of ECHO_ROOMS[0].blocks ?? []) {
      this._box(
        this._roomKit,
        block.x,
        0.48,
        block.z,
        block.width,
        0.96,
        block.depth,
        0x245879
      );
      this._box(
        this._roomKit,
        block.x,
        0.99,
        block.z,
        block.width,
        0.08,
        block.depth,
        0x5baed4
      );
    }
    for (const object of this._world.activeRoom.objects) {
      const pad = this._box(
        this._roomKit,
        object.x,
        0.035,
        object.z,
        2.5,
        0.07,
        2.5,
        0xb78d55
      );
      pad.userData.effect = "exit";
      pad.userData.kind = object.kind;
      if (object.kind !== "door") {
        this._box(
          this._roomKit,
          object.x - 1.5,
          1.3,
          object.z,
          0.14,
          2.6,
          0.14,
          0x6f8cb1
        );
        this._box(
          this._roomKit,
          object.x + 1.5,
          1.3,
          object.z,
          0.14,
          2.6,
          0.14,
          0x6f8cb1
        );
      }
    }
    this._box(this._roomKit, 0, 0.035, 12, 22, 0.07, 0.12, 0xe09355);
    for (const x of [-16, 16])
      for (const z of [-4, 2, 8, 14]) {
        this._box(this._roomKit, x, 0.4, z, 0.75, 0.8, 0.75, 0x245879);
      }
  }

  private _animateEarlyEffects(delta: number, reduced: boolean): void {
    this._effectClock += Math.min(Math.max(delta, 0), 0.1);
    const room = this._world.roomIndex;
    const selected = this._world.selected?.kind;
    this._roomKit.traverse((object): void => {
      if (
        !(object instanceof Mesh) ||
        !(object.material instanceof MeshStandardMaterial)
      )
        return;
      const effect = object.userData.effect;
      if (!effect) return;
      const phase = this._effectClock;
      if (effect === "route")
        object.material.emissiveIntensity = reduced
          ? 0.16
          : 0.14 + 0.1 * (1 + Math.sin(phase * (room === 1 ? 3 : 2)));
      if (effect === "syntax")
        object.material.emissiveIntensity = reduced
          ? 0.12
          : 0.12 + 0.18 * (1 + Math.sin(phase * 7 + object.position.z));
      if (effect === "step")
        object.material.emissiveIntensity = reduced
          ? 0.16
          : 0.14 +
            0.22 *
              (1 + Math.sin(phase * 5 - Number(object.userData.step) * 0.4));
      if (effect === "ash")
        object.position.y =
          Number(object.userData.baseY) +
          (reduced ? 0 : 0.18 * Math.sin(phase * 4 + object.position.x));
      if (effect === "exit") {
        const chosen =
          selected === object.userData.kind && this._world.phase === "result";
        object.material.emissive.setHex(chosen ? 0xffbc6b : 0x503019);
        object.material.emissiveIntensity = chosen
          ? reduced
            ? 0.4
            : 0.3 + 0.25 * (1 + Math.sin(phase * 5))
          : 0.12;
      }
    });
  }

  private _box(
    parent: Group | Scene,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    color: number
  ): Mesh<BoxGeometry, MeshStandardMaterial> {
    const mesh: Mesh<BoxGeometry, MeshStandardMaterial> = new Mesh(
      new BoxGeometry(width, height, depth),
      new MeshStandardMaterial({ color, roughness: 0.95 })
    );
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  private _label(
    text: string,
    x: number,
    y: number,
    z: number,
    width: number
  ): Sprite {
    const canvas: HTMLCanvasElement = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 150;
    const ctx: CanvasRenderingContext2D | null = canvas.getContext("2d");
    if (!ctx) throw new Error("Cannot create world label");
    ctx.fillStyle = "#121923";
    ctx.fillRect(0, 0, 640, 150);
    ctx.strokeStyle = "#9aabbc";
    ctx.strokeRect(2, 2, 636, 146);
    ctx.fillStyle = "#eee8db";
    ctx.font = "28px monospace";
    ctx.textAlign = "center";
    const lines: string[] = [""];
    for (const word of text.split(" ")) {
      const last: number = lines.length - 1;
      if ((lines[last] + word).length > 32) lines.push(word + " ");
      else lines[last] += word + " ";
    }
    lines.forEach((line: string, index: number): void =>
      ctx.fillText(line.trim(), 320, 57 + index * 35)
    );
    const texture: CanvasTexture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    this._textures.push(texture);
    const label: Sprite = new Sprite(
      new SpriteMaterial({ map: texture, depthTest: false })
    );
    label.position.set(x, y, z);
    label.scale.set(width, (width * 150) / 640, 1);
    return label;
  }

  public destroy(): void {
    this._destroyed = true;
    this.stop();
    this._abort.abort();
    this._hud?.remove();
    this._thresholdPreview?.dispose();
    if (this._late) {
      this._scene.remove(this._late.group);
      this._late.dispose();
      this._late = null;
    }
    if (this._middle) {
      this._scene.remove(this._middle.group);
      this._middle.dispose();
      this._middle = null;
    }
    this._scene.traverse((object): void => {
      if (object instanceof Mesh) {
        object.geometry.dispose();
        for (const material of Array.isArray(object.material)
          ? object.material
          : [object.material])
          material.dispose();
      }
      if (object instanceof Sprite) object.material.dispose();
    });
    this._textures.forEach((texture) => texture.dispose());
  }
}
