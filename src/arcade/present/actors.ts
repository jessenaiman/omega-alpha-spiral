/**
 * Spiral Breaker — the actors.
 *
 * One pooled mesh per shard and a single player body. Everything is
 * `MeshBasicMaterial` with `toneMapped: false` so the bloom pass, not the tone
 * mapper, decides how bright a thing looks. The pool is allocated once and
 * only toggled afterwards; the render loop allocates nothing.
 */

import * as THREE from 'three';
import type { ShardKind, WorldState } from '../game';
import { sceneX, sceneZ } from './scale';

export interface Actors {
  readonly group: THREE.Group;
  update(world: WorldState, timeSec: number, reducedMotion: boolean): void;
  dispose(): void;
}

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
};
const STANDARD_VARIANTS = [0xff6fd8, 0xffd166, 0x8affc1];
const MINI_SCALE = 0.7;
const HEART_PULSE = 1.18;

export function createActors(): Actors {
  const group = new THREE.Group();

  const playerGeometry = new THREE.ConeGeometry(0.26, 0.62, 3);
  const playerMaterial = new THREE.MeshBasicMaterial({ color: PLAYER_COLOR, toneMapped: false });
  const player = new THREE.Mesh(playerGeometry, playerMaterial);
  player.rotation.z = -Math.PI / 2;
  player.position.y = 0.28;
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
    heart: new THREE.IcosahedronGeometry(SHARD_RADIUS * 0.85, 0),
    shielded: new THREE.OctahedronGeometry(SHARD_RADIUS * 0.92, 0),
  };
  const standardMaterials = STANDARD_VARIANTS.map(
    (color) => new THREE.MeshBasicMaterial({ color, toneMapped: false }),
  );
  const kindMaterials = Object.fromEntries(
    (Object.keys(SHARD_KIND_COLORS) as ShardKind[]).map((kind) => [
      kind,
      new THREE.MeshBasicMaterial({ color: SHARD_KIND_COLORS[kind], toneMapped: false, transparent: kind === 'heart', opacity: kind === 'heart' ? 0.85 : 1 }),
    ]),
  ) as Record<ShardKind, THREE.MeshBasicMaterial>;
  const materialFor = (kind: ShardKind, variant: number): THREE.MeshBasicMaterial =>
    kind === 'standard' ? (standardMaterials[variant % standardMaterials.length] as THREE.MeshBasicMaterial) : kindMaterials[kind];

  const shards: THREE.Mesh[] = [];
  for (let index = 0; index < SHARD_POOL; index += 1) {
    const mesh = new THREE.Mesh(shardGeometries.standard, kindMaterials.standard);
    mesh.visible = false;
    mesh.position.y = 0.22;
    shards.push(mesh);
    group.add(mesh);
  }

  const dashColor = new THREE.Color(DASH_COLOR);
  const playerBase = new THREE.Color(PLAYER_COLOR);
  const ghostBase = new THREE.Color(GHOST_COLOR);

  return {
    group,
    update(world: WorldState, timeSec: number, reducedMotion: boolean): void {
      const { player: state } = world;
      player.position.set(sceneX(state.pos.x), 0.28, sceneZ(state.pos.y));
      playerRing.position.set(sceneX(state.pos.x), 0.03, sceneZ(state.pos.y));

      const dir = state.dashTime > 0 ? state.dashDir : state.facing;
      player.rotation.y = Math.atan2(-dir.y, dir.x);
      playerRing.rotation.z = reducedMotion ? 0 : timeSec * 1.4;

      const dashing = state.dashTime > 0;
      const knocked = state.stun > 0;
      playerMaterial.color.copy(world.ghostDriving ? ghostBase : playerBase);
      if (dashing) playerMaterial.color.lerp(dashColor, 0.7);
      playerRingMaterial.color.copy(playerMaterial.color);

      const dashScale = dashing ? 1.35 : 1;
      const knockScale = knocked ? 0.8 : 1;
      player.scale.setScalar(dashScale * knockScale);
      playerRing.scale.setScalar(dashScale);

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
        mesh.rotation.x = reducedMotion ? 0.6 : timeSec * 1.1 + index;
        mesh.rotation.y = reducedMotion ? 0.2 : timeSec * 1.7 + index * 0.5;
        const scale =
          shard.kind === 'mini'
            ? MINI_SCALE
            : shard.kind === 'heart'
              ? HEART_PULSE +
                (reducedMotion ? 0 : Math.sin(timeSec * 5 + index * 0.8) * 0.08)
              : shard.kind === 'shielded'
                ? 1.12
                : shard.drifter
                  ? 1.15
                  : 1;
        mesh.scale.setScalar(scale);
      }
    },
    dispose(): void {
      playerGeometry.dispose();
      playerMaterial.dispose();
      playerRingGeometry.dispose();
      playerRingMaterial.dispose();
      for (const geometry of Object.values(shardGeometries)) geometry.dispose();
      for (const material of standardMaterials) material.dispose();
      for (const material of Object.values(kindMaterials)) material.dispose();
    },
  };
}
