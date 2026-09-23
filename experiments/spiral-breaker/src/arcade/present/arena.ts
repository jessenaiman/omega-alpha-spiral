/**
 * Spiral Breaker — the arena.
 *
 * The floor is one procedural shader drawing the level's spiral arms; the rim,
 * the slow-zone ring, and the core are separate meshes so the core can read
 * integrity without touching the floor. The floor rotation stops under reduced
 * motion; nothing else about the arena moves.
 */

import * as THREE from "three";
import { TUNING } from "../game";
import { WORLD_SCALE } from "./scale";

export interface ArenaUpdate {
  readonly timeSec: number;
  readonly reducedMotion: boolean;
  readonly integrity: number;
  readonly maxIntegrity: number;
  /** 0..1, spiked by a breach and decayed by the caller. */
  readonly breachFlash: number;
  /** 0..1 green heal pulse for the core. */
  readonly healFlash: number;
  /** Chain level, brightens the arms. */
  readonly chain: number;
}

export interface Arena {
  readonly group: THREE.Group;
  update(state: ArenaUpdate): void;
  dispose(): void;
}

const RADIUS = WORLD_SCALE;
const CORE_RADIUS = TUNING.coreRadius * WORLD_SCALE;
const SLOW_RADIUS = TUNING.slowZoneRadius * WORLD_SCALE;

const vertexShader = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uReduced;
  uniform float uChain;
  uniform float uFlash;
  varying vec2 vPos;

  void main() {
    float r = length(vPos);
    float angle = atan(vPos.y, vPos.x);
    float spin = (1.0 - uReduced) * uTime * 0.35;
    float arms = sin(angle * 3.0 + log(max(r, 0.03)) * 6.0 - spin);
    float armMask = smoothstep(0.45, 1.0, arms);
    float radial = smoothstep(0.1, 0.78, r) * (1.0 - smoothstep(${(RADIUS * 0.8).toFixed(3)}, ${RADIUS.toFixed(3)}, r));
    float slowRing = smoothstep(0.03, 0.0, abs(r - ${SLOW_RADIUS.toFixed(3)}));
    float coreHalo = smoothstep(0.9, 0.0, r);

    vec3 base = vec3(0.015, 0.025, 0.05);
    vec3 armCold = vec3(0.06, 0.24, 0.5);
    vec3 armHot = vec3(0.12, 0.62, 0.92);
    vec3 arm = mix(armCold, armHot, clamp(uChain * 0.16, 0.0, 1.0));
    vec3 color = base + arm * armMask * radial * 0.7;
    color += vec3(0.08, 0.42, 0.85) * slowRing * 0.55;
    color += vec3(0.1, 0.75, 1.0) * coreHalo * 0.18;
    color += vec3(0.6, 0.9, 1.0) * uFlash * 0.5;
    gl_FragColor = vec4(color, 1.0);
  }
`;

export function createArena(): Arena {
  const group = new THREE.Group();

  const floorGeometry = new THREE.CircleGeometry(RADIUS, 96);
  const floorMaterial = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uReduced: { value: 0 },
      uChain: { value: 0 },
      uFlash: { value: 0 },
    },
    vertexShader,
    fragmentShader,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  const rimGeometry = new THREE.TorusGeometry(RADIUS, 0.04, 10, 128);
  const rimMaterial = new THREE.MeshBasicMaterial({
    color: 0x36c6ff,
    toneMapped: false,
  });
  const rim = new THREE.Mesh(rimGeometry, rimMaterial);
  rim.rotation.x = -Math.PI / 2;
  group.add(rim);

  const slowGeometry = new THREE.RingGeometry(
    SLOW_RADIUS - 0.012,
    SLOW_RADIUS + 0.012,
    96
  );
  const slowMaterial = new THREE.MeshBasicMaterial({
    color: 0x1d6ea8,
    transparent: true,
    opacity: 0.5,
    toneMapped: false,
  });
  const slowRing = new THREE.Mesh(slowGeometry, slowMaterial);
  slowRing.rotation.x = -Math.PI / 2;
  group.add(slowRing);

  const coreGeometry = new THREE.CircleGeometry(CORE_RADIUS, 48);
  const coreMaterial = new THREE.MeshBasicMaterial({
    color: 0x9ff4ff,
    toneMapped: false,
  });
  const core = new THREE.Mesh(coreGeometry, coreMaterial);
  core.rotation.x = -Math.PI / 2;
  core.position.y = 0.01;
  group.add(core);

  const haloGeometry = new THREE.TorusGeometry(
    CORE_RADIUS + 0.05,
    0.028,
    10,
    64
  );
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: 0x6fe6ff,
    toneMapped: false,
    transparent: true,
    opacity: 0.9,
  });
  const halo = new THREE.Mesh(haloGeometry, haloMaterial);
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.02;
  group.add(halo);

  // A huge textured sphere frames the arena instead of raw void. The plate is a
  // generated cosmic-vortex environment (concept source in assets/concepts/,
  // flattened runtime JPG in assets/textures/). Color-space is the trap: a
  // texture used as `map` must be declared sRGB or it renders washed out under
  // the renderer's output color space. Mipmaps + a touch of anisotropy keep the
  // grazing-angle silhouette from sharpening noise.
  const backdropGeometry = new THREE.SphereGeometry(64, 32, 16);
  const backdropMaterial = new THREE.MeshBasicMaterial({
    color: 0x081022,
    side: THREE.BackSide,
    depthWrite: false,
  });
  let backdropTexture: THREE.Texture | null = null;
  const backdroploader = new THREE.TextureLoader();
  backdroploader.load(
    "assets/textures/spiral-breaker-vortex-background.jpg",
    (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 4;
      backdropTexture = texture;
      backdropMaterial.map = texture;
      backdropMaterial.needsUpdate = true;
    }
  );
  const backdrop = new THREE.Mesh(backdropGeometry, backdropMaterial);
  backdrop.rotation.y = Math.PI;
  group.add(backdrop);

  const coreHealthy = new THREE.Color(0x9ff4ff);
  const coreHurt = new THREE.Color(0xff5d4d);
  const coreHeal = new THREE.Color(0x7cff9b);
  const workingColor = new THREE.Color();

  return {
    group,
    update(state: ArenaUpdate): void {
      const health =
        state.maxIntegrity > 0 ? state.integrity / state.maxIntegrity : 0;
      floorMaterial.uniforms.uTime.value = state.timeSec;
      floorMaterial.uniforms.uReduced.value = state.reducedMotion ? 1 : 0;
      floorMaterial.uniforms.uChain.value = state.chain;
      floorMaterial.uniforms.uFlash.value = state.breachFlash;

      workingColor.copy(coreHurt).lerp(coreHealthy, health);
      if (state.healFlash > 0)
        workingColor.lerp(coreHeal, Math.min(1, state.healFlash * 1.2));
      coreMaterial.color.copy(workingColor);
      haloMaterial.color.copy(workingColor);

      const pulse = state.reducedMotion
        ? 1
        : 1 + Math.sin(state.timeSec * 2.6) * 0.06;
      const healPulse = 1 + state.healFlash * 0.18;
      halo.scale.setScalar(pulse * healPulse);
      core.scale.setScalar(pulse * healPulse);
      rimMaterial.color.setHex(state.breachFlash > 0.2 ? 0xff8f6a : 0x36c6ff);
    },
    dispose(): void {
      for (const geometry of [
        floorGeometry,
        rimGeometry,
        slowGeometry,
        coreGeometry,
        haloGeometry,
        backdropGeometry,
      ]) {
        geometry.dispose();
      }
      for (const material of [
        floorMaterial,
        rimMaterial,
        slowMaterial,
        coreMaterial,
        haloMaterial,
        backdropMaterial,
      ]) {
        material.dispose();
      }
      backdropTexture?.dispose();
    },
  };
}
