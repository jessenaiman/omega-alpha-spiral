import { test, expect } from '@playwright/test';

test('terminal opens a movable town with proximity-only restoration', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-player-name]').fill('Walker');
  await page.locator('[data-submit-name]').click();
  for (const owner of ['luminary', 'shadow', 'ambition']) {
    await page.locator(`[data-choice-owner="${owner}"]`).click();
    await page.locator('[data-continue]').click();
  }
  await page.locator('[data-omega-name]').fill('Omega');
  await page.locator('[data-submit-omega]').click();
  await page.getByRole('button', { name: 'ENTER THE TOWN' }).click();
  await expect(page.locator('[data-map-hud]')).toContainText('0 / 3');
  await page.keyboard.press('e');
  await expect(page.locator('[data-map-hud]')).toContainText('0 / 3');
  await page.keyboard.down('a');
  await page.waitForTimeout(1630);
  await page.keyboard.up('a');
  await page.keyboard.down('s');
  await page.waitForTimeout(200);
  await page.keyboard.up('s');
  await expect(page.locator('[data-map-target]')).toContainText('ARCHIVE');
  await page.keyboard.press('e');
  await expect(page.locator('[data-map-hud]')).toContainText('1 / 3');
});
