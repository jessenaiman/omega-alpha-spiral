import * as THREE from "three";
import { InputController } from "../core/InputController";
import { Loop } from "../core/Loop";
import { createRenderer, resizeRenderer } from "../core/Renderer";
import { Player } from "../entities/Player";
import { LightChamber, type ChamberChoice } from "./LightChamber";
import { AudioSystem } from "../systems/AudioSystem";
import { CameraRig } from "../systems/CameraRig";
import { CollisionSystem } from "../systems/CollisionSystem";
import { CosmicCodeBackdrop } from "../systems/CosmicCodeBackdrop";
import { DebugTools, type DebugTuning } from "../systems/DebugTools";
import { DialogueBeacon } from "../systems/DialogueBeacon";
import { Hud } from "../systems/Hud";
import { createSeededRandom } from "../utils/random";

const ARENA = {
  halfWidth: 36,
  halfDepth: 34,
};

export class Game {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(43, 1, 0.1, 80);
  private readonly input: InputController;
  private readonly player = new Player();
  private readonly chamber = new LightChamber();
  private readonly previousPosition = new THREE.Vector3();
  private readonly collision = new CollisionSystem();
  private readonly backdrop = new CosmicCodeBackdrop(ARENA.halfDepth);
  private readonly audio = new AudioSystem();
  private readonly hud = new Hud();
  private readonly dialogue = new DialogueBeacon();
  private readonly cameraRig = new CameraRig(this.camera, new THREE.Vector3(0, 14.8, 18.5));
  private readonly cameraFocus = new THREE.Vector3();
  private readonly loop = new Loop(
    (delta, elapsed) => this.update(delta, elapsed),
    () => this.render()
  );

  private readonly tuning: DebugTuning = {
    speed: 5.8,
    dashMultiplier: 1.75,
    acceleration: 13,
    cameraLag: 0.16,
    exposure: 1.05,
    maxDpr: 2,
  };

  private readonly debugTools: DebugTools;
  private frame = 0;
  private score = 0;
  private elapsed = 0;
  private complete = false;
  private nearby: ChamberChoice | null = null;
  private outcomeText: string | null = null;
  private battleTime = 0;
  private layoutSeed = 472;
  private choiceRecord: {
    dungeon: "Light";
    choice: "D" | "M" | "C";
    aligned_to: ChamberChoice["alignedTo"];
  } | null = null;
  // Route ALL gameplay randomness through this.rng (never Math.random) so the
  // seed() test hook keeps screenshot baselines and bot playtests deterministic.
  private rng = createSeededRandom(1);
  private pausedForScreenshot = false;
  private reducedMotion = false;
  private controllerConnected = false;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = createRenderer(canvas);
    this.renderer.toneMappingExposure = this.tuning.exposure;

    const stick = this.getElement("#touch-stick");
    const knob = this.getElement("#touch-knob");
    const dashButton = this.getElement("#dash-button");
    const interactButton = this.getElement("#interact-button");
    this.input = new InputController(stick, knob, dashButton, interactButton);

    this.debugTools = new DebugTools(this.tuning, () => {
      this.renderer.toneMappingExposure = this.tuning.exposure;
      resizeRenderer(this.renderer, this.camera, this.tuning.maxDpr);
    });

    this.createScene();
    this.resetRun();
    resizeRenderer(this.renderer, this.camera, this.tuning.maxDpr);
    this.installTestHooks();
    this.publishDiagnostics();
  }

  start(): void {
    this.loop.start();
  }

  dispose(): void {
    this.loop.stop();
    this.input.dispose();
    this.audio.dispose();
    this.debugTools.dispose();
    this.chamber.dispose();
    this.dialogue.dispose();
    this.backdrop.dispose();
    this.player.dispose();
    this.renderer.dispose();
    window.__THREE_GAME_DIAGNOSTICS__ = undefined;
    window.__THREE_GAME_TEST_HOOKS__ = undefined;
  }

  private update(delta: number, elapsed: number): void {
    this.frame += 1;
    if (this.pausedForScreenshot) {
      this.publishDiagnostics();
      return;
    }
    this.input.pollGamepad();
    const connected = this.input.hasGamepad();
    if (connected !== this.controllerConnected) {
      this.controllerConnected = connected;
      this.getElement("#controls-hint").textContent = connected
        ? "Left stick / D-pad · move   A / Cross · choose   B / Circle / RB / RT · dash   Start · retry"
        : "WASD / arrows · move   Shift / Space · dash   E · choose   R · retry";
    }
    if (this.input.consumeRestart()) this.resetRun();
    if (!this.complete) this.elapsed += delta;

    resizeRenderer(this.renderer, this.camera, this.tuning.maxDpr);
    // Reduced motion freezes ambient animation time so screenshots are stable.
    const animElapsed = this.reducedMotion ? 0 : elapsed;
    this.backdrop.update(animElapsed, this.reducedMotion);
    this.chamber.update(animElapsed, this.reducedMotion);
    if (!this.complete) {
      this.previousPosition.copy(this.player.group.position);
      this.player.update(delta, animElapsed, this.input, this.tuning);
      this.collision.resolveWalls(
        this.player.group.position,
        this.previousPosition,
        this.player.velocity,
        this.chamber.walls,
        0.38
      );
      this.nearby = this.choiceRecord ? null : this.findNearbyChoice();
      if (this.input.consumeInteract() && this.nearby) {
        this.selectChoice(this.nearby);
      }
      if (this.choiceRecord && this.battleTime === 0 && this.chamber.reachedExit(
        this.choiceRecord.choice === "D" ? "door" : this.choiceRecord.choice === "M" ? "monster" : "chest",
        this.player.group.position,
      )) {
        this.complete = true;
        this.outcomeText = "You leave by the path you chose. Floor One complete. Press R to explore another exit.";
      }
    } else {
      this.input.consumeInteract();
    }

    if (this.battleTime > 0) {
      this.battleTime = Math.max(0, this.battleTime - delta);
      if (this.battleTime === 0) {
        this.chamber.resolveChoice("monster");
        this.outcomeText = "The wolf falls. Follow the amber threshold to leave.";
      }
    }

    this.cameraFocus.copy(this.player.group.position);
    this.cameraFocus.y = 0;
    this.cameraFocus.z -= 7;
    this.cameraRig.update(delta, this.cameraFocus, this.tuning.cameraLag);
    this.dialogue.update(delta, animElapsed, this.reducedMotion, this.camera);
    this.hud.update(this.nearby?.label ?? null, this.outcomeText, this.choiceRecord?.choice ?? null, this.complete);
    this.publishDiagnostics();
  }

  private render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  private createScene(): void {
    this.scene.background = new THREE.Color("#030914");
    this.scene.fog = new THREE.Fog("#030914", 30, 74);

    const hemisphere = new THREE.HemisphereLight("#dcefff", "#102746", 1.85);
    this.scene.add(hemisphere);

    const sun = new THREE.DirectionalLight("#d7edff", 2.4);
    sun.position.set(-18, 44, 22);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 100;
    sun.shadow.camera.left = -45;
    sun.shadow.camera.right = 45;
    sun.shadow.camera.top = 45;
    sun.shadow.camera.bottom = -45;
    this.scene.add(sun);

    this.scene.add(this.backdrop.group);
    this.scene.add(this.createArena());
    this.scene.add(this.chamber.group);
    this.scene.add(this.dialogue.group);
    this.scene.add(this.player.group);
  }

  private createArena(): THREE.Group {
    const arena = new THREE.Group();
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(ARENA.halfWidth * 2.3, ARENA.halfDepth * 2.3, 1, 1),
      new THREE.MeshStandardMaterial({
        color: "#142a46",
        roughness: 0.84,
        metalness: 0.02,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.z = 0;
    floor.receiveShadow = true;
    arena.add(floor);

    return arena;
  }

  private installTestHooks(): void {
    // Deterministic hooks consumed by tests/visual-regression.template.ts and
    // bot playtests. Keep these real when evolving the game: silent no-op hooks
    // produce flaky screenshot baselines.
    window.__THREE_GAME_TEST_HOOKS__ = {
      seed: (value: number) => {
        this.rng = createSeededRandom(value);
        this.layoutSeed = value;
        this.chamber.regenerate(value);
      },
      setState: (name: string) => {
        if (name !== "active-play" && name !== "complete")
          throw new Error(`Unknown test state: ${name}`);
        this.resetRun();
        if (name === "complete") {
          this.selectChoice(this.chamber.choices[1]);
          this.complete = true;
          this.outcomeText = "Floor One complete.";
        }
        this.render();
        this.publishDiagnostics();
        return { state: name };
      },
      setPausedForScreenshot: (paused: boolean) => {
        this.pausedForScreenshot = paused;
      },
      setReducedMotion: (enabled: boolean) => {
        this.reducedMotion = enabled;
        if (enabled) {
          this.player.stabilizeVisuals();
        }
        this.render();
        this.publishDiagnostics();
      },
      hideDebugUi: (hidden: boolean) => {
        this.debugTools.setHidden(hidden);
      },
    };
  }

  private resetRun(): void {
    this.score = 0;
    this.elapsed = 0;
    this.complete = false;
    this.nearby = null;
    this.choiceRecord = null;
    this.outcomeText = null;
    this.battleTime = 0;
    this.player.reset();
    this.player.group.position.z = 24;
    this.chamber.reset();
    this.dialogue.clear();
    this.dialogue.play("entry", this.player.group.position);
    this.chamber.regenerate(this.layoutSeed++);
    this.cameraRig.snapTo(this.cameraFocus.set(0, 0, this.player.group.position.z - 7));
    this.hud.update(null, null, null, false);
  }

  private findNearbyChoice(): ChamberChoice | null {
    const player = this.player.group.position;
    for (const choice of this.chamber.choices) {
      const dx = player.x - choice.position.x;
      const dz = player.z - choice.position.z;
      if (dx * dx + dz * dz < 1.8 * 1.8) return choice;
    }
    return null;
  }

  private selectChoice(choice: ChamberChoice): void {
    this.complete = false;
    this.score = choice.alignedTo === "Light" ? 2 : 1;
    this.choiceRecord = {
      dungeon: "Light",
      choice: choice.id === "door" ? "D" : choice.id === "monster" ? "M" : "C",
      aligned_to: choice.alignedTo,
    };
    this.outcomeText = `${choice.outcome} ${choice.id === "monster" ? "The fight resolves..." : "Follow this threshold to leave."}`;
    this.dialogue.play(choice.id, choice.position);
    if (choice.id === "monster") this.battleTime = 1.6 + this.rng() * 0.8;
    else this.chamber.resolveChoice(choice.id);
    this.audio.pickup(this.chamber.choices.indexOf(choice));
    this.hud.update(null, this.outcomeText, this.choiceRecord.choice, false);
  }

  private publishDiagnostics(): void {
    const info = this.renderer.info;
    window.__THREE_GAME_DIAGNOSTICS__ = {
      frame: this.frame,
      elapsed: this.elapsed,
      score: this.score,
      targetScore: 2,
      complete: this.complete,
      choice: this.choiceRecord,
      player: {
        position: {
          x: this.player.group.position.x,
          y: this.player.group.position.y,
          z: this.player.group.position.z,
        },
        speed: this.player.velocity.length(),
      },
      renderer: {
        calls: info.render.calls,
        triangles: info.render.triangles,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
      },
      canvas: {
        clientWidth: this.canvas.clientWidth,
        clientHeight: this.canvas.clientHeight,
        width: this.canvas.width,
        height: this.canvas.height,
        dpr: Math.min(window.devicePixelRatio || 1, this.tuning.maxDpr),
      },
    };
  }

  private getElement(selector: string): HTMLElement {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Missing element: ${selector}`);
    return element;
  }
}
