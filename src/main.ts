/**
 * Boot — the one entry point the page loads.
 *
 * It builds the shell (renderer, scene, camera), constructs the single scene
 * host from `src/core`, hands the host's frames to the renderer, and installs
 * the acceptance surfaces on `window`. It owns no rules and no copy: the rules
 * live in `src/core` and `src/game`, and everything about what a scene looks
 * like, reads like, or sounds like belongs to a scene ticket.
 *
 * The scene content here is deliberately one placeholder signal. It exists to
 * prove the page draws a live frame rather than an empty one, and to give the
 * loop something to advance. It is not art direction and is not the console —
 * see the "open with the design owner" list on the boot card before building on
 * it.
 *
 * Wiring, in order: the host is created off the seeded generator, the frame
 * callback draws and republishes diagnostics, the acceptance surfaces are
 * installed, and only then does the loop start.
 */

import * as THREE from 'three';

import {
  captureRuntimeErrors,
  createSceneHost,
  type AcceptanceTarget,
  type SceneHost,
} from './core';

// The sheet is injected by Vite into the page, so it is imported at runtime and
// only where a document exists. A static import would make this module
// unloadable from the Node unit test that checks the wiring without a browser.
if (typeof document !== 'undefined') void import('./styles.css');

/** The deterministic default seed. `seed(value)` replaces it for a capture. */
export const DEFAULT_SEED = 'omega-spiral';

/**
 * Provisional question ids for the boot.
 *
 * The host needs an opening question, a closing question, and at least three
 * Dreamweaver questions to build a run. The authored words and the real ids
 * belong to the content ticket; these are stable placeholders so the boot runs
 * now, and replacing them is a content change, not a boot change.
 */
export const BOOT_QUESTIONS = Object.freeze({
  openingQuestion: 'omega.opening',
  closingQuestion: 'omega.name',
  dreamweaverQuestions: ['dw.light', 'dw.shadow', 'dw.ambition'] as const,
});

/**
 * The inherited first-frame clear colour. It is the stub's value and the
 * `theme-color` in `index.html`; whether the system should instead start on pure
 * black is an open question with the design owner, so the boot changes nothing.
 */
export const CLEAR_COLOUR = 0x070908;

/** The shell's existing neutral stroke. Not a Dreamweaver identity colour. */
const SIGNAL_COLOUR = 0xdce9e8;

/**
 * The smallest document surface the boot needs, so a test can supply a fake.
 * `querySelector` returns an unknown element that casts at the call site.
 */
export interface BootDocumentLike {
  querySelector(selector: string): unknown | null;
}

/** The window surface the boot needs: resize listening and the device ratio. */
export interface BootWindowLike {
  readonly devicePixelRatio?: number;
  addEventListener(type: string, listener: (event: Event) => void): void;
  removeEventListener(type: string, listener: (event: Event) => void): void;
}

export interface BootRendererInfo {
  readonly render: {
    readonly calls: number;
    readonly triangles: number;
    readonly points: number;
    readonly lines: number;
  };
  readonly memory: { readonly geometries: number; readonly textures: number };
}

/** The renderer surface the boot needs; `THREE.WebGLRenderer` satisfies it. */
export interface BootRenderer {
  readonly info: BootRendererInfo;
  setPixelRatio(value: number): void;
  setSize(width: number, height: number, updateStyle?: boolean): void;
  setClearColor(colour: number, alpha: number): void;
  render(scene: THREE.Scene, camera: THREE.Camera): void;
  dispose(): void;
}

export interface BootSceneOptions {
  readonly document?: BootDocumentLike;
  readonly window?: BootWindowLike;
  /** Where the acceptance surfaces are installed. Defaults to `globalThis`. */
  readonly target?: AcceptanceTarget;
  readonly seed?: string | number;
  readonly createRenderer?: (canvas: HTMLCanvasElement) => BootRenderer;
}

export interface BootedScene {
  readonly host: SceneHost;
  readonly renderer: BootRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly canvas: HTMLCanvasElement;
  /** The placeholder signal, exposed so evidence can read its liveness. */
  readonly signal: THREE.Object3D;
  resize(): void;
  dispose(): void;
}

/**
 * A single spiral stroke. Neutral colour, no identity colour and no identity
 * meaning: it is a placeholder that fills the frame and moves with the loop.
 */
function createBootSignal(): THREE.Object3D {
  const turns = 2.5;
  const samples = 180;
  const points: THREE.Vector3[] = [];
  for (let index = 0; index <= samples; index += 1) {
    const t = index / samples;
    const angle = t * turns * Math.PI * 2;
    const radius = 0.08 + t * 0.52;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, 0));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({
    color: SIGNAL_COLOUR,
    transparent: true,
    opacity: 0.7,
  });
  const signal = new THREE.Line(geometry, material);
  signal.name = 'boot-placeholder-signal';
  return signal;
}

function defaultRenderer(canvas: HTMLCanvasElement): BootRenderer {
  return new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
}

/**
 * Build the page shell and the host that drives it.
 *
 * Throws when the shell is incomplete or the renderer cannot be created, so the
 * caller can put the failure in front of the player instead of leaving a blank
 * or permanently loading page.
 */
export function bootScene(options: BootSceneOptions = {}): BootedScene {
  const doc = options.document ?? (typeof document === 'undefined' ? undefined : (document as unknown as BootDocumentLike));

  const canvas = doc?.querySelector('[data-game-canvas]') as HTMLCanvasElement | null;
  // The status region is checked but never written: its visible copy is an open
  // question with the design owner, and `index.html` owns that text.
  const status = doc?.querySelector('[data-game-status]');
  const errorBox = doc?.querySelector('[data-game-error]');
  if (!canvas || !status || !errorBox) throw new Error('Game shell is incomplete.');

  const view = options.window ?? (typeof window === 'undefined' ? undefined : (window as unknown as BootWindowLike));
  if (!view) throw new Error('Omega Spiral could not start: no window to draw into.');
  const target = options.target ?? (globalThis as unknown as AcceptanceTarget);

  const createRenderer = options.createRenderer ?? defaultRenderer;
  const renderer = createRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 10);
  camera.position.z = 2;
  const signal = createBootSignal();
  scene.add(signal);

  const pixelRatio = (): number => Math.min(view.devicePixelRatio || 1, 2);

  const host = createSceneHost({
    seed: options.seed ?? DEFAULT_SEED,
    openingQuestion: BOOT_QUESTIONS.openingQuestion,
    closingQuestion: BOOT_QUESTIONS.closingQuestion,
    dreamweaverQuestions: BOOT_QUESTIONS.dreamweaverQuestions,
    onFrame: () => renderFrame(),
  });

  /**
   * Draw one frame and republish what was drawn.
   *
   * Rotation follows simulated time, so a capture pause freezes it and the same
   * seed and inputs reproduce the same frame. Reduced motion removes the
   * rotation entirely rather than slowing it down.
   */
  function renderFrame(): void {
    signal.rotation.z = host.settings.value.reducedMotion ? 0 : host.loop.elapsedMs * 0.0004;
    renderer.render(scene, camera);
    host.diagnostics.update({
      canvas: {
        width: canvas.clientWidth,
        height: canvas.clientHeight,
        pixelRatio: pixelRatio(),
      },
      renderer: {
        calls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        geometries: renderer.info.memory.geometries,
        textures: renderer.info.memory.textures,
      },
    });
  }

  function resize(): void {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setPixelRatio(pixelRatio());
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setClearColor(CLEAR_COLOUR, 1);
    renderFrame();
  }

  view.addEventListener('resize', resize);
  resize();

  captureRuntimeErrors(host.diagnostics, view);
  host.installAcceptanceSurfaces(target);
  host.start();

  return {
    host,
    renderer,
    scene,
    camera,
    canvas,
    signal,
    resize,
    dispose(): void {
      view.removeEventListener('resize', resize);
      host.dispose();
      renderer.dispose();
    },
  };
}

/** Put a boot failure in front of the player instead of a blank canvas. */
function reportBootFailure(error: unknown): void {
  const errorBox = document.querySelector<HTMLElement>('[data-game-error]');
  if (!errorBox) return;
  errorBox.hidden = false;
  errorBox.textContent = error instanceof Error ? error.message : 'Omega Spiral could not start.';
}

if (typeof document !== 'undefined') {
  try {
    bootScene();
  } catch (error) {
    reportBootFailure(error);
    throw error;
  }
}