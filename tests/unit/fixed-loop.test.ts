import assert from 'node:assert/strict';
import test from 'node:test';

import { FixedLoop } from '../../src/core/FixedLoop';

type FrameCallback = (nowMs: number) => void;

function scheduler() {
  let nextId = 0;
  const pending = new Map<number, FrameCallback>();
  const cancelled: number[] = [];

  return {
    request(callback: FrameCallback): number {
      const id = ++nextId;
      pending.set(id, callback);
      return id;
    },
    cancel(id: number): void {
      cancelled.push(id);
      pending.delete(id);
    },
    advance(nowMs: number): void {
      const entry = pending.entries().next().value as [number, FrameCallback] | undefined;
      assert.ok(entry, 'expected one scheduled animation frame');
      pending.delete(entry[0]);
      entry[1](nowMs);
    },
    get pendingCount(): number {
      return pending.size;
    },
    cancelled,
  };
}

test('runs at most five fixed updates for a 100 ms frame and renders once', () => {
  const frames = scheduler();
  const updates: number[] = [];
  const renders: number[] = [];
  const loop = new FixedLoop(
    (dt) => updates.push(dt),
    (alpha) => renders.push(alpha),
    frames.request,
    frames.cancel,
  );

  loop.start();
  frames.advance(1_000);
  updates.length = 0;
  renders.length = 0;
  frames.advance(1_100);

  assert.deepEqual(updates, Array(5).fill(1 / 60));
  assert.equal(renders.length, 1);
  assert.equal(frames.pendingCount, 1);
});

test('clamps a tab-resume delta to 100 ms', () => {
  const frames = scheduler();
  let updates = 0;
  const loop = new FixedLoop(
    () => { updates += 1; },
    () => undefined,
    frames.request,
    frames.cancel,
  );

  loop.start();
  frames.advance(500);
  frames.advance(10_500);

  assert.equal(updates, 5);
});

test('start owns one RAF chain and stop cancels it', () => {
  const frames = scheduler();
  const loop = new FixedLoop(
    () => undefined,
    () => undefined,
    frames.request,
    frames.cancel,
  );

  loop.start();
  loop.start();
  assert.equal(frames.pendingCount, 1);

  frames.advance(1_000);
  assert.equal(frames.pendingCount, 1);
  loop.stop();
  assert.equal(frames.pendingCount, 0);
  assert.equal(frames.cancelled.length, 1);
});

test('reentrant stop and start preserve one cancellable RAF chain', () => {
  const frames = scheduler();
  let restarted = false;
  let loop: FixedLoop;
  loop = new FixedLoop(
    () => undefined,
    () => {
      if (restarted) return;
      restarted = true;
      loop.stop();
      loop.start();
    },
    frames.request,
    frames.cancel,
  );

  loop.start();
  frames.advance(1_000);
  assert.equal(frames.pendingCount, 1);

  loop.stop();
  assert.equal(frames.pendingCount, 0);
});

test('restart treats its first frame as a new timing baseline', () => {
  const frames = scheduler();
  let updates = 0;
  const loop = new FixedLoop(
    () => { updates += 1; },
    () => undefined,
    frames.request,
    frames.cancel,
  );

  loop.start();
  frames.advance(1_000);
  loop.stop();
  loop.start();
  frames.advance(20_000);

  assert.equal(updates, 0);
});
