/**
 * Spiral Breaker — the actors.
 *
 * One pooled mesh per shard and a single authored player kit. The bodies are
 * `MeshStandardMaterial`: a crystalline roughness/metalness tuned per kind, a
 * faint emissive so the bloom pass still picks the neon identity out of the
 * now-lit scene, and tone-mapped light defining the forms. The pool is
 * allocated once and only toggled afterwards; the render loop allocates
 * nothing.
 *
 * The player is a small authored ship kit (hull, swept wings, cockpit glass,
 * twin engines, emissive trim) so the hero reads as a silhouette, not a
 * primitive placeholder. Its collision footprint stays owned by the pure
 * rules — the visual group only ever reports the state the rules compute.
 */

import * as THREE from 'three';
import { easeOutBack, easeOutCubic, createTweenManager } from './tween';
import { TUNING, type ShardKind, type WorldState, type ArcadeEvent } from '../game';
import { sceneX, sceneZ } from './scale';

export interface Actors {
  readonly group: THREE.Group;
  handle(events: readonly ArcadeEvent[]): void;
  update(world: WorldState, timeSec: number, dtSec: number, reducedMotion: boolean): void;
  dispose(): void;
}

export interface PlayerKit {
  readonly group: THREE.Group;
  /** Shell materials lerped for ghost / dash / knock state cues. */
  readonly bodyMaterials: THREE.MeshStandardMaterial[];
  /** Engine glow materials; emissive ramps on dash. */
  readonly engineMaterials: THREE.MeshStandardMaterial[];
  dispose(): void;
}

/** The authored hero parts, named so state cues and tests can reach them. */
export const PLAYER_KIT_CHILD_NAMES = [
  'hull',
  'wingLeft',
  'wingRight',
  'cockpitGlass',
  'engineLeft',
  'engineRight',
  'trim',
] as const;

const SHARD_POOL = 20;
const SHARD_RADIUS = 0.15;
const PLAYER_COLOR = 0x7cf0ff;
const GHOST_COLOR = 0xb7c7d8;
const DASH_COLOR = 0xffffff;

/** One readable signature per kind — shape + color, never a marker. */
const SHARD_KIND_COLORS: Record<ShardKind, number> = {
  standard: 0xff6fd8,
  splitter: 0x2fe5c8,
  mini: 0xff8fd2,
  heart: 0xff6b8a,
  shielded: 0xffd166,
  pulsar: 0x8ea2ff,
};
const STANDARD_VARIANTS = [0xff6fd8, 0xffd166, 0x8affc1];
const MINI_SCALE = 0.7;
const HEART_PULSE = 1.18;
const PULSAR_SCALE = 1.05;
const PULSAR_HOT = new THREE.Color(0xffffff);

/**
 * The heart reward, authored instead of a recolored polyhedron: a canonical
 * heart silhouette extruded into a flat token that lies face-up for the
 * top-down camera, with a soft bevel so bloom holds its seam. One geometry;
 * the shard pool swaps it in for heart slots like any other kind.
 */
export function createHeartGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(25, 25);
  shape.bezierCurveTo(25, 25, 20, 0, 0, 0);
  shape.bezierCurveTo(-30, 0, -30, 35, -30, 35);
  shape.bezierCurveTo(-30, 55, -10, 77, 25, 95);
  shape.bezierCurveTo(60, 77, 80, 55, 80, 35);
  shape.bezierCurveTo(80, 35, 80, 0, 50, 0);
  shape.bezierCurveTo(35, 0, 25, 25, 25, 25);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: 12,
    bevelEnabled: true,
    bevelThickness: 5,
    bevelSize: 4,
    bevelSegments: 2,
    steps: 1,
  });
  geometry.center();
  // The extrusion's face normal (+Z) becomes +Y, so the flat token faces the
  // top-down camera and reads as a heart silhouette in motion.
  geometry.rotateX(-Math.PI / 2);
  const span = 110;
  geometry.scale((SHARD_RADIUS * 1.9) / span, (SHARD_RADIUS * 1.9) / span, (SHARD_RADIUS * 1.9) / span);
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * The authored player kit — forward is +X so the same `rotation.y` aiming as
 * the old cone works. Cheap by design: three materials (shell, glass, engine
 * glow) shared across the parts, all disposed with the kit.
 */
export function buildPlayerKit(): PlayerKit {
  const group = new THREE.Group();

  const bodyPrimary = new THREE.MeshStandardMaterial({
    color: PLAYER_COLOR,
    roughness: 0.3,
    metalness: 0.55,
    emissive: PLAYER_COLOR,
    emissiveIntensity: 0.32,
  });
  const trimMaterial = new THREE.MeshBasicMaterial({ color: PLAYER_COLOR, toneMapped: false });
  const glassMaterial = new THREE.MeshStandardMaterial({
    color: 0xc8f2ff,
    roughness: 0.12,
    metalness: 0.85,
    emissive: 0x2ec8ff,
    emissiveIntensity: 0.35,
  });
  const engineMaterial = new THREE.MeshStandardMaterial({
    color: 0x9ff4ff,
    roughness: 0.25,
    metalness: 0.5,
    emissive: 0x22c8ff,
    emissiveIntensity: 0.7,
  });

  // Hull — a low-poly dart (apex forward along +X).
  const hullGeometry = new THREE.ConeGeometry(0.13, 0.56, 4);
  hullGeometry.rotateZ(-Math.PI / 2);
  const hull = new THREE.Mesh(hullGeometry, bodyPrimary);
  hull.name = 'hull';
  group.add(hull);

  // Swept wings — two flat triangles in the ground plane, symmetric about the
  // hull, trailing toward the tail so the arrow silhouette sweeps back.
  const wingGeometries: THREE.ShapeGeometry[] = [];
  const makeWing = (side: 1 | -1): THREE.Mesh => {
    const shape = new THREE.Shape();
    shape.moveTo(0.05, 0);
    shape.lineTo(-0.24, side * 0.26);
    shape.lineTo(-0.32, side * 0.22);
    shape.closePath();
    const geometry = new THREE.ShapeGeometry(shape);
    geometry.rotateX(-Math.PI / 2);
    wingGeometries.push(geometry);
    const wing = new THREE.Mesh(geometry, bodyPrimary);
    wing.position.set(0.02, 0.02, 0);
    wing.name = side === 1 ? 'wingLeft' : 'wingRight';
    return wing;
  };
  const wingLeft = makeWing(1);
  const wingRight = makeWing(-1);
  group.add(wingLeft, wingRight);

  // Cockpit — a small glass dome near the nose.
  const cockpitGeometry = new THREE.SphereGeometry(0.055, 12, 8);
  const cockpit = new THREE.Mesh(cockpitGeometry, glassMaterial);
  cockpit.position.set(0.16, 0.1, 0);
  cockpit.name = 'cockpitGlass';
  group.add(cockpit);

  // Twin engine pods — nozzles at the tail, emissive glow ramps on dash.
  const engineGeometry = new THREE.CylinderGeometry(0.03, 0.045, 0.1, 8);
  engineGeometry.rotateZ(Math.PI / 2);
  const engineLeft = new THREE.Mesh(engineGeometry, engineMaterial);
  engineLeft.position.set(-0.2, 0.06, 0.12);
  engineLeft.name = 'engineLeft';
  const engineRight = new THREE.Mesh(engineGeometry, engineMaterial);
  engineRight.position.set(-0.2, 0.06, -0.12);
  engineRight.name = 'engineRight';
  group.add(engineLeft, engineRight);

  // Emissive trim — a thin spine so the hero keeps its neon identity in bloom.
  const trimGeometry = new THREE.BoxGeometry(0.4, 0.03, 0.03);
  const trim = new THREE.Mesh(trimGeometry, trimMaterial);
  trim.position.set(-0.02, 0.09, 0);
  trim.name = 'trim';
  group.add(trim);

  return {
    group,
    bodyMaterials: [bodyPrimary],
    engineMaterials: [engineMaterial],
    dispose(): void {
      hullGeometry.dispose();
      for (const wingGeometry of wingGeometries) wingGeometry.dispose();
      cockpitGeometry.dispose();
      engineGeometry.dispose();
      trimGeometry.dispose();
      bodyPrimary.dispose();
      glassMaterial.dispose();
      engineMaterial.dispose();
      trimMaterial.dispose();
    },
  };
}

export function createActors(): Actors {
  const group = new THREE.Group();
  const tweens = createTweenManager();

  const kit = buildPlayerKit();
  const player = kit.group;
  group.add(player);

  const playerRingGeometry = new THREE.RingGeometry(0.3, 0.36, 32);
  const playerRingMaterial = new THREE.MeshBasicMaterial({
    color: PLAYER_COLOR,
    transparent: true,
    opacity: 0.55,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const playerRing = new THREE.Mesh(playerRingGeometry, playerRingMaterial);
  playerRing.rotation.x = -Math.PI / 2;
  playerRing.position.y = 0.03;
  group.add(playerRing);

  const shardGeometries: Record<ShardKind, THREE.BufferGeometry> = {
    standard: new THREE.TetrahedronGeometry(SHARD_RADIUS, 0),
    splitter: new THREE.TetrahedronGeometry(SHARD_RADIUS, 0),
    mini: new THREE.TetrahedronGeometry(SHARD_RADIUS, 0),
    heart: createHeartGeometry(),
    shielded: new THREE.OctahedronGeometry(SHARD_RADIUS * 0.92, 0),
    pulsar: new THREE.IcosahedronGeometry(SHARD_RADIUS * 1.05, 0),
  };
  /** Per-kind finish: roughness/metalness for the crystalline shards. */
  const KIND_FINISH: Record<ShardKind, { roughness: number; metalness: number; emissiveIntensity: number }> = {
    standard: { roughness: 0.32, metalness: 0.6, emissiveIntensity: 0.22 },
    splitter: { roughness: 0.28, metalness: 0.68, emissiveIntensity: 0.2 },
    mini: { roughness: 0.3, metalness: 0.62, emissiveIntensity: 0.26 },
    heart: { roughness: 0.5, metalness: 0.4, emissiveIntensity: 0.42 },
    shielded: { roughness: 0.3, metalness: 0.7, emissiveIntensity: 0.18 },
    pulsar: { roughness: 0.34, metalness: 0.58, emissiveIntensity: 0.24 },
  };
  const makeShardMaterial = (color: THREE.ColorRepresentation): THREE.MeshStandardMaterial => {
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.32,
      metalness: 0.6,
      emissive: color,
      emissiveIntensity: 0.22,
    });
    return material;
  };
  const standardMaterials = STANDARD_VARIANTS.map((color) => makeShardMaterial(color));
  const kindMaterials = Object.fromEntries(
    (Object.keys(SHARD_KIND_COLORS) as ShardKind[]).map((kind) => {
      const finish = KIND_FINISH[kind];
      const material = new THREE.MeshStandardMaterial({
        color: SHARD_KIND_COLORS[kind],
        roughness: finish.roughness,
        metalness: finish.metalness,
        emissive: SHARD_KIND_COLORS[kind],
        emissiveIntensity: finish.emissiveIntensity,
        transparent: kind === 'heart',
        opacity: kind === 'heart' ? 0.9 : 1,
        // The heart token is flat and face-up; seen from above it must read
        // from either lobe orientation as it spins.
        side: kind === 'heart' ? THREE.DoubleSide : THREE.FrontSide,
      });
      return [kind, material];
    }),
  ) as Record<ShardKind, THREE.MeshStandardMaterial>;
  const materialFor = (kind: ShardKind, variant: number): THREE.MeshStandardMaterial =>
    kind === 'standard' ? (standardMaterials[variant % standardMaterials.length] as THREE.MeshStandardMaterial) : kindMaterials[kind];

  const shards: THREE.Mesh[] = [];
  for (let index = 0; index < SHARD_POOL; index += 1) {
    const mesh = new THREE.Mesh(shardGeometries.standard, kindMaterials.standard);
    mesh.visible = false;
    mesh.position.y = 0.22;
    shards.push(mesh);
    group.add(mesh);
  }

  // A telegraph ring rides each pooled shard, shown only on pulsars: it grows
  // and brightens as the pulse charges, then a wave fire resets it.
  const pulseRingGeometry = new THREE.RingGeometry(0.62, 0.7, 40);
  const pulseRings: THREE.Mesh[] = [];
  for (let index = 0; index < SHARD_POOL; index += 1) {
    const material = new THREE.MeshBasicMaterial({
      color: SHARD_KIND_COLORS.pulsar,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    const ring = new THREE.Mesh(pulseRingGeometry, material);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.3;
    ring.visible = false;
    pulseRings.push(ring);
    group.add(ring);
  }

  const dashColor = new THREE.Color(DASH_COLOR);
  const playerBase = new THREE.Color(PLAYER_COLOR);
  const ghostBase = new THREE.Color(GHOST_COLOR);
  const knockColor = new THREE.Color(0xff4d4d);

  // Feedback pulse scalars written by the tween manager; `update` multiplies
  // them into the state-driven pose so they never fight the rules readings.
  const feelScale = { value: 1 };
  const knockFlash = { value: 0 };

  return {
    group,
    handle(events: readonly ArcadeEvent[]): void {
      for (const event of events) {
        if (event.type === 'dash.start') {
          tweens.cancel('squash');
          tweens.cancel('squash-settle');
          tweens.tween(
            'stretch',
            0.07,
            (value) => {
              feelScale.value = 1 + 0.4 * value;
            },
            easeOutCubic,
            () => {
              tweens.tween(
                'stretch-settle',
                0.16,
                (value) => {
                  feelScale.value = 1 + 0.4 * (1 - value);
                },
                easeOutBack,
              );
            },
          );
        } else if (event.type === 'player.knockback') {
          tweens.cancel('stretch');
          tweens.cancel('stretch-settle');
          knockFlash.value = 1;
          tweens.tween(
            'knock-flash',
            0.24,
            (value) => {
              knockFlash.value = 1 - value;
            },
            easeOutCubic,
          );
          tweens.tween(
            'squash',
            0.06,
            (value) => {
              feelScale.value = 1 - 0.14 * value;
            },
            easeOutCubic,
            () => {
              tweens.tween(
                'squash-settle',
                0.16,
                (value) => {
                  feelScale.value = 1 - 0.14 * (1 - value);
                },
                easeOutBack,
              );
            },
          );
        }
      }
    },
    update(world: WorldState, timeSec: number, dtSec: number, reducedMotion: boolean): void {
      tweens.update(dtSec);
      const { player: state } = world;
      player.position.set(sceneX(state.pos.x), 0.28, sceneZ(state.pos.y));
      playerRing.position.set(sceneX(state.pos.x), 0.03, sceneZ(state.pos.y));

      const dir = state.dashTime > 0 ? state.dashDir : state.facing;
      player.rotation.y = Math.atan2(-dir.y, dir.x);
      playerRing.rotation.z = reducedMotion ? 0 : timeSec * 1.4;

      const dashing = state.dashTime > 0;
      const knocked = state.stun > 0;
      const baseColor = world.ghostDriving ? ghostBase : playerBase;
      for (const material of kit.bodyMaterials) {
        material.color.copy(baseColor);
        if (dashing) material.color.lerp(dashColor, 0.7);
        if (knockFlash.value > 0 && !reducedMotion) material.color.lerp(knockColor, knockFlash.value);
      }
      playerRingMaterial.color.copy(baseColor);

      // The thruster cue: engines bloom on dash and cool while stunned or
      // drifting; knockback also forces the glow hot, never off.
      const engineHeat = dashing ? 1.9 : knocked || knockFlash.value > 0 ? 1.15 : 0.7;
      for (const material of kit.engineMaterials) {
        material.emissiveIntensity = engineHeat;
        if (dashing) material.color.lerp(dashColor, 0.5);
      }

      // The dash stretch is tween-owned (1 -> overshoot -> settle); only the
      // knockback squat stays state-driven so stunned reads stay honest.
      const feel = reducedMotion ? 1 : feelScale.value;
      const knockScale = knocked ? 0.8 : 1;
      player.scale.setScalar(knockScale * feel);
      playerRing.scale.setScalar(feel);

      const blink =
        state.invuln > 0 && state.stun <= 0 && !reducedMotion
          ? Math.floor(state.invuln * 14) % 2 === 0
          : false;
      player.visible = !blink;
      playerRing.visible = !blink;
      playerRingMaterial.opacity = world.ghostDriving ? 0.3 : 0.55;

      for (let index = 0; index < shards.length; index += 1) {
        const mesh = shards[index] as THREE.Mesh;
        const shard = world.shards[index];
        if (!shard) {
          mesh.visible = false;
          continue;
        }
        mesh.visible = true;
        mesh.geometry = shardGeometries[shard.kind];
        mesh.material = materialFor(shard.kind, shard.variant);
        mesh.position.set(sceneX(shard.pos.x), 0.22, sceneZ(shard.pos.y));
        // The heart token spins flat on its face so the reward silhouette
        // stays readable; the threat polyhedra tumble in place.
        if (shard.kind === 'heart' && !reducedMotion) {
          mesh.rotation.x = 0;
          mesh.rotation.y = timeSec * 1.3;
        } else if (shard.kind === 'heart') {
          mesh.rotation.x = 0.25;
          mesh.rotation.y = 0.3;
        } else {
          mesh.rotation.x = reducedMotion ? 0.6 : timeSec * 1.1 + index;
          mesh.rotation.y = reducedMotion ? 0.2 : timeSec * 1.7 + index * 0.5;
        }
        const scale =
          shard.kind === 'mini'
            ? MINI_SCALE
            : shard.kind === 'heart'
              ? HEART_PULSE +
                (reducedMotion ? 0 : Math.sin(timeSec * 5 + index * 0.8) * 0.08)
              : shard.kind === 'shielded'
                ? 1.12
                : shard.kind === 'pulsar'
                  ? PULSAR_SCALE
                  : shard.drifter
                    ? 1.15
                    : 1;
        mesh.scale.setScalar(scale);

        const ring = pulseRings[index] as THREE.Mesh;
        if (ring && shard.kind === 'pulsar') {
          ring.visible = true;
          ring.position.set(sceneX(shard.pos.x), 0.3, sceneZ(shard.pos.y));
          const rawTelegraph = 1 - shard.pulseTimer / TUNING.pulseCooldownSec;
          const telegraph = reducedMotion ? 0.5 : Math.max(0, Math.min(1, rawTelegraph));
          ring.scale.setScalar(1 + telegraph * 0.55);
          const ringMaterial = ring.material as THREE.MeshBasicMaterial;
          ringMaterial.opacity = 0.12 + telegraph * 0.5;
          ringMaterial.color.setHex(SHARD_KIND_COLORS.pulsar).lerp(PULSAR_HOT, telegraph);
          const hot = 1 + telegraph * 0.1;
          mesh.scale.setScalar(PULSAR_SCALE * hot);
          (mesh.material as THREE.MeshBasicMaterial).color
            .setHex(SHARD_KIND_COLORS.pulsar)
            .lerp(PULSAR_HOT, telegraph * 0.55);
        } else if (ring) {
          ring.visible = false;
        }
      }
    },
    dispose(): void {
      kit.dispose();
      playerRingGeometry.dispose();
      playerRingMaterial.dispose();
      pulseRingGeometry.dispose();
      for (const ring of pulseRings) (ring.material as THREE.Material).dispose();
      for (const geometry of Object.values(shardGeometries)) geometry.dispose();
      for (const material of standardMaterials) material.dispose();
      for (const material of Object.values(kindMaterials)) material.dispose();
    },
  };
}