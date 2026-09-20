import assert from 'node:assert/strict';
import test from 'node:test';
import { createBootFrames } from '../../src/intro/ghostwriting';

const QUESTION: string = 'If you could be only one story..:\nwho would you be?';

test('ghostwriting processes a scrolling transcript with temporary corruption before the question', () => {
  const frames = createBootFrames('472');
  assert.deepEqual(frames, createBootFrames('472'));
  assert.equal(frames[0].phase, 'cursor');
  assert.ok(frames.some((frame) => 'transcript' in frame && String(frame.transcript).includes('retry.')), 'Missing processed transcript');
  assert.ok(frames.some((frame) => 'isCorrupt' in frame && frame.isCorrupt === true), 'Missing temporary corrupted output');
  const last = frames[frames.length - 1];
  assert.equal(last.question, QUESTION);
  assert.ok(last.prelude.includes('ECHO ARCHIVE REACTIVATED'));
  assert.equal(last.phase, 'waiting');
  assert.ok(last.at >= 22000, 'The machine must hesitate and process, not dump the question');
  assert.ok(last.at < 40000, 'Keep this opening increment bounded');
  for (let index: number = 1; index < frames.length; index += 1) {
    assert.ok(frames[index].at > frames[index - 1].at, 'Frames must have strictly increasing times');
  }
});

test('cursor boots the script before voices load; question remains ambiguous for ten seconds', () => {
  const frames = createBootFrames('472');
  const commandIndex = frames.findIndex((frame) => frame.transcript.includes('/run omega.sh'));
  const voicesIndex = frames.findIndex((frame) => frame.transcript.includes('dreamweaver'));
  assert.ok(commandIndex >= 0, 'Boot must type /run omega.sh');
  assert.ok(voicesIndex > commandIndex, 'Voices must load after the command');
  assert.ok(frames.filter((frame) => frame.at < 10000).every((frame) => frame.question === ''));
  assert.ok(frames.some((frame, index) => index > 0 && frame.question.length < frames[index - 1].question.length), 'The question must erase and retry');
  assert.ok(frames.filter((frame) => frame.isCorrupt).length <= 3, 'Failures must be rare, not continuous glitch noise');
});
