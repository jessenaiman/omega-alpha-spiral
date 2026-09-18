import { expect, test } from '@playwright/test';

/**
 * Spiral Breaker boots as its own page and exposes the same acceptance
 * surfaces as the Ghost Terminal scene, so the shared canvas inspector can
 * take evidence from it.
 */

test('boots Spiral Breaker without browser errors and installs the acceptance surfaces', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await page.goto('/spiral-breaker.html');
  await expect(page.locator('canvas[data-game-canvas]')).toBeVisible();
  await expect(page.locator('[data-hud-status]')).toContainText(/Standby|Ghost playing|Manual/);

  const surfaces = await page.evaluate(() => ({
    hooks: Boolean((window as unknown as Record<string, unknown>).__THREE_GAME_TEST_HOOKS__),
    diagnostics: Boolean((window as unknown as Record<string, unknown>).__THREE_GAME_DIAGNOSTICS__),
  }));
  expect(surfaces).toEqual({ hooks: true, diagnostics: true });
  expect(errors).toEqual([]);
});

test('every named capture state is reachable and the diagnostics follow', async ({ page }) => {
  await page.goto('/spiral-breaker.html');
  const result = await page.evaluate(async () => {
    const hooks = (window as unknown as { __THREE_GAME_TEST_HOOKS__: Record<string, (value: unknown) => unknown> })
      .__THREE_GAME_TEST_HOOKS__;
    const phase = (): string =>
      (window as unknown as { __THREE_GAME_DIAGNOSTICS__: { phase: string } }).__THREE_GAME_DIAGNOSTICS__.phase;
    hooks.seed(7);
    const play = hooks.setState('active-play');
    const inPlay = phase();
    hooks.setState('menu');
    const inMenu = phase();
    hooks.setState('game-over');
    const over = phase();
    hooks.setState('victory');
    const won = phase();
    return { play, inPlay, inMenu, over, won };
  });

  expect(result.play).toEqual({ state: 'active-play' });
  expect(result.inPlay).toBe('play');
  expect(result.inMenu).toBe('menu');
  expect(result.over).toBe('game-over');
  expect(result.won).toBe('victory');
});

test('a state nobody declared is rejected', async ({ page }) => {
  await page.goto('/spiral-breaker.html');
  const threw = await page.evaluate(() => {
    const hooks = (window as unknown as { __THREE_GAME_TEST_HOOKS__: { setState: (name: string) => unknown } })
      .__THREE_GAME_TEST_HOOKS__;
    try {
      hooks.setState('archive-crossing');
      return false;
    } catch {
      return true;
    }
  });
  expect(threw).toBe(true);
});

test('the ghost takes over once the player stops touching the controls', async ({ page }) => {
  await page.goto('/spiral-breaker.html');
  await page.evaluate(async () => {
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
    .poll(
      async () =>
        page.evaluate(
          () => (window as unknown as { __THREE_GAME_DIAGNOSTICS__: { playerState: string } }).__THREE_GAME_DIAGNOSTICS__.playerState,
        ),
      { timeout: 9_000 },
    )
    .toBe('ghost');
});
