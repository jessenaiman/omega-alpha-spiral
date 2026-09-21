import { test, expect, type Page } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

async function position(page: Page) {
  return page.evaluate(() => (window as unknown as { __THREE_GAME_DIAGNOSTICS__: {
    state: { player: { x: number; z: number } }
  } }).__THREE_GAME_DIAGNOSTICS__.state.player);
}

test('restores the entire town through real input and resumes after pause', async ({ page }, testInfo) => {
  const capture = process.env.OMEGA_CAPTURE_DIR;
  if (capture) await mkdir(capture, { recursive: true });
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  await page.goto('/?debug');
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
  if (capture) await page.screenshot({ path: resolve(capture, 'map-active.png') });
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-map-target]')).toContainText('PAUSED');
  if (capture) await page.screenshot({ path: resolve(capture, 'map-paused.png') });
  const stopped = await position(page);
  await page.keyboard.down('d');
  await page.waitForTimeout(250);
  await page.keyboard.up('d');
  expect(await position(page)).toEqual(stopped);
  await page.keyboard.press('Escape');

  const targets = [{ x: -8, z: 1 }, { x: 8, z: 1 }, { x: 0, z: 10 }];
  for (const [index, target] of targets.entries()) {
    let reached = false;
    for (let step = 0; step < 150; step++) {
      const p = await position(page);
      const dx = target.x - p.x, dz = target.z - p.z;
      if (Math.hypot(dx, dz) < 0.7) { reached = true; break; }
      const key = Math.abs(dx) > Math.abs(dz) ? (dx < 0 ? 'a' : 'd') : (dz < 0 ? 'w' : 's');
      await page.keyboard.down(key);
      await page.waitForTimeout(90);
      await page.keyboard.up(key);
    }
    expect(reached).toBe(true);
    await page.keyboard.press('e');
    await expect(page.locator('[data-map-hud]')).toContainText(`${index + 1} / 3`);
  }
  await expect(page.locator('[data-map-target]')).toContainText('TOWN RESTORED');
  expect(errors).toEqual([]);
  const metrics = await page.evaluate(() => {
    const d = (window as unknown as { __THREE_GAME_DIAGNOSTICS__: {
      state: { frame: number; restored: number; complete: boolean };
      renderer: { render: { calls: number; triangles: number }; memory: { geometries: number; textures: number } }
    } }).__THREE_GAME_DIAGNOSTICS__;
    return { framesAdvanced: d.state.frame, restored: d.state.restored, complete: d.state.complete,
      calls: d.renderer.render.calls, triangles: d.renderer.render.triangles,
      geometries: d.renderer.memory.geometries, textures: d.renderer.memory.textures };
  });
  if (capture) {
    await page.screenshot({ path: resolve(capture, 'map-restored.png') });
    await writeFile(resolve(capture, 'map-playthrough.json'), JSON.stringify({ runId: 'release2-pass1', ...metrics, errors }, null, 2));
  }
  expect(metrics.framesAdvanced).toBeGreaterThan(0);
  await testInfo.attach('town-playthrough-metrics', { body: JSON.stringify({ ...metrics, errors }), contentType: 'application/json' });
});
