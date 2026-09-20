import { expect, test } from '@playwright/test';

const QUESTION: string = 'If you could be only one story..:\nwho would you be?';
const LAST_OPTION: string = 'A romance— written in stardust and sacrifice? | A horror— that whispers your name in the dark?';

test('three dreamweavers boot in-world, ask the question, and wait without advancing', async ({ page }, testInfo) => {
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
  await expect(page.getByRole('radio').first()).toBeChecked();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('radio').nth(1)).toBeChecked();
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await expect(page.getByRole('radio').nth(2)).toBeChecked();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('radio').nth(2)).toBeChecked();
  await page.waitForTimeout(2500);
  await expect(boot).toHaveAttribute('data-os-phase-ts', 'waiting');
  expect(errors).toEqual([]);
});

test('reduced motion keeps a readable mirror and usable choices on a narrow screen', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/intro.html');
  // Reduced motion shows the settled waiting state immediately.
  await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'waiting');
  await expect(page.locator('#os-question-ts')).toHaveText(QUESTION);
  await expect(page.locator('main')).toHaveAttribute('data-os-corrupt-ts', 'false');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // The mirror is clipped by design; keyboard selection is the supported input path.
  await page.getByRole('radio').last().focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('radio').last()).toBeChecked();
  await page.screenshot({ path: testInfo.outputPath('mobile-waiting.png'), fullPage: true });
  await page.getByRole('button', { name: /replay boot/ }).click();
  // Reduced motion returns to the settled phase within one frame; assert its observable outcome.
  await expect(page.locator('input:checked')).toHaveCount(0);
  await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'waiting');
});

test('motion preference changes finish the question without rewinding it', async ({ page }) => {
  await page.goto('/intro.html');
  await expect(page.locator('main')).toHaveAttribute('data-os-art-ts', 'ready');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'waiting');
  await expect(page.locator('#os-question-ts')).toHaveText(QUESTION);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('#os-question-ts')).toHaveText(QUESTION);
  await page.getByRole('button', { name: /replay boot/ }).click();
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
  const earlyPhase = await boot.getAttribute('data-os-phase-ts');
  expect(earlyPhase).toBeTruthy();
  if (!earlyPhase || earlyPhase === 'waiting') throw new Error('the boot must be staged before the first keypress');
  await page.keyboard.press('x');
  // A third voice comments while the boot stays staged; the phase must not jump ahead.
  await expect(boot).toHaveAttribute('data-os-voice-ts', '0', { timeout: 5_000 });
  await expect(boot).toHaveAttribute('data-os-phase-ts', earlyPhase);
  await expect(page.locator('#os-aside-ts')).toBeVisible;
});
