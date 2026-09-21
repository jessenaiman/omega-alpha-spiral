import { expect, test } from '@playwright/test';
import { createChronicleQuestions } from '../../src/intro/chronicle';

const FIRST_QUESTION = createChronicleQuestions(472)[0];
const QUESTION: string = FIRST_QUESTION.question;
const LIGHT_RESPONSE_OPENING: string = FIRST_QUESTION.choices[0].response.split('\n')[0];

test('the opening waits on its cursor until a gesture wakes audible ghostwriting', async ({ page }) => {
  await page.goto('/intro.html');
  const boot = page.locator('main');
  const sound = page.getByRole('button', { name: /wake sound|sound awake/ });
  await expect(boot).toHaveAttribute('data-os-art-ts', 'ready');
  await expect(boot).toHaveAttribute('data-os-phase-ts', 'cursor');
  await expect(sound).toBeHidden();
  await page.waitForTimeout(2_200);
  await expect(boot).toHaveAttribute('data-os-phase-ts', 'cursor');
  await page.keyboard.press('Enter');
  await expect(boot).toHaveAttribute('data-os-audio-ts', 'awake');
  await expect(sound).toBeVisible();
  await expect(boot).toHaveAttribute('data-os-phase-ts', 'command', { timeout: 5_000 });
  await expect.poll(async () => Number(await boot.getAttribute('data-os-audio-cues-ts') ?? 0)).toBeGreaterThan(1);
});

test('ghostwriting emits distinct typing, erasing, hesitation, and correction cues', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/intro.html');
  const boot = page.locator('main');
  await expect(boot).toHaveAttribute('data-os-art-ts', 'ready');
  await page.keyboard.press('Enter');
  await expect(boot).toHaveAttribute('data-os-phase-ts', 'waiting', { timeout: 50_000 });
  await expect.poll(async () => Number(await boot.getAttribute('data-os-audio-types-ts') ?? 0)).toBeGreaterThan(10);
  await expect.poll(async () => Number(await boot.getAttribute('data-os-audio-erases-ts') ?? 0)).toBeGreaterThan(1);
  await expect.poll(async () => Number(await boot.getAttribute('data-os-audio-hesitations-ts') ?? 0)).toBeGreaterThan(0);
  await expect.poll(async () => Number(await boot.getAttribute('data-os-audio-corrections-ts') ?? 0)).toBeGreaterThan(0);
});

test('the event horizon forms in-world without restoring a DOM terminal surface', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/intro.html?debug');
  const boot = page.locator('main');
  await expect(boot).toHaveAttribute('data-os-art-ts', 'ready');
  await expect(boot).toHaveAttribute('data-os-phase-ts', 'cursor');
  await page.keyboard.press('Enter');
  await expect(boot).toHaveAttribute('data-os-phase-ts', 'waiting');
  await expect(boot).toHaveAttribute('data-os-particle-surface-ts', 'formed', { timeout: 5_000 });
  await expect(page.locator('#os-feed-ts')).toBeVisible();
});

test('three dreamweavers boot in-world, ask the question, and enter an authored response', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/intro.html');
  const boot = page.locator('main');
  // The visible boot is WebGL; the DOM is a clipped accessibility mirror.
  await expect(page.locator('#os-feed-ts')).toBeVisible();
  await expect(boot).toHaveAttribute('data-os-art-ts', 'ready');
  await expect(boot).toHaveAttribute('data-os-text-ts', 'three');
  await expect(boot).toHaveAttribute('data-os-particles-ts', '20000');
  await expect(boot).toHaveAttribute('data-os-particle-draws-ts', '1');
  await page.keyboard.press('Enter');
  // Boot must be staged: typed command, three load slots, then the question.
  await expect(boot).toHaveAttribute('data-os-phase-ts', 'command', { timeout: 15_000 });
  await expect(boot).toHaveAttribute('data-os-phase-ts', 'loading', { timeout: 20_000 });
  await expect(boot).toHaveAttribute('data-os-phase-ts', 'waiting', { timeout: 30_000 });
  await expect(boot).toHaveAttribute('data-os-corrupt-ts', 'false');
  await expect(boot).toHaveAttribute('data-os-format-ts', 'settled');
  await expect(page.locator('#os-question-ts')).toHaveText(QUESTION);
  await page.screenshot({ path: testInfo.outputPath('waiting.png') });
  await expect(page.getByRole('radio')).toHaveCount(3);
  await page.getByRole('radio').first().focus();
  await page.keyboard.press('Space');
  await expect(page.locator('input[name="story"]').first()).toBeChecked();
  await expect(boot).toHaveAttribute('data-os-phase-ts', 'response');
  await expect(page.locator('#os-question-ts')).toContainText(LIGHT_RESPONSE_OPENING);
  expect(errors).toEqual([]);
});

test('reduced motion keeps a readable mirror and usable choices on a narrow screen', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/intro.html');
  await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'cursor');
  await page.keyboard.press('Enter');
  // Reduced motion shows the settled waiting state immediately after the required start gesture.
  await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'waiting');
  await expect(page.locator('#os-question-ts')).toHaveText(QUESTION);
  await expect(page.locator('main')).toHaveAttribute('data-os-corrupt-ts', 'false');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // The mirror is clipped by design; keyboard selection is the supported input path.
  await page.getByRole('radio').last().focus();
  await page.keyboard.press('Space');
  await expect(page.locator('input[name="story"]').last()).toBeChecked();
  await page.screenshot({ path: testInfo.outputPath('mobile-waiting.png'), fullPage: true });
  await page.getByRole('button', { name: /replay opening/ }).click();
  // Replay always returns to the cursor gate, including reduced motion.
  await expect(page.locator('input:checked')).toHaveCount(0);
  await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'cursor');
});

test('motion preference changes finish the question without rewinding it', async ({ page }) => {
  await page.goto('/intro.html');
  await expect(page.locator('main')).toHaveAttribute('data-os-art-ts', 'ready');
  await page.keyboard.press('Enter');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'waiting');
  await expect(page.locator('#os-question-ts')).toHaveText(QUESTION);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('#os-question-ts')).toHaveText(QUESTION);
  await page.getByRole('button', { name: /replay opening/ }).click();
  await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'cursor');
  await expect(page.locator('input[name="story"]').first()).toBeDisabled();
});

test('a failed plate reports a visible error rather than hiding the boot', async ({ page }) => {
  await page.route('**/optical-b-fold.webp', (route) => route.abort());
  await page.goto('/intro.html');
  await expect(page.locator('main')).toHaveAttribute('data-os-art-ts', 'error');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('could not load');
  await expect(page.locator('input[name="story"]').first()).toBeDisabled();
});

test('a non-modifier keypress surfaces a third voice aside without advancing the boot', async ({ page }) => {
  await page.goto('/intro.html');
  const boot = page.locator('main');
  await expect(boot).toHaveAttribute('data-os-art-ts', 'ready');
  await page.keyboard.press('Enter');
  await expect(boot).toHaveAttribute('data-os-phase-ts', 'command', { timeout: 5_000 });
  const earlyPhase = await boot.getAttribute('data-os-phase-ts');
  expect(earlyPhase).toBeTruthy();
  if (!earlyPhase || earlyPhase === 'waiting') throw new Error('the boot must be staged before the first keypress');
  await page.keyboard.press('x');
  // A third voice comments while the boot stays staged; the phase must not jump ahead.
  await expect(boot).toHaveAttribute('data-os-voice-ts', '0', { timeout: 5_000 });
  await expect(boot).toHaveAttribute('data-os-phase-ts', earlyPhase);
  await expect(page.locator('#os-aside-ts')).toBeVisible();
});
