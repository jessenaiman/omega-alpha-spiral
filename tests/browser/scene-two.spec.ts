import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

test('the Echo Chamber exposes real objects and resolves one through real input', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push(`${request.url()}: ${request.failure()?.errorText ?? 'request failed'}`));
  await page.goto('/scene-two.html');

  const canvas = page.locator('canvas[data-scene-two-canvas]');
  const transmission = page.locator('[data-transmission]');
  await expect(canvas).toBeVisible();
  await expect(page.locator('[data-chamber-object][data-ready="true"]')).toHaveCount(3);

  const objectIds = await page.locator('[data-chamber-object][data-ready="true"]').evaluateAll(elements =>
    elements.map(element => element.getAttribute('data-chamber-object')).sort(),
  );
  expect(objectIds).toEqual(['chest', 'door', 'monster']);
  await expect.poll(async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.renderer?.calls)).toBeGreaterThan(0);
  await expect.poll(async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.renderer?.triangles)).toBeGreaterThan(0);

  const roomSweep = [
    'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowDown',
    'ArrowLeft', 'ArrowLeft', 'ArrowLeft', 'ArrowDown',
    'ArrowRight', 'ArrowRight', 'ArrowRight', 'ArrowDown',
    'ArrowLeft', 'ArrowLeft', 'ArrowLeft',
  ];
  // Only what the journey actually measures: how many real inputs were spent,
  // and which one produced the outcome. A press that produced no tile change
  // would leave `data-arrived` true and fail the loop, so the arrival
  // assertions — not a hardcoded zero — are the softlock evidence.
  let inputsAttempted = 0;
  let firstOutcomeStep: number | null = null;
  for (const key of roomSweep) {
    inputsAttempted += 1;
    await page.keyboard.press(key);
    await expect(canvas).toHaveAttribute('data-arrived', 'false');
    await expect(canvas).toHaveAttribute('data-arrived', 'true');
    if (await transmission.getAttribute('data-outcome-object')) {
      firstOutcomeStep = inputsAttempted;
      break;
    }
  }

  await expect(transmission).toHaveAttribute('data-outcome-object', /.+/);
  await expect(transmission).toHaveAttribute('data-action-kind', /.+/);
  await expect(page.locator('[data-story]')).not.toBeEmpty();
  const outcomeId = await transmission.getAttribute('data-outcome-object');
  const actionKind = await transmission.getAttribute('data-action-kind');
  const story = (await page.locator('[data-story]').textContent())?.trim();
  const diagnostics = await page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__);
  expect(diagnostics?.checkpoint).toBe(outcomeId);
  expect(diagnostics?.errors).toEqual([]);

  const journey = { inputsAttempted, firstOutcomeStep };
  const evidence = { objectIds, outcome: { objectId: outcomeId, action: { kind: actionKind }, story }, journey, diagnostics };
  await mkdir('artifacts/scene-two', { recursive: true });
  await writeFile('artifacts/scene-two/first-playable-state.json', JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: 'artifacts/scene-two/first-playable.png' });

  await page.locator('[data-restart]').click();
  await expect(transmission).not.toHaveAttribute('data-outcome-object', /.+/);
  await expect.poll(async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.checkpoint)).toBeNull();

  const stateAck = await page.evaluate(() => window.__THREE_GAME_TEST_HOOKS__?.setState('echo-chamber'));
  expect(stateAck).toEqual({ state: 'echo-chamber' });
  await page.evaluate(() => window.__THREE_GAME_TEST_HOOKS__?.setReducedMotion(true));
  await expect.poll(async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.accessibility.reducedMotion)).toBe(true);
  await canvas.focus();
  await expect(canvas).toBeFocused();

  await page.setViewportSize({ width: 390, height: 664 });
  const fit = await page.evaluate(() => ({
    width: document.documentElement.scrollWidth,
    height: document.documentElement.scrollHeight,
    viewportWidth: window.innerWidth,
    viewportHeight: window.innerHeight,
  }));
  expect(fit.width).toBeLessThanOrEqual(fit.viewportWidth);
  expect(fit.height).toBeLessThanOrEqual(fit.viewportHeight);
  await expect(transmission).toBeInViewport();
  expect(errors).toEqual([]);
});
