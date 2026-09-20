import { expect, test } from '@playwright/test';

interface IntroState {
  phase: string;
  elapsedMs: number;
  formationMs: number;
  sceneIndex: number;
  answers: string[];
  cameraZ: number;
  cursor: number[];
  background: { time: number; drift: number[]; zoom: number };
  stars: { time: number; visible: boolean; count: number };
}

declare global {
  interface Window { __INTRO_DIAGNOSTICS__: { getState(): IntroState } }
}

test('the cursor waits for the player even with reduced motion enabled', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/intro.html?debug');
  await expect(page.locator('main')).toHaveAttribute('data-os-art-ts', 'ready');
  await page.waitForTimeout(2500);
  await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'cursor');
  await expect(page.locator('#os-transcript-ts')).toHaveText('');
  await page.locator('#os-begin-ts').click();
  await expect(page.locator('main')).toHaveAttribute('data-os-started-ts', 'true');
});

test('an answer triggers the unseen exchange without interruption keys', async ({ page }) => {
  await page.goto('/intro.html?debug&pace=4');
  await expect(page.locator('main')).toHaveAttribute('data-os-art-ts', 'ready');
  await page.locator('#os-begin-ts').click();
  await page.waitForFunction(() => window.__INTRO_DIAGNOSTICS__.getState().phase === 'waiting');
  await page.keyboard.press('2');
  await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'debating');
  await expect(page.locator('#os-aside-ts')).not.toBeEmpty();
  const before = (await page.evaluate(() => window.__INTRO_DIAGNOSTICS__.getState())).answers.length;
  await page.keyboard.press('3');
  expect((await page.evaluate(() => window.__INTRO_DIAGNOSTICS__.getState())).answers.length).toBe(before);
});

test('ambient background and particle time continue without advancing an input gate', async ({ page }) => {
  await page.goto('/intro.html?debug&pace=12');
  await expect(page.locator('main')).toHaveAttribute('data-os-art-ts', 'ready');
  await page.locator('#os-begin-ts').click();
  await page.waitForFunction(() => window.__INTRO_DIAGNOSTICS__.getState().phase === 'waiting');
  const held = await page.evaluate(() => window.__INTRO_DIAGNOSTICS__.getState());
  expect(held.background).toBeDefined();
  expect(held.stars).toBeDefined();
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => window.__INTRO_DIAGNOSTICS__.getState());
  expect(after.phase).toBe('waiting');
  expect(after.elapsedMs).toBe(held.elapsedMs);
  expect(after.formationMs).toBe(held.formationMs);
  expect(after.background.time).toBeGreaterThan(held.background.time);
  expect(after.background.drift).not.toEqual(held.background.drift);
  expect(after.stars.time).toBeGreaterThan(held.stars.time);
  expect(after.stars.visible).toBe(true);
  expect(after.stars.count).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(100);
  const reduced = await page.evaluate(() => window.__INTRO_DIAGNOSTICS__.getState());
  await page.waitForTimeout(500);
  const still = await page.evaluate(() => window.__INTRO_DIAGNOSTICS__.getState());
  expect(still.background).toEqual(reduced.background);
  expect(still.stars.visible).toBe(false);
});

test('runtime input gates lead to door traversal and replay', async ({ page }, testInfo) => {
  test.setTimeout(300_000); // Infrastructure watchdog, not a creative pacing assertion.
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  // Accelerate only the clock, not story states; every answer is a real keypress.
  await page.goto('/intro.html?debug&pace=12');
  const boot = page.locator('main');
  await expect(boot).toHaveAttribute('data-os-art-ts', 'ready');
  const idle = await page.evaluate(() => window.__INTRO_DIAGNOSTICS__.getState());
  await page.waitForTimeout(900);
  const drifted = await page.evaluate(() => window.__INTRO_DIAGNOSTICS__.getState());
  expect(drifted.phase).toBe('cursor');
  expect(drifted.formationMs).toBe(0);
  expect(drifted.cursor).not.toEqual(idle.cursor);
  await page.screenshot({ path: testInfo.outputPath('idle.png') });
  await page.keyboard.press('Enter');
  let inputs: number = 0;
  while (true) {
    await page.waitForFunction(() => ['waiting', 'final', 'doorway'].includes(window.__INTRO_DIAGNOSTICS__.getState().phase), undefined, { timeout: 0 });
    if ((await page.evaluate(() => window.__INTRO_DIAGNOSTICS__.getState())).phase !== 'waiting') break;
    await page.screenshot({ path: testInfo.outputPath(`input-gate-${inputs}.png`) });
    const held = await page.evaluate(() => window.__INTRO_DIAGNOSTICS__.getState());
    await page.waitForTimeout(700);
    const after = await page.evaluate(() => window.__INTRO_DIAGNOSTICS__.getState());
    expect(after.formationMs).toBe(held.formationMs);
    expect(after.elapsedMs).toBe(held.elapsedMs);
    await page.keyboard.press('1');
    inputs += 1;
    await expect(boot).toHaveAttribute('data-os-phase-ts', 'writing');
    expect((await page.evaluate(() => window.__INTRO_DIAGNOSTICS__.getState())).answers).toHaveLength(inputs);
  }
  await page.waitForFunction(() => window.__INTRO_DIAGNOSTICS__.getState().phase === 'doorway', undefined, { timeout: 0 });
  await expect(boot).toHaveAttribute('data-os-door-ts', 'ready');
  await page.screenshot({ path: testInfo.outputPath('doorway.png') });
  await page.locator('#os-enter-ts').click();
  await expect(boot).toHaveAttribute('data-os-phase-ts', 'complete');
  const complete = await page.evaluate(() => window.__INTRO_DIAGNOSTICS__.getState());
  expect(complete.answers).toHaveLength(inputs);
  expect(complete.cameraZ).toBeLessThan(-3);
  await page.screenshot({ path: testInfo.outputPath('through-door.png') });
  await testInfo.attach('journey', { body: JSON.stringify(complete, null, 2), contentType: 'application/json' });
  await page.getByRole('button', { name: /replay boot/ }).click();
  await expect(boot).toHaveAttribute('data-os-phase-ts', 'cursor');
  const reset = await page.evaluate(() => window.__INTRO_DIAGNOSTICS__.getState());
  expect(reset.answers).toEqual([]);
  expect(reset.formationMs).toBe(0);
  expect(reset.cameraZ).toBe(10);
  expect(errors).toEqual([]);
});
