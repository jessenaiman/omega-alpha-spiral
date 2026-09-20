import assert from 'node:assert/strict';
import test from 'node:test';
import { createBootFrames, wrapText } from '../../src/intro/ghostwriting';

test('physical glyph lines wrap at word boundaries using neutral sample text', () => {
  const source = 'alpha beta gamma delta';
  const wrapped = wrapText(source, 12);
  assert.equal(wrapped, 'alpha beta\ngamma delta');
  assert.equal(wrapped.replaceAll('\n', ' '), source);
  assert.equal(wrapText('One.\n\nTwo.', 42), 'One.\n\nTwo.');
});

test('frame generation is deterministic and its clock is monotonic', () => {
  const frames = createBootFrames('472');
  assert.deepEqual(frames, createBootFrames('472'));
  assert.equal(frames[0].phase, 'cursor');

  for (let index: number = 1; index < frames.length; index += 1) {
    assert.ok(frames[index].at > frames[index - 1].at, 'Frames must have strictly increasing times');
  }
});
