import assert from 'node:assert/strict';
import test from 'node:test';
import { createEcho, createWolf, createGiggleChest } from '../../src/chapter-two/modelFactories';

test('hero silhouette is authored, not a box stack', () => {
  const echo = createEcho();
  const names: string[] = [];
  echo.root.traverse((object): void => { names.push(object.name); });
  // Named joints/material zones exist so state cues and walk can drive them.
  for (const expected of ['torso', 'head', 'shoulderL', 'shoulderR', 'hipL', 'hipR']) assert.ok(names.includes(expected), `missing ${expected}`);
  assert.ok(echo.collision, 'hero ships a collision proxy separate from the visual group');
  // Visual detail lives outside the collision capsule: torso gives real volume.
  assert.ok(echo.diagnostics.meshes >= 5, `expected authored parts, got ${echo.diagnostics.meshes}`);
  assert.ok(echo.diagnostics.materials >= 3, 'distinct material roles (fabric/armor/visor) expected');
});

test('wolf is a distinct predator silhouette with a telegraph, not a recolored cube', () => {
  const wolf = createWolf();
  const names: string[] = [];
  wolf.root.traverse((object): void => { names.push(object.name); });
  assert.ok(names.includes('wolfBody'));
  assert.ok(names.includes('attackTelegraph'), 'attack telegraph socket exists');
  for (const leg of ['legFrontL', 'legFrontR', 'legBackL', 'legBackR']) assert.ok(names.some((name): boolean => name.startsWith(leg)), `missing ${leg}`);
  assert.ok(wolf.diagnostics.meshes >= 6);
});

test('giggle chest carries a real hinge lid and interior glow seam', () => {
  const chest = createGiggleChest();
  const names: string[] = [];
  chest.root.traverse((object): void => { names.push(object.name); });
  assert.ok(names.includes('lidPivot'), 'lid is a movable group, not baked closed');
  assert.ok(names.includes('secretSeam'), 'interior glow seam exists');
  assert.ok(chest.diagnostics.meshes >= 6, 'authored brackets and panels expected');
});
