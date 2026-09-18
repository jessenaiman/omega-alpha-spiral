/**
 * Spiral Breaker — the authored hero kit and heart reward, proven without a
 * browser. The kit must expose its named parts, share its materials, and
 * release every resource on dispose; the heart must be a flat face-up token
 * that fits the shard cell; the dash meter helper must clamp to the ready
 * fraction it feeds the HUD.
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';

import {
  buildPlayerKit,
  createHeartGeometry,
  PLAYER_KIT_CHILD_NAMES,
} from '../../src/arcade/present/actors';
import { dashCharge } from '../../src/arcade/ui/hud';

test('the player kit exposes every authored part as a named child', () => {
  const kit = buildPlayerKit();
  assert.ok(kit.group instanceof THREE.Group);
  assert.deepEqual(
    new Set(kit.group.children.map((child) => child.name)),
    new Set(PLAYER_KIT_CHILD_NAMES),
  );
  kit.dispose();
});

test('the kit shares its shell and engine materials across the parts', () => {
  const kit = buildPlayerKit();
  assert.equal(kit.bodyMaterials.length, 1);
  assert.equal(kit.engineMaterials.length, 1);
  const byName = new Map(kit.group.children.map((child) => [child.name, child]));
  assert.equal((byName.get('hull') as THREE.Mesh).material, kit.bodyMaterials[0]);
  assert.equal((byName.get('wingLeft') as THREE.Mesh).material, kit.bodyMaterials[0]);
  assert.equal((byName.get('wingRight') as THREE.Mesh).material, kit.bodyMaterials[0]);
  assert.equal((byName.get('engineLeft') as THREE.Mesh).material, kit.engineMaterials[0]);
  assert.equal((byName.get('engineRight') as THREE.Mesh).material, kit.engineMaterials[0]);
  kit.dispose();
});

test('dispose releases every kit geometry and material exactly once', () => {
  const kit = buildPlayerKit();
  const disposables: THREE.EventDispatcher[] = [];
  kit.group.traverse((object) => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) disposables.push(mesh.geometry);
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) if (material) disposables.push(material);
  });
  const unique = new Set(disposables);
  let fired = 0;
  for (const target of unique) {
    (target as unknown as { addEventListener(type: string, listener: () => void): void }).addEventListener(
      'dispose',
      () => fired++,
    );
  }
  kit.dispose();
  assert.equal(fired, unique.size);
});

test('the heart reward is a flat face-up token that fits the shard cell', () => {
  const geometry = createHeartGeometry();
  assert.ok(geometry instanceof THREE.ExtrudeGeometry);
  const position = geometry.getAttribute('position');
  assert.ok(position && position.count > 0);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox;
  assert.ok(box, 'heart geometry has a bounding box');
  const xs = box.max.x - box.min.x;
  const ys = box.max.y - box.min.y;
  const zs = box.max.z - box.min.z;
  assert.ok(xs > 0.2 && xs < 0.4, `heart is shard-sized across x (${xs})`);
  assert.ok(zs > 0.2 && zs < 0.4, `heart is shard-sized across z (${zs})`);
  assert.ok(ys < 0.12, `heart stays flat across the up axis (${ys})`);
  assert.ok(ys < xs * 0.25, 'the heart reads as a silhouette, not a blob');
});

test('dashCharge maps the wait to a ready fraction and clamps', () => {
  assert.equal(dashCharge(0, 0.4), 1);
  assert.equal(dashCharge(0.2, 0.4), 0.5);
  assert.equal(dashCharge(0.4, 0.4), 0);
  assert.equal(dashCharge(0.8, 0.4), 0);
  assert.equal(dashCharge(-0.1, 0.4), 1);
  assert.equal(dashCharge(0.1, 0), 1);
});