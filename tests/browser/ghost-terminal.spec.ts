import { expect, test } from '@playwright/test';

test('completes Ghost Terminal through explicit player choices', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));

  await page.goto('/');
  await expect(page.locator('[data-ghost-terminal]')).toBeVisible();
  await expect(page.locator('[data-terminal-instance]')).toHaveText(/INSTANCE \d{3}/);

  await page.locator('[data-player-name]').fill('Jesse');
  await page.locator('[data-submit-name]').click();
  await expect(page.locator('[data-question-id="story"]')).toBeVisible();

  await page.locator('[data-choice-owner="luminary"]').click();
  await expect(page.locator('[data-terminal-response]')).toBeVisible();
  await page.waitForTimeout(150);
  await expect(page.locator('[data-question-id="story"]')).toBeVisible();
  await page.locator('[data-continue]').click();

  await page.locator('[data-choice-owner="shadow"]').click();
  await page.locator('[data-continue]').click();
  await page.locator('[data-choice-owner="ambition"]').click();
  await page.locator('[data-continue]').click();

  await expect(page.locator('[data-omega-name]')).toBeVisible();
  await page.locator('[data-omega-name]').fill('Omega');
  await page.locator('[data-submit-omega]').click();

  await expect(page.locator('[data-terminal-complete]')).toContainText('WELCOME TO THE GAME THAT CHOSE YOU');
  await expect(page.locator('[data-game-status]')).toContainText('TOWN MAP SIGNAL READY');
  expect(errors).toEqual([]);
});

test('shows a useful validation message and preserves focus', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-submit-name]').click();
  await expect(page.locator('[data-name-error]')).toContainText('1–24 visible characters');
  await expect(page.locator('[data-player-name]')).toBeFocused();
});
