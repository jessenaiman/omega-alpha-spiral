import { expect, test } from '@playwright/test';

/**
 * QA release pass for Spiral Breaker.
 *
 * Proves the route a player actually meets: no console, page, or network errors
 * across both boot pages and every capture state, that real keyboard input
 * reaches the game (not just test hooks), and that the HUD and overlays fit the
 * desktop and mobile viewports while the audio unlock + mute path runs clean.
 */

function collectProblems(page: import('@playwright/test').Page): string[] {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) =>
    problems.push(`requestfailed: ${request.url()} ${request.failure()?.errorText ?? ''}`),
  );
  page.on('response', (response) => {
    if (response.status() >= 400) problems.push(`http ${response.status()}: ${response.url()}`);
  });
  return problems;
}

const inPage = <T>(callback: () => T) => callback as () => T;

const playerState = () =>
  inPage(
    () =>
      (window as unknown as { __THREE_GAME_DIAGNOSTICS__: { phase: string; playerState: string } })
        .__THREE_GAME_DIAGNOSTICS__.playerState,
  );

const phaseOf = () =>
  inPage(
    () =>
      (window as unknown as { __THREE_GAME_DIAGNOSTICS__: { phase: string } }).__THREE_GAME_DIAGNOSTICS__.phase,
  );

test('both pages boot and every capture state stays clean on console, page, and network', async ({ page }) => {
  const problems = collectProblems(page);

  await page.goto('/');
  await expect(page.locator('canvas[data-game-canvas]')).toBeVisible();

  await page.goto('/spiral-breaker.html');
  await expect(page.locator('canvas[data-game-canvas]')).toBeVisible();

  await page.evaluate(async () => {
    const hooks = (window as unknown as {
      __THREE_GAME_TEST_HOOKS__: { seed: (value: number) => unknown; setState: (name: string) => unknown };
    }).__THREE_GAME_TEST_HOOKS__;
    hooks.seed(7);
    for (const state of ['menu', 'active-play', 'game-over', 'victory'] as const) {
      hooks.setState(state);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
  });

  expect(await page.evaluate(phaseOf())).toBe('victory');
  expect(await page.locator('[data-hud-overlay-title]').textContent()).toContain('GAUNTLET');
  expect(problems).toEqual([]);
});

test('real keyboard input takes control and dashes, with the ghost releasing cleanly', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/spiral-breaker.html');
  await page.evaluate(() => {
    const hooks = (window as unknown as {
      __THREE_GAME_TEST_HOOKS__: {
        seed: (value: number) => unknown;
        setState: (name: string) => unknown;
        setPausedForScreenshot: (value: boolean) => unknown;
      };
    }).__THREE_GAME_TEST_HOOKS__;
    hooks.seed(3);
    hooks.setState('active-play');
    hooks.setPausedForScreenshot(false);
  });

  await expect
    .poll(() => page.evaluate(playerState()), { timeout: 9_000 })
    .toBe('ghost');

  await page.keyboard.down('ArrowRight');
  await page.keyboard.press('Space');
  await expect.poll(() => page.evaluate(playerState()), { timeout: 1_500 }).not.toBe('ghost');
  await page.keyboard.up('ArrowRight');
  await expect.poll(() => page.evaluate(playerState()), { timeout: 2_000 }).toBe('manual');
  expect(problems).toEqual([]);
});

test('a failed run restarts into a live run on a real start input', async ({ page }) => {
  const problems = collectProblems(page);
  await page.goto('/spiral-breaker.html');
  await page.evaluate(() => {
    const hooks = (window as unknown as {
      __THREE_GAME_TEST_HOOKS__: { seed: (value: number) => unknown; setState: (name: string) => unknown };
    }).__THREE_GAME_TEST_HOOKS__;
    hooks.seed(5);
    hooks.setState('game-over');
  });
  expect(await page.evaluate(phaseOf())).toBe('game-over');

  await page.keyboard.press('Space');
  await expect.poll(() => page.evaluate(phaseOf()), { timeout: 2_000 }).toBe('play');
  expect(problems).toEqual([]);
});

test('the HUD and overlays fit the desktop and mobile viewports, and the mute path unlocks audio cleanly', async ({
  page,
}) => {
  for (const viewport of [
    { name: 'desktop', width: 1280, height: 720 },
    { name: 'mobile', width: 390, height: 664 },
  ]) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    const problems = collectProblems(page);
    await page.goto('/spiral-breaker.html');
    await expect(page.locator('canvas[data-game-canvas]')).toBeVisible();

    for (const selector of ['[data-arcade-hud]', '[data-hud-score]', '[data-hud-best]', '[data-hud-integrity]', '[data-hud-wave]']) {
      const box = await page.locator(selector).boundingBox();
      expect(box, `${viewport.name} ${selector} has a box`).not.toBeNull();
      expect(box!.x, `${viewport.name} ${selector} left edge`).toBeGreaterThanOrEqual(0);
      expect(box!.y, `${viewport.name} ${selector} top edge`).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, `${viewport.name} ${selector} right edge`).toBeLessThanOrEqual(viewport.width);
      expect(box!.y + box!.height, `${viewport.name} ${selector} bottom edge`).toBeLessThanOrEqual(viewport.height);
    }

    await page.evaluate(() => {
      const hooks = (window as unknown as {
        __THREE_GAME_TEST_HOOKS__: { setState: (name: string) => unknown };
      }).__THREE_GAME_TEST_HOOKS__;
      hooks.setState('victory');
    });
    const overlay = page.locator('[data-hud-overlay]');
    await expect(overlay).toBeVisible();
    const overlayBox = await overlay.boundingBox();
    expect(overlayBox).not.toBeNull();
    expect(overlayBox!.x).toBeLessThanOrEqual(0);
    expect(overlayBox!.y).toBeLessThanOrEqual(0);
    expect(overlayBox!.x + overlayBox!.width).toBeGreaterThanOrEqual(viewport.width);
    expect(overlayBox!.y + overlayBox!.height).toBeGreaterThanOrEqual(viewport.height);

    const mute = page.locator('[data-hud-mute]');
    await mute.click();
    expect(await mute.getAttribute('data-muted')).toBe('true');
    await mute.click();
    expect(await mute.getAttribute('data-muted')).toBe('false');

    expect(problems, viewport.name).toEqual([]);
  }
});