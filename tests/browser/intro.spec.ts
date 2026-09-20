import { expect, test } from '@playwright/test';

test('keyboard selection waits for confirmation before advancing', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/intro.html?debug&pace=12');
  const boot = page.locator('main');
  // The visible boot is WebGL; the DOM is a clipped accessibility mirror.
  await expect(page.locator('#os-feed-ts')).toBeVisible();
  await expect(boot).toHaveAttribute('data-os-art-ts', 'ready');
  await expect(boot).toHaveAttribute('data-os-text-ts', 'three');
  await page.locator('#os-begin-ts').click();
  await page.waitForFunction(() => document.querySelector('main')?.getAttribute('data-os-phase-ts') === 'waiting', undefined, { timeout: 0 });
  await page.screenshot({ path: testInfo.outputPath('waiting.png') });
  await page.getByRole('radio').first().focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('radio').first()).toBeChecked();
  await page.waitForTimeout(2500);
  await expect(boot).toHaveAttribute('data-os-phase-ts', 'waiting');
  await page.keyboard.press('Enter');
  await expect(boot).not.toHaveAttribute('data-os-phase-ts', 'waiting');
  expect(errors).toEqual([]);
});

test('reduced motion keeps a readable mirror and usable choices on a narrow screen', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/intro.html?debug&pace=12');
  await page.locator('#os-begin-ts').click();
  await page.waitForFunction(() => document.querySelector('main')?.getAttribute('data-os-phase-ts') === 'waiting', undefined, { timeout: 0 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  // The mirror is clipped by design; keyboard selection is the supported input path.
  await page.getByRole('radio').last().focus();
  await page.keyboard.press('Space');
  await expect(page.getByRole('radio').last()).toBeChecked();
  await page.screenshot({ path: testInfo.outputPath('mobile-waiting.png'), fullPage: true });
  await page.locator('#os-replay-ts').click();
  // Replay restores the player-owned start gate, regardless of motion preference.
  await expect(page.locator('input:checked')).toHaveCount(0);
  await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'cursor');
});

test('motion preference changes do not advance or rewind an input gate', async ({ page }) => {
  await page.goto('/intro.html?debug&pace=12');
  await expect(page.locator('main')).toHaveAttribute('data-os-art-ts', 'ready');
  await page.locator('#os-begin-ts').click();
  await page.waitForFunction(() => document.querySelector('main')?.getAttribute('data-os-phase-ts') === 'waiting', undefined, { timeout: 0 });
  const before = await page.evaluate(() => window.__INTRO_DIAGNOSTICS__.getState());
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'waiting');
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const after = await page.evaluate(() => window.__INTRO_DIAGNOSTICS__.getState());
  expect(after.elapsedMs).toBe(before.elapsedMs);
  expect(after.answers).toEqual(before.answers);
  await page.locator('#os-replay-ts').click();
  await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'cursor');
  await expect(page.locator('input[name="story"]').first()).toBeDisabled();
});

test('a failed plate reports a visible error rather than hiding the boot', async ({ page }) => {
  await page.route('**/optical-b-fold.webp', (route) => route.abort());
  await page.goto('/intro.html');
  await expect(page.locator('main')).toHaveAttribute('data-os-art-ts', 'error');
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('alert')).not.toBeEmpty();
  await expect(page.locator('input[name="story"]').first()).toBeDisabled();
});

test('an unrelated key does not start the waiting opening', async ({ page }) => {
  await page.goto('/intro.html');
  const boot = page.locator('main');
  await expect(boot).toHaveAttribute('data-os-art-ts', 'ready');
  await page.keyboard.press('x');
  await expect(boot).toHaveAttribute('data-os-started-ts', 'false');
  await expect(boot).toHaveAttribute('data-os-phase-ts', 'cursor');
});
