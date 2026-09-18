import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

test('basic page loads the Blender kit, steps, and collects the gem', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/basic.html');

  await expect(page.locator('canvas[data-basic-canvas]')).toBeVisible();
  await expect(page.locator('[data-basic-status]')).toHaveText('loaded Blender MCP room');

  const loaded = await page.evaluate(() => window.__BLENDER_MCP_DEMO__?.getState());
  expect(loaded?.meshNames).toContain('PICKUP_Gem');
  expect(loaded?.meshNames).toContain('ACT_HeroBody');
  expect(loaded?.drawCalls).toBeGreaterThan(0);
  expect(loaded?.triangles).toBeGreaterThan(0);

  await expect(page.locator('[data-basic-steps]')).toHaveText('0');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('[data-basic-steps]')).toHaveText('1');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-basic-gems]')).toHaveText('1');
  await expect(page.locator('[data-basic-status]')).toHaveText('gem collected');
  const collected = await page.evaluate(() => window.__BLENDER_MCP_DEMO__?.getState());
  expect(collected?.gemVisible).toBe(false);
  expect(collected?.tile).toEqual({ x: 2, z: 2 });

  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-basic-status]')).toHaveText('room complete');
  const completed = await page.evaluate(() => window.__BLENDER_MCP_DEMO__?.getState());
  expect(completed?.exitReached).toBe(true);
  expect(completed?.tile).toEqual({ x: 3, z: 3 });
  await mkdir('artifacts/blender-mcp', { recursive: true });
  await writeFile('artifacts/blender-mcp/basic-runtime-state.json', JSON.stringify(completed, null, 2));
  await page.screenshot({ path: 'artifacts/blender-mcp/basic-runtime-complete.png' });
  expect(errors).toEqual([]);
});
