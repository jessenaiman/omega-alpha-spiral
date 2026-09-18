/**
 * Spiral Breaker — the effects.
 *
 * Every effect is driven by a rules event, never by a guess at the rules.
 * Sparks and shockwave rings are pooled; the render loop only writes into
 * preallocated buffers. Trauma (camera shake) and the FOV punch live here too,
 * so reduced motion has one place to switch them off.
 */

import * as THREE from 'three';
import { createRng } from '../../core';
import type { ArcadeEvent, WorldState } from '../game';
import { sceneX, sceneZ } from './scale';

export interface Vfx {
  readonly group: THREE.Group;
  /** 0..1 camera shake impulse. */
  readonly trauma: number;
  /** 0..1 FOV punch impulse. */
  readonly fovPunch: number;
  /** 0..1 arena flash from a breach. */
  readonly breachFlash: number;
  /** 0..1 green heal pulse for the core. */
  readonly healFlash: number;
  /** 0..1 full-screen flash; kind says what to paint it. */
  readonly flash: number;
  readonly flashKind: 'breach' | 'destruct' | 'victory' | null;
  handle(events: readonly ArcadeEvent[], world: WorldState): void;
  update(dtSec: number, reducedMotion: boolean): void;
  reset(): void;
  dispose(): void;
}

const PARTICLE_COUNT = 320;
const RING_COUNT = 10;
const TAU = Math.PI * 2;

const COLORS = {
  cyan: new THREE.Color(0x7cf0ff),
  magenta: new THREE.Color(0xff6fd8),
  amber: new THREE.Color(0xffb347),
  red: new THREE.Color(0xff4d4d),
  white: new THREE.Color(0xffffff),
  pale: new THREE.Color(0xb7c7d8),
  teal: new THREE.Color(0x2fe5c8),
  coral: new THREE.Color(0xff6b8a),
  green: new THREE.Color(0x4dff9e),
  gold: new THREE.Color(0xffe066),
  periwinkle: new THREE.Color(0x8ea2ff),
};

const particleVertex = /* glsl */ `
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aSize;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = aColor;
    vAlpha = aAlpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (260.0 / max(-mv.z, 0.001));
    gl_Position = projectionMatrix * mv;
  }
`;

const particleFragment = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 coord = gl_PointCoord - 0.5;
    float d = length(coord);
    if (d > 0.5) discard;
    float falloff = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, vAlpha * falloff);
  }
`;

export function createVfx(): Vfx {
  const group = new THREE.Group();
  const rng = createRng('spiral-breaker-vfx');

  // --- sparks ---------------------------------------------------------------
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const alphas = new Float32Array(PARTICLE_COUNT);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const velocities = new Float32Array(PARTICLE_COUNT * 3);
  const life = new Float32Array(PARTICLE_COUNT);
  const maxLife = new Float32Array(PARTICLE_COUNT);
  let cursor = 0;
  const scratch = new THREE.Color();

  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  particleGeometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
  particleGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  const particleMaterial = new THREE.ShaderMaterial({
    vertexShader: particleVertex,
    fragmentShader: particleFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(particleGeometry, particleMaterial);
  points.frustumCulled = false;
  group.add(points);

  const spawnSpark = (
    x: number,
    y: number,
    color: THREE.Color,
    speed: number,
    count: number,
    sparkLife = 0.55,
  ): void => {
    for (let index = 0; index < count; index += 1) {
      const slot = cursor;
      cursor = (cursor + 1) % PARTICLE_COUNT;
      const angle = (index / count) * TAU + rng.next() * 0.5;
      const length = speed * (0.6 + rng.next() * 0.8);
      positions[slot * 3] = sceneX(x);
      positions[slot * 3 + 1] = 0.22;
      positions[slot * 3 + 2] = sceneZ(y);
      velocities[slot * 3] = Math.cos(angle) * length;
      velocities[slot * 3 + 1] = 0.6 + rng.next() * 1.4;
      velocities[slot * 3 + 2] = Math.sin(angle) * length;
      scratch.copy(color).offsetHSL(0, 0, (rng.next() - 0.5) * 0.1);
      colors[slot * 3] = scratch.r;
      colors[slot * 3 + 1] = scratch.g;
      colors[slot * 3 + 2] = scratch.b;
      sizes[slot] = 0.08 + rng.next() * 0.1;
      life[slot] = sparkLife;
      maxLife[slot] = sparkLife;
      alphas[slot] = 1;
    }
  };

  // --- shockwave rings ------------------------------------------------------
  const ringGeometry = new THREE.RingGeometry(0.72, 1.0, 48);
  const rings: THREE.Mesh[] = [];
  const ringLife = new Float32Array(RING_COUNT);
  const ringMax = new Float32Array(RING_COUNT);
  const ringTarget = new Float32Array(RING_COUNT);
  let ringCursor = 0;
  for (let index = 0; index < RING_COUNT; index += 1) {
    const material = new THREE.MeshBasicMaterial({
      color: COLORS.cyan,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(ringGeometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.05;
    mesh.visible = false;
    rings.push(mesh);
    group.add(mesh);
  }

  const spawnRing = (x: number, y: number, color: THREE.Color, target: number, ringLifeValue: number): void => {
    const slot = ringCursor;
    ringCursor = (ringCursor + 1) % RING_COUNT;
    const mesh = rings[slot] as THREE.Mesh;
    mesh.position.x = sceneX(x);
    mesh.position.z = sceneZ(y);
    (mesh.material as THREE.MeshBasicMaterial).color.copy(color);
    mesh.visible = true;
    ringLife[slot] = ringLifeValue;
    ringMax[slot] = ringLifeValue;
    ringTarget[slot] = target;
  };

  let trauma = 0;
  let fovPunch = 0;
  let breachFlash = 0;
  let healFlash = 0;
  let flash = 0;
  let flashKind: Vfx['flashKind'] = null;

  return {
    group,
    get trauma(): number {
      return trauma;
    },
    get fovPunch(): number {
      return fovPunch;
    },
    get breachFlash(): number {
      return breachFlash;
    },
    get healFlash(): number {
      return healFlash;
    },
    get flash(): number {
      return flash;
    },
    get flashKind(): Vfx['flashKind'] {
      return flashKind;
    },
    handle(events: readonly ArcadeEvent[], world: WorldState): void {
      for (const event of events) {
        switch (event.type) {
          case 'dash.start':
            spawnRing(event.x, event.y, COLORS.cyan, 10.5, 0.34);
            spawnSpark(event.x, event.y, COLORS.cyan, 1.4, 5, 0.3);
            fovPunch = Math.min(1, fovPunch + 0.7);
            trauma = Math.min(1, trauma + 0.12);
            break;
          case 'shard.destroy':
            {
              const color =
                event.kind === 'splitter'
                  ? COLORS.teal
                  : event.kind === 'heart'
                    ? COLORS.coral
                    : event.kind === 'shielded'
                      ? COLORS.amber
                      : event.kind === 'pulsar'
                        ? COLORS.periwinkle
                        : event.kind === 'mini'
                          ? COLORS.magenta
                          : COLORS.magenta;
              const count = event.kind === 'splitter' ? 16 : event.kind === 'mini' ? 6 : 12;
              spawnSpark(event.x, event.y, color, 2.6, count);
              spawnRing(event.x, event.y, color, event.kind === 'splitter' ? 9 : 6.5, 0.3);
              trauma = Math.min(1, trauma + (event.kind === 'shielded' ? 0.22 : 0.16));
              if (event.kind === 'shielded') {
                flash = 0.3;
                flashKind = 'destruct';
              }
            }
            break;
          case 'shard.blocked':
            spawnSpark(event.x, event.y, COLORS.amber, 2.2, 6, 0.3);
            spawnRing(event.x, event.y, COLORS.amber, 4, 0.2);
            trauma = Math.min(1, trauma + 0.04);
            break;
          case 'pulsar.pulse':
            // The charged ring fires outward to exactly the pulse's reach.
            spawnRing(event.x, event.y, COLORS.periwinkle, 2.2, 0.5);
            break;
          case 'core.heal':
            spawnSpark(event.x, event.y, COLORS.green, 2.2, 8, 0.5);
            spawnRing(event.x, event.y, COLORS.green, 6, 0.4);
            healFlash = 1;
            break;
          case 'score.change':
            if (event.chain >= 3) spawnRing(world.player.pos.x, world.player.pos.y, COLORS.amber, 8, 0.4);
            break;
          case 'player.knockback':
            spawnSpark(event.x, event.y, COLORS.amber, 2.2, 10, 0.5);
            trauma = Math.min(1, trauma + 0.35);
            break;
          case 'core.breach':
            spawnRing(event.x, event.y, COLORS.red, 18, 0.6);
            spawnSpark(event.x, event.y, COLORS.red, 3.4, 22, 0.8);
            trauma = Math.min(1, trauma + 0.6);
            breachFlash = 1;
            flash = 0.5;
            flashKind = 'breach';
            break;
          case 'wave.start':
            spawnRing(0, 0, COLORS.cyan, 12, 0.7);
            break;
          case 'ghost.takeover':
            spawnRing(world.player.pos.x, world.player.pos.y, COLORS.pale, 7, 0.5);
            break;
          case 'game.over':
            if (event.victory) {
              spawnSpark(0, 0, COLORS.gold, 4.2, 30, 1.1);
              spawnRing(0, 0, COLORS.gold, 22, 0.9);
              spawnRing(0, 0, COLORS.coral, 14, 0.7);
              trauma = Math.min(1, trauma + 0.35);
              flash = 1;
              flashKind = 'victory';
            } else {
              spawnSpark(world.player.pos.x, world.player.pos.y, COLORS.red, 4.2, 30, 1.1);
              spawnRing(0, 0, COLORS.red, 24, 0.9);
              trauma = Math.min(1, trauma + 0.8);
              breachFlash = 1;
              flash = 0.6;
              flashKind = 'breach';
            }
            break;
          default:
            break;
        }
      }
    },
    update(dtSec: number, reducedMotion: boolean): void {
      for (let index = 0; index < PARTICLE_COUNT; index += 1) {
        if (life[index] <= 0) {
          alphas[index] = 0;
          continue;
        }
        life[index] -= dtSec;
        const ratio = Math.max(0, life[index] / maxLife[index]);
        alphas[index] = ratio;
        velocities[index * 3] *= 1 - Math.min(1, dtSec * 2.4);
        velocities[index * 3 + 2] *= 1 - Math.min(1, dtSec * 2.4);
        velocities[index * 3 + 1] -= dtSec * 3.4;
        positions[index * 3] += velocities[index * 3] * dtSec;
        positions[index * 3 + 1] += velocities[index * 3 + 1] * dtSec;
        positions[index * 3 + 2] += velocities[index * 3 + 2] * dtSec;
      }
      particleGeometry.attributes.position.needsUpdate = true;
      particleGeometry.attributes.aAlpha.needsUpdate = true;
      particleGeometry.attributes.aColor.needsUpdate = true;
      particleGeometry.attributes.aSize.needsUpdate = true;

      for (let index = 0; index < RING_COUNT; index += 1) {
        const mesh = rings[index] as THREE.Mesh;
        const material = mesh.material as THREE.MeshBasicMaterial;
        if (!mesh.visible) continue;
        if (reducedMotion) {
          mesh.visible = false;
          continue;
        }
        ringLife[index] -= dtSec;
        const ratio = Math.max(0, ringLife[index] / ringMax[index]);
        const scale = ringTarget[index] * (1 - ratio) + 0.4;
        mesh.scale.setScalar(scale);
        material.opacity = ratio * 0.8;
        if (ringLife[index] <= 0) mesh.visible = false;
      }

      const decay = (value: number, rate: number): number => Math.max(0, value - dtSec * rate);
      const decayExp = (value: number, tau: number): number => value * Math.exp(-dtSec / tau);
      trauma = decay(trauma, 1.8);
      fovPunch = decayExp(fovPunch, 0.38);
      breachFlash = decayExp(breachFlash, 0.32);
      healFlash = decayExp(healFlash, 0.3);
      if (reducedMotion) {
        flash = 0;
        healFlash = 0;
        flashKind = null;
      } else {
        flash = decayExp(flash, 0.2);
        if (flash < 0.01) flashKind = null;
      }
    },
    reset(): void {
      life.fill(0);
      alphas.fill(0);
      for (const mesh of rings) mesh.visible = false;
      trauma = 0;
      fovPunch = 0;
      breachFlash = 0;
      healFlash = 0;
      flash = 0;
      flashKind = null;
    },
    dispose(): void {
      particleGeometry.dispose();
      particleMaterial.dispose();
      ringGeometry.dispose();
      for (const mesh of rings) (mesh.material as THREE.Material).dispose();
    },
  };
}
