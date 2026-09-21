import { test, expect } from '@playwright/test';

test('terminal remains interactive after persisted page suspension', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  });
  await page.locator('[data-player-name]').fill('Returning player');
  await page.locator('[data-submit-name]').click();
  await expect(page.locator('[data-choice-owner]')).toHaveCount(3);
});
