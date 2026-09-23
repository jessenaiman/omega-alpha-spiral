/**
 * Spiral Breaker — the render context.
 *
 * Renderer, scene, a fixed top-down camera, and the bloom pipeline, all owned
 * here and nowhere else. Presentation modules receive these and add children;
 * they never construct a second renderer.
 */

import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { Pass } from "three/addons/postprocessing/Pass.js";
import type { DiagnosticsPatch } from "../../../../src/core";

/**
 * Snaps renderer.info.render at the moment the RenderPass has just drawn the
 * scene. info is reset at the start of every renderer.render(), so reading it
 * after the composer finishes only ever sees the OutputPass's triangle; this
 * pass sits between the scene pass and the bloom pass and records the real
 * scene cost first.
 */
class SceneProbePass extends Pass {
  readonly snapshot = { calls: 0, triangles: 0 };

  constructor() {
    super();
    this.needsSwap = false;
  }

  render(renderer: THREE.WebGLRenderer): void {
    this.snapshot.calls = renderer.info.render.calls;
    this.snapshot.triangles = renderer.info.render.triangles;
  }
}

export interface ArcadeRenderContext {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly composer: EffectComposer;
  readonly bloom: UnrealBloomPass;
  resize(): void;
  render(): void;
  metrics(): NonNullable<DiagnosticsPatch["renderer"]>;
  canvasSize(): NonNullable<DiagnosticsPatch["canvas"]>;
  dispose(): void;
}

export function createArcadeRenderContext(
  canvas: HTMLCanvasElement
): ArcadeRenderContext {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x04060b, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04060b);

  // A minimal procedural environment gives MeshStandard materials something
  // to reflect beyond pure black, without importing an HDR.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0x0a1428);
  envScene.add(new THREE.AmbientLight(0x2244aa, 0.5));
  const envDir = new THREE.DirectionalLight(0x88aaff, 0.6);
  envDir.position.set(2, 4, 1);
  envScene.add(envDir);
  scene.environment = pmrem.fromScene(envScene, 0, 0.1, 100).texture;
  pmrem.dispose();

  // Key + fill + rim — enough to give MeshStandard surfaces dimension without
  // a full light rig.  Colors are cool/warm to suggest a space-side key.
  const key = new THREE.DirectionalLight(0x88aaff, 1.6);
  key.position.set(3, 6, 2);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffaa66, 0.45);
  fill.position.set(-4, 3, -2);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x4466ff, 0.55);
  rim.position.set(-1, 5, -5);
  scene.add(rim);
  const ambient = new THREE.AmbientLight(0x1a2a3a, 0.35);
  scene.add(ambient);

  const camera = new THREE.PerspectiveCamera(46, 1, 0.1, 80);
  camera.position.set(0, 9.4, 2.3);
  camera.lookAt(0, 0, 0);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const probe = new SceneProbePass();
  composer.addPass(probe);
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 1.15, 0.62, 0.68);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const resize = (): void => {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    const pixelRatio = Math.min(globalThis.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setSize(width, height, false);
    composer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };

  resize();

  return {
    renderer,
    scene,
    camera,
    composer,
    bloom,
    resize,
    render(): void {
      composer.render();
    },
    metrics(): NonNullable<DiagnosticsPatch["renderer"]> {
      const info = renderer.info;
      return {
        calls: probe.snapshot.calls,
        triangles: probe.snapshot.triangles,
        geometries: info.memory.geometries,
        textures: info.memory.textures,
      };
    },
    canvasSize(): NonNullable<DiagnosticsPatch["canvas"]> {
      return {
        width: renderer.domElement.width,
        height: renderer.domElement.height,
        pixelRatio: renderer.getPixelRatio(),
      };
    },
    dispose(): void {
      composer.dispose();
      renderer.dispose();
    },
  };
}
