import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const out = new URL('../artifacts/scene1/', import.meta.url);
await mkdir(fileURLToPath(out), { recursive: true });
const browser = await chromium.launch({ channel: 'chromium' });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.addInitScript(() => sessionStorage.setItem('omega-spiral.lineage.v1', JSON.stringify({ baseInstanceId: 472, loopCount: 0 })));
await page.goto('http://127.0.0.1:5188/');
await page.locator('[data-player-name]').fill('Jesse');
await page.locator('[data-submit-name]').click();
await page.screenshot({ path: fileURLToPath(new URL('ghost-terminal-question.png', out)) });

for (const owner of ['luminary', 'shadow', 'ambition']) {
  await page.locator(`[data-choice-owner="${owner}"]`).click();
  await page.locator('[data-continue]').click();
}
await page.locator('[data-omega-name]').fill('Omega');
await page.locator('[data-submit-omega]').click();
await page.screenshot({ path: fileURLToPath(new URL('ghost-terminal-complete.png', out)) });
await browser.close();
