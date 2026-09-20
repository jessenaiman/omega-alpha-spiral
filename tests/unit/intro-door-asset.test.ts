import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

interface GlbIndex { nodes?: { name?: string }[]; animations?: unknown[] }

test('runtime door asset is a valid animated glTF', () => {
  const bytes: Buffer = readFileSync(new URL('../../assets/intro/threshold-runtime/threshold.glb', import.meta.url));
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.toString('ascii', 16, 20), 'JSON');
  // This is the validated GLB JSON chunk, not an imported runtime object.
  const index = JSON.parse(bytes.toString('utf8', 20, 20 + bytes.readUInt32LE(12))) as GlbIndex;
  assert.ok(index.nodes?.length);
  assert.ok(index.animations?.length);
});
