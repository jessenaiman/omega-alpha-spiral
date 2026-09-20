import { expect, test } from '@playwright/test';
import { PNG } from 'pngjs';

const QUESTION: string = 'If you could be one story,\nwho would you be?';

test('cosmic plates give way to ghostwriting, then wait without advancing', async ({ page }, testInfo) => {
  const errors: string[] = [];
  const plates: Set<string> = new Set();
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('response', (response) => {
    if (/optical-[abc]-.*\.webp/.test(response.url()) && response.ok() && response.headers()['content-type']?.startsWith('image/')) plates.add(response.url());
  });
  await page.goto('/intro.html');
  const boot = page.locator('main');
  const question = page.locator('#os-question-ts');
  await expect(question).toBeAttached();
  await expect(boot).toHaveAttribute('data-os-art-ts', 'ready');
  await expect(boot).toHaveAttribute('data-os-phase-ts', 'cosmic');
  await expect(page.locator('.os-terminal')).toBeHidden();
  expect(plates.size).toBe(3);
  const image: PNG = PNG.sync.read(await page.locator('canvas').screenshot());
  let litPixels: number = 0;
  for (let index: number = 0; index < image.data.length; index += 4) {
    if (Math.max(image.data[index], image.data[index + 1], image.data[index + 2]) > 30) litPixels += 1;
  }
  expect(litPixels / (image.width * image.height)).toBeGreaterThan(0.03);
  await page.screenshot({ path: testInfo.outputPath('cosmic-opening.png') });
  await expect(question).toHaveText('');
  await expect.poll(async () => question.textContent(), { timeout: 15_000 }).toContain('hear');
  await expect(boot).toHaveAttribute('data-os-phase-ts', 'waiting', { timeout: 20_000 });
  await expect(question).toHaveText(QUESTION);
  await expect(boot).toHaveAttribute('data-os-plate-ts', '2');
  await page.screenshot({ path: testInfo.outputPath('first-question.png') });
  await expect(page.getByRole('radio')).toHaveCount(3);
  await page.getByRole('radio').first().focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('radio').first()).toBeChecked();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('radio').nth(1)).toBeChecked();
  await page.waitForTimeout(2500);
  await expect(boot).toHaveAttribute('data-os-phase-ts', 'waiting');
  expect(errors).toEqual([]);
});

test('reduced motion keeps a still plate and usable choices on a narrow screen', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/intro.html');
  await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'waiting');
  await expect(page.locator('main')).toHaveAttribute('data-os-plate-ts', '0');
  await expect(page.locator('#os-question-ts')).toHaveText(QUESTION);
  const still: PNG = PNG.sync.read(await page.locator('canvas').screenshot({ path: testInfo.outputPath('still-before.png') }));
  await page.waitForTimeout(400);
  const later: PNG = PNG.sync.read(await page.locator('canvas').screenshot({ path: testInfo.outputPath('still-after.png') }));
  // Chromium can round a few composited edge pixels by one 8-bit level between captures.
  const isStill: boolean = later.data.every((value: number, index: number): boolean => Math.abs(value - still.data[index]) <= 1);
  expect(isStill, 'Reduced-motion canvas pixels must remain unchanged within rasterization precision').toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('radio').last().check();
  await expect(page.getByRole('radio').last()).toBeChecked();
  await page.screenshot({ path: testInfo.outputPath('mobile-waiting.png'), fullPage: true });
  await page.getByRole('button', { name: /replay boot/ }).click();
  await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'waiting');
  await expect(page.locator('input:checked')).toHaveCount(0);
});

test('motion preference changes finish the question without rewinding it', async ({ page }) => {
  await page.goto('/intro.html');
  await expect(page.locator('main')).toHaveAttribute('data-os-art-ts', 'ready');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'waiting');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await expect(page.locator('#os-question-ts')).toHaveText(QUESTION);
  await expect(page.locator('main')).toHaveAttribute('data-os-plate-ts', '2');
  await page.getByRole('button', { name: /replay boot/ }).click();
  await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'cosmic');
  await expect(page.locator('main')).toHaveAttribute('data-os-plate-ts', '0');
  await expect(page.locator('input[name="story"]').first()).toBeDisabled();
});

test('a failed plate reports a visible error rather than hiding it behind the cosmic phase', async ({ page }) => {
  await page.route('**/optical-b-fold.webp', (route) => route.abort());
  await page.goto('/intro.html');
  await expect(page.locator('main')).toHaveAttribute('data-os-art-ts', 'error');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('could not load');
  await expect(page.locator('input[name="story"]').first()).toBeDisabled();
});
