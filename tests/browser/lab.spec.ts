import { expect, test } from '@playwright/test';

test('loop lab floor 1: step, hunt, escape by chest, restart the same seed', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/lab.html?seed=loop-1');

  await expect(page.locator('canvas[data-lab-canvas]')).toBeVisible();

  const start = await page.evaluate(() => window.__LOOP_LAB__?.getState());
  expect(start?.phase).toBe('play');
  expect(start?.hp).toBe(6);
  expect(start?.player).toEqual({ x: 1, y: 1 });

  const press = async (key: string, count: number): Promise<void> => {
    for (let i = 0; i < count; i += 1) await page.keyboard.press(key);
  };

  // Walk the open ring to the chest at (15, 13).
  await press('ArrowRight', 18);
  await press('ArrowDown', 12);
  await press('ArrowLeft', 4);

  const escaped = await page.evaluate(() => window.__LOOP_LAB__?.getState());
  expect(escaped?.phase).toBe('escaped');
  expect(escaped?.player).toEqual({ x: 15, y: 13 });

  await page.keyboard.press('r');
  const restarted = await page.evaluate(() => window.__LOOP_LAB__?.getState());
  expect(restarted?.phase).toBe('play');
  expect(restarted?.hp).toBe(6);
  expect(restarted?.guardHp).toBe(4);
  expect(restarted?.player).toEqual({ x: 1, y: 1 });
  expect(restarted?.seed).toBe('loop-1');

  expect(errors).toEqual([]);
});

test('loop lab fight exit: the guard is a fight, not a door', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/lab.html?seed=loop-1');

  const press = async (key: string, count: number): Promise<void> => {
    for (let i = 0; i < count; i += 1) await page.keyboard.press(key);
  };

  // Walk to the tile above the guard at (9, 9) and trade blows until the exit resolves.
  // Bumping the guard trades from the tile you stand on; you never step onto it.
  await press('ArrowRight', 8);
  await press('ArrowDown', 8);

  for (let i = 0; i < 40; i += 1) {
    const state = await page.evaluate(() => window.__LOOP_LAB__?.getState());
    if (state?.phase !== 'play') break;
    await page.keyboard.press('ArrowDown');
  }

  const end = await page.evaluate(() => window.__LOOP_LAB__?.getState());
  expect(['escaped', 'dead']).toContain(end?.phase);
  expect(errors).toEqual([]);
});

test('loop lab floor 1: a step visibly redraws the floor texture', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/lab.html?seed=loop-1');

  const boot = await page.evaluate(() => window.__LOOP_LAB__?.getState());
  expect(boot?.player).toEqual({ x: 1, y: 1 });
  expect(boot?.textureVersion).toBeGreaterThan(0);

  await page.keyboard.press('ArrowRight');

  const moved = await page.evaluate(() => window.__LOOP_LAB__?.getState());
  expect(moved?.player).toEqual({ x: 2, y: 1 });
  expect(moved?.textureVersion).toBeGreaterThan(boot?.textureVersion as number);
  expect(errors).toEqual([]);
});
