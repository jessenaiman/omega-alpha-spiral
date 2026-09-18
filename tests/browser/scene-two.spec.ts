import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

test('the Echo Chamber exposes real objects and resolves one through real input', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
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
  for (const key of roomSweep) {
    await page.keyboard.press(key);
    await expect(canvas).toHaveAttribute('data-arrived', 'false');
    await expect(canvas).toHaveAttribute('data-arrived', 'true');
    if (await transmission.getAttribute('data-outcome-object')) break;
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

  const evidence = { objectIds, outcome: { objectId: outcomeId, action: { kind: actionKind }, story }, diagnostics };
  await mkdir('artifacts/scene-two', { recursive: true });
  await writeFile('artifacts/scene-two/first-playable-state.json', JSON.stringify(evidence, null, 2));
  await page.screenshot({ path: 'artifacts/scene-two/first-playable.png' });

  await page.locator('[data-restart]').click();
  await expect(transmission).not.toHaveAttribute('data-outcome-object', /.+/);
  await expect.poll(async () => page.evaluate(() => window.__THREE_GAME_DIAGNOSTICS__?.checkpoint)).toBeNull();
  expect(errors).toEqual([]);
});
