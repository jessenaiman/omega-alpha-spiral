import assert from "node:assert/strict";
import test from "node:test";
import { WalkField } from "../../src/chapter-two/WalkField";
import type { ObjectKind } from "../../src/chapter-two/rooms";

function crossSelectedExit(field: WalkField): void {
  const selected = field.selected;
  assert.ok(selected);
  const fromRoomIndex = field.roomIndex;
  field.player = { x: selected.x, z: selected.z + 1 };
  field.update(0.1, 0, -1);
  const signal = field.consumeTransitionSignal();
  assert.ok(signal);
  assert.equal(signal.fromRoomIndex, fromRoomIndex);
  assert.equal(signal.toRoomIndex, fromRoomIndex + 1);
  assert.equal(signal.object, selected.kind);
}

test("walk field measures actual movement, clamps boundaries, and resets", () => {
  const field = new WalkField();
  field.start("thread-a");
  const before = { ...field.player };
  field.update(0.1, 1, -1);
  assert.ok(field.player.x > before.x);
  assert.ok(field.player.z < before.z);
  assert.equal(field.framesAdvanced, 1);
  assert.ok(field.distanceTravelled > 0);
  for (let i = 0; i < 1000; i += 1) field.update(0.1, 1, 0);
  assert.ok(field.player.x <= field.boundary);
  const distance = field.distanceTravelled;
  field.update(0.1, 1, 0);
  assert.equal(field.distanceTravelled, distance);
  field.update(Number.NaN, 1, 1);
  assert.ok(Number.isFinite(field.player.x));
  field.start("thread-b");
  assert.deepEqual(field.player, before);
  assert.equal(field.distanceTravelled, 0);
  assert.equal(field.framesAdvanced, 0);
  assert.equal(field.thread, "thread-b");
});

test("an encounter requires proximity and records one decision before the next room", () => {
  const field = new WalkField();
  field.start("thread-a");
  assert.equal(field.interact(), false);
  const door = field.objects.find((object) => object.kind === "door");
  assert.ok(door);
  field.player = { x: door.x, z: door.z + 2 };
  assert.equal(field.interact(), true);
  assert.equal(field.phase, "prompt");
  assert.equal(field.answer(""), false);
  assert.equal(field.answer("neutral answer"), true);
  assert.equal(field.choices.length, 1);
  assert.equal(field.answer("duplicate"), false);
  assert.equal(field.choices.length, 1);
  assert.equal(field.choices[0].answer, "neutral answer");
  assert.equal(field.phase, "result");
  field.continue();
  assert.equal(field.phase, "result");
  assert.equal(field.roomIndex, 0);
  crossSelectedExit(field);
  assert.equal(field.roomIndex, 1);
  assert.equal(field.phase, "exploring");
  assert.deepEqual(field.player, field.activeRoom.heroStart);
});

function finishRooms(thread: string, kinds: ObjectKind[]): WalkField {
  const field = new WalkField();
  field.start(thread);
  for (const kind of kinds) {
    const object = field.objects.find((item) => item.kind === kind);
    assert.ok(object);
    field.player = { x: object.x, z: object.z + 2 };
    assert.equal(field.interact(), true);
    if (kind === "door") field.answer("Remembered");
    if (kind === "monster")
      for (let i = 0; i < 20; i += 1) field.update(0.1, 0, 0);
    assert.equal(field.phase, "result");
    crossSelectedExit(field);
  }
  assert.equal(field.phase, "complete");
  return field;
}

test("owner-matched choices earn two points and cross-aligned choices one", () => {
  const field = finishRooms("thread-a", ["door", "monster", "chest"]);
  assert.deepEqual(
    field.choices.map((choice) => choice.points),
    [2, 1, 1]
  );
  assert.ok(field.choices.every((choice) => choice.points >= 1));
  assert.notEqual(field.guide, null);
});

test("a tied guide prefers the originating thread, with deterministic fallback", () => {
  const first = finishRooms("", ["door", "door", "door"]);
  const second = finishRooms("", ["door", "door", "door"]);
  assert.deepEqual(
    first.choices.map((choice) => choice.points),
    [2, 2, 2]
  );
  assert.notEqual(first.guide, null);
  assert.equal(first.guide, second.guide);
});
