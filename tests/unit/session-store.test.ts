import assert from 'node:assert/strict';
import test from 'node:test';
import { loadLineage, saveLineage } from '../../src/game/session-store.js';

class MapStorage implements Storage {
  readonly #values = new Map<string, string>();

  get length(): number {
    return this.#values.size;
  }

  clear(): void {
    this.#values.clear();
  }

  getItem(key: string): string | null {
    return this.#values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.#values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.#values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.#values.set(key, value);
  }
}

test('lineage uses one three-digit base and preserves loop count', () => {
  const storage = new MapStorage();
  const first = loadLineage(storage, () => 0.413);
  assert.deepEqual(first, { baseInstanceId: 471, loopCount: 0 });
  saveLineage(storage, { baseInstanceId: 471, loopCount: 2 });
  assert.deepEqual(loadLineage(storage, () => 0.999), { baseInstanceId: 471, loopCount: 2 });
});

test('malformed lineage is replaced with a fresh value', () => {
  const malformedValues = [
    'not json',
    '{}',
    '{"baseInstanceId":99,"loopCount":0}',
    '{"baseInstanceId":1000,"loopCount":0}',
    '{"baseInstanceId":471.5,"loopCount":0}',
    '{"baseInstanceId":471,"loopCount":-1}',
    '{"baseInstanceId":471,"loopCount":1.5}',
  ];

  for (const malformed of malformedValues) {
    const storage = new MapStorage();
    storage.setItem('omega-spiral.lineage.v1', malformed);
    assert.deepEqual(loadLineage(storage, () => 0), { baseInstanceId: 100, loopCount: 0 });
    assert.equal(storage.getItem('omega-spiral.lineage.v1'), '{"baseInstanceId":100,"loopCount":0}');
  }
});

test('fresh lineage maps the random source to the inclusive three-digit range', () => {
  assert.deepEqual(loadLineage(new MapStorage(), () => 0), { baseInstanceId: 100, loopCount: 0 });
  assert.deepEqual(loadLineage(new MapStorage(), () => 0.999999), { baseInstanceId: 999, loopCount: 0 });
});
