import assert from 'node:assert/strict';
import test from 'node:test';
import { createBootFrames } from '../../src/intro/ghostwriting';
import { GHOST_FINAL, GHOST_QUESTIONS } from '../../src/dialogue/ghost';

const QUESTION: string = 'If you could be only one story..:\nwho would you be?';

test('ghostwriting attempts a chronological boot with temporary corruption before the question', () => {
  const frames = createBootFrames('472');
  assert.deepEqual(frames, createBootFrames('472'));
  assert.equal(frames[0].phase, 'cursor');
  assert.ok(frames.some((frame) => frame.transcript.includes('script unfinished')), 'Missing failed first invocation');
  assert.ok(frames.some((frame) => frame.transcript.includes('unexpected end')), 'Missing failed wake script');
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

test('cursor boots the script, the question stalls, then voices breach sequentially', () => {
  const frames = createBootFrames('472');
  const commandIndex = frames.findIndex((frame) => frame.transcript.includes('/run omega.sh'));
  const questionIndex = frames.findIndex((frame) => frame.question.length > 0);
  const stalledIndex = frames.findIndex((frame) => frame.transcript.includes('question ... stalled'));
  const lightIndex = frames.findIndex((frame) => frame.transcript.includes('dreamweaver[01]'));
  const shadowIndex = frames.findIndex((frame) => frame.transcript.includes('dreamweaver[02]'));
  const ambitionIndex = frames.findIndex((frame) => frame.transcript.includes('dreamweaver[03]'));
  assert.ok(commandIndex >= 0, 'Boot must type /run omega.sh');
  assert.ok(questionIndex > commandIndex, 'Omega must find the question after the boot command');
  assert.ok(stalledIndex > questionIndex, 'The written question must visibly stall');
  assert.ok(lightIndex > stalledIndex, 'Dreamweavers must wait for Omega to stall');
  assert.ok(lightIndex < shadowIndex && shadowIndex < ambitionIndex, 'Dreamweavers must breach one at a time');
  assert.ok(frames.some((frame, index) => index > 0 && frame.question.length < frames[index - 1].question.length), 'The question must erase and retry');
  assert.equal(frames.filter((frame) => frame.isCorrupt).length, 4, 'Only three corrections and the deliberate stall may corrupt');
});

test('the four Ghost OML floors own three answers each and a plural ending', () => {
  assert.equal(GHOST_QUESTIONS.length, 4);
  assert.ok(GHOST_QUESTIONS.every((question) => question.choices.length === 3));
  assert.equal(GHOST_QUESTIONS[3].prelude.includes('∞ ◊ Ω ≋ ※'), true);
  assert.match(GHOST_FINAL, /Dreamweaver threads following - 03/);
  assert.doesNotMatch(GHOST_FINAL, /thread selected/);
});
