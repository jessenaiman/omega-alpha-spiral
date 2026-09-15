import { expect, test } from '@playwright/test';

test('boots the Omega Spiral canvas without browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('canvas[data-game-canvas]')).toBeVisible();
  await expect(page.locator('[data-game-status]')).toContainText('GHOST TERMINAL');
  expect(errors).toEqual([]);
});
