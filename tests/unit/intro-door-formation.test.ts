import assert from 'node:assert/strict';
import test from 'node:test';
import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { DoorFormation } from '../../src/intro/DoorFormation';

test('primitive handoff is reversible without changing imported transforms', () => {
  const root = new Group();
  const node = new Group();
  node.name = 'Example_Runtime';
  node.position.set(1, 2, 3);
  const body = new Mesh(new BoxGeometry(1, 2, 0.2), new MeshStandardMaterial());
  node.add(body); root.add(node);
  const formation = new DoorFormation();
  formation.init(root);
  formation.update(0);
  assert.equal(body.visible, false);
  assert.ok(formation.getState().visibleSeeds > 0);
  formation.update(1);
  assert.equal(body.visible, true);
  assert.equal(formation.getState().visibleSeeds, 0);
  assert.equal(body.material.opacity, 1);
  assert.deepEqual(node.position.toArray(), [1, 2, 3]);
  formation.update(0);
  assert.equal(body.visible, false);
  assert.ok(formation.getState().visibleSeeds > 0);
  formation.destroy();
  assert.deepEqual(root.children, [node]);
  body.geometry.dispose(); body.material.dispose();
});
