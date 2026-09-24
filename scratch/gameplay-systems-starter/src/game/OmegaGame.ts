import * as THREE from 'three';
import { InputController } from '../core/InputController';
import { Loop } from '../core/Loop';
import { createRenderer, resizeRenderer } from '../core/Renderer';
import { Player } from '../entities/Player';
import { Pickup } from '../entities/Pickup';
import { AudioSystem } from '../systems/AudioSystem';
import { CameraRig } from '../systems/CameraRig';
import { CollisionSystem } from '../systems/CollisionSystem';
import { DebugTools, type DebugTuning } from '../systems/DebugTools';
import { Hud } from '../systems/Hud';
import { createSeededRandom } from '../utils/random';

const PATHS = [
  { name: 'LIGHT', x: -4, color: '#bceaff' },
  { name: 'SHADOW', x: 0, color: '#ef83a7' },
  { name: 'AMBITION', x: 4, color: '#ffc578' },
] as const;

/** One physical choice encounter, using the packaged gameplay starter's systems. */
export class OmegaGame {
  private readonly renderer: THREE.WebGLRenderer;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(58, 1, 0.1, 80);
  private readonly input: InputController;
  private readonly player = new Player();
  private readonly targets: Pickup[] = [];
  private readonly collision = new CollisionSystem();
  private readonly audio = new AudioSystem();
  private readonly hud = new Hud();
  private readonly cameraRig = new CameraRig(this.camera);
  private readonly loop = new Loop(
    (delta, elapsed) => this.update(delta, elapsed),
    () => this.renderer.render(this.scene, this.camera),
  );
  private readonly tuning: DebugTuning = {
    speed: 4.5, dashMultiplier: 1.5, acceleration: 11,
    cameraLag: 0.12, exposure: 1.15, maxDpr: 2,
  };
  private readonly debugTools: DebugTools;
  private frame = 0;
  private elapsed = 0;
  private chosen = -1;
  private pausedForScreenshot = false;
  private reducedMotion = false;
  private rng = createSeededRandom(472);
  private readonly question: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;

  constructor(private readonly canvas: HTMLCanvasElement) {
    this.renderer = createRenderer(canvas);
    this.renderer.toneMappingExposure = this.tuning.exposure;
    this.input = new InputController(
      this.element('#touch-stick'), this.element('#touch-knob'), this.element('#dash-button'),
    );
    this.debugTools = new DebugTools(this.tuning, () => {
      this.renderer.toneMappingExposure = this.tuning.exposure;
      resizeRenderer(this.renderer, this.camera, this.tuning.maxDpr);
    });
    this.question = this.worldText('IF YOU COULD BE ONLY ONE STORY...\nWHO WOULD YOU BE?  ▌', '#e4f1ff', 7.6, 1.45);
    this.buildWorld();
    this.reset();
    this.installHooks();
  }

  start(): void { this.loop.start(); }

  dispose(): void {
    this.loop.stop();
    this.input.dispose();
    this.audio.dispose();
    this.debugTools.dispose();
    this.targets.forEach((target) => target.dispose());
    this.player.dispose();
    this.renderer.dispose();
    window.__THREE_GAME_DIAGNOSTICS__ = undefined;
    window.__THREE_GAME_TEST_HOOKS__ = undefined;
  }

  private update(delta: number, elapsed: number): void {
    this.frame++;
    if (this.pausedForScreenshot) return;
    this.elapsed += delta;
    resizeRenderer(this.renderer, this.camera, this.tuning.maxDpr);
    this.player.update(delta, this.reducedMotion ? 0 : elapsed, this.input, this.tuning,
      { halfWidth: 6.3, halfDepth: 13.5 });
    if (this.chosen < 0) {
      const contacted = this.collision.collectPickups(this.player.group.position, this.targets, 0.55);
      if (contacted.length) {
        this.chosen = contacted[0].index;
        this.targets.forEach((target) => target.collect());
        this.audio.pickup(this.chosen);
        this.hud.flashPickup();
      }
    }
    this.question.material.opacity = THREE.MathUtils.clamp((this.player.group.position.z + 2) / 4, 0, 1);
    this.cameraRig.update(delta, this.player.group.position, this.tuning.cameraLag);
    this.hud.update(this.chosen < 0 ? 0 : 1, 1, this.elapsed, this.chosen >= 0);
    this.publishDiagnostics();
  }

  private buildWorld(): void {
    this.scene.background = new THREE.Color('#030912');
    this.scene.fog = new THREE.FogExp2('#030912', 0.017);
    this.scene.add(new THREE.HemisphereLight('#b8d9ee', '#0b1421', 1.65));
    const key = new THREE.DirectionalLight('#d8e9ff', 1.9);
    key.position.set(-4, 8, 5);
    this.scene.add(key);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(12.7, 27),
      new THREE.MeshStandardMaterial({ color: '#111d2a', roughness: 0.88 }));
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);
    const edgeMaterial = new THREE.MeshBasicMaterial({ color: '#50718f', transparent: true, opacity: 0.5 });
    for (const x of [-6, 6]) {
      const edge = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.02, 26), edgeMaterial);
      edge.position.set(x, 0.02, 0);
      this.scene.add(edge);
    }
    this.question.position.set(0, 2.7, 0);
    this.scene.add(this.question);
    this.scene.add(this.player.group);

    PATHS.forEach((path, index) => {
      const color = new THREE.Color(path.color);
      const lane = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 9.5),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.09, side: THREE.DoubleSide }));
      lane.rotation.x = -Math.PI / 2;
      lane.position.set(path.x, 0.023, -8.5);
      this.scene.add(lane);
      this.portal(index, path.x, color);
      const target = new Pickup(index, new THREE.Vector3(path.x, 0.8, -11.6));
      target.group.visible = false;
      this.targets.push(target);
      this.scene.add(target.group);
      const label = this.worldText(path.name, path.color, 2.4, 0.5);
      label.position.set(path.x, 2.8, -11.8);
      this.scene.add(label);
    });
    const stars: number[] = [];
    for (let index = 0; index < 350; index++)
      stars.push((this.rng() - 0.5) * 80, 5 + this.rng() * 35, (this.rng() - 0.5) * 80);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3));
    this.scene.add(new THREE.Points(geometry,
      new THREE.PointsMaterial({ color: '#adc7da', size: 0.075, sizeAttenuation: true })));
  }

  private portal(index: number, x: number, color: THREE.Color): void {
    const material = new THREE.MeshBasicMaterial({ color, toneMapped: false });
    const stroke = (w: number, h: number, px: number, py: number, angle = 0) => {
      const part = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), material);
      part.position.set(px, py, -11.8);
      part.rotation.z = angle;
      this.scene.add(part);
    };
    if (index === 0) {
      stroke(0.06, 2.6, x - 0.9, 1.3);
      stroke(0.06, 2.6, x + 0.9, 1.3);
      stroke(1.85, 0.06, x, 2.6);
    } else if (index === 1) {
      stroke(0.06, 2.7, x - 0.9, 1.3, -0.22);
      stroke(0.06, 2.7, x + 0.9, 1.3, 0.27);
      stroke(1.85, 0.06, x, 2.55, -0.13);
    } else {
      const arc = new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.045, 8, 64, Math.PI * 1.7), material);
      arc.position.set(x, 1.45, -11.8);
      arc.rotation.z = -0.3;
      this.scene.add(arc);
    }
  }

  private worldText(value: string, color: string, width: number, height: number): THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial> {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('World text canvas unavailable');
    context.fillStyle = color;
    context.font = 'bold 51px monospace';
    context.textAlign = 'center';
    value.split('\n').forEach((line, index) => context.fillText(line, 512, 91 + index * 75));
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  }

  private reset(): void {
    this.chosen = -1;
    this.elapsed = 0;
    this.player.reset();
    this.player.group.position.z = 8;
    this.targets.forEach((target) => target.reset());
    this.cameraRig.snapTo(this.player.group.position);
    this.hud.setTarget(1);
    this.hud.update(0, 1, 0, false);
  }

  private installHooks(): void {
    window.__THREE_GAME_TEST_HOOKS__ = {
      seed: (value: number) => { this.rng = createSeededRandom(value); },
      setState: (name: string) => {
        if (name !== 'active-play' && name !== 'complete') throw new Error(`Unknown test state: ${name}`);
        this.reset();
        if (name === 'complete') this.chosen = 0;
        return { state: name };
      },
      setPausedForScreenshot: (paused: boolean) => { this.pausedForScreenshot = paused; },
      setReducedMotion: (enabled: boolean) => { this.reducedMotion = enabled; },
      hideDebugUi: (hidden: boolean) => { this.debugTools.setHidden(hidden); },
    };
  }

  private publishDiagnostics(): void {
    const info = this.renderer.info;
    window.__THREE_GAME_DIAGNOSTICS__ = {
      frame: this.frame,
      elapsed: this.elapsed,
      score: this.chosen < 0 ? 0 : 1,
      targetScore: 1,
      complete: this.chosen >= 0,
      player: {
        position: { x: this.player.group.position.x, y: this.player.group.position.y, z: this.player.group.position.z },
        speed: this.player.velocity.length(),
      },
      renderer: { calls: info.render.calls, triangles: info.render.triangles,
        geometries: info.memory.geometries, textures: info.memory.textures },
      canvas: { clientWidth: this.canvas.clientWidth, clientHeight: this.canvas.clientHeight,
        width: this.canvas.width, height: this.canvas.height,
        dpr: Math.min(window.devicePixelRatio || 1, this.tuning.maxDpr) },
    };
  }

  private element(selector: string): HTMLElement {
    const element = document.querySelector<HTMLElement>(selector);
    if (!element) throw new Error(`Missing ${selector}`);
    return element;
  }
}
