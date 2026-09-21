import { test, expect } from '@playwright/test';

test('maximum valid names fit completion at narrow viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('[data-player-name]').fill('M'.repeat(24));
  await page.locator('[data-submit-name]').click();
  for (let i = 0; i < 3; i++) {
    await page.locator('[data-choice-owner="luminary"]').click();
    await page.locator('[data-continue]').click();
  }
  await page.locator('[data-omega-name]').fill('W'.repeat(24));
  await page.locator('[data-submit-omega]').click();
  const fit = await page.locator('.terminal-transcript').evaluate(e => e.scrollWidth <= e.clientWidth);
  expect(fit).toBe(true);
});
