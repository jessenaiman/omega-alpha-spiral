import assert from 'node:assert/strict';
import test from 'node:test';
import { FORMATION_DURATION_MS, StoryController } from '../../src/intro/StoryController';

test('the floating beginning waits indefinitely for the player, not a timeout', () => {
  const story = new StoryController('472');
  story.advance(120_000);
  assert.equal(story.frame.phase, 'cursor');
  assert.equal(story.frame.transcript, '');
  assert.equal(story.elapsedMs, 0);
  assert.equal(story.formationMs, 0);
  assert.equal(story.ambientMs, 120_000);
  story.start();
  assert.equal(story.isStarted, true);
});

test('input gates, progression, door traversal and reset work independently of story content', () => {
    const story = new StoryController('472');
    assert.equal(story.choose(0), false, 'Cannot answer before the opening starts');
    story.start();
    let inputs: number = 0;
    // Follow runtime gates, not a prescribed number or order of narrative beats.
    story.advance(Number.MAX_SAFE_INTEGER);
    while (story.frame.phase === 'waiting') {
      const held = { frame: story.frame, elapsed: story.elapsedMs, formation: story.formationMs };
      story.advance(600_000);
      assert.equal(story.frame, held.frame);
      assert.equal(story.elapsedMs, held.elapsed);
      assert.equal(story.formationMs, held.formation);
      assert.equal(story.choose(0), true);
      inputs += 1;
      assert.equal(story.choose(0), false, 'Double press must not answer the next question');
      story.advance(Number.MAX_SAFE_INTEGER);
    }
    assert.equal(story.answers.length, inputs);
    assert.equal(story.frame.phase, 'final');
    assert.equal(story.enterDoor(), false, 'Door cannot be entered while still forming');
    story.advance(FORMATION_DURATION_MS);
    assert.equal(story.frame.phase, 'doorway');
    assert.equal(story.enterDoor(), true);
    story.advance(20_000);
    assert.equal(story.frame.phase, 'complete');
    assert.ok(story.cameraZ < -3, 'The camera actually crosses the door plane');
    story.reset();
    assert.equal(story.frame.phase, 'cursor');
    assert.equal(story.answers.length, 0);
    assert.equal(story.formationMs, 0);
    assert.equal(story.cameraZ, 10);
});
