import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
interface FieldState { active: boolean; phase: string; roomIndex: number; player: { x: number; z: number }; framesAdvanced: number; distanceTravelled: number; choices: { object: string; answer: string }[]; thread: string; guide: string | null; paused: boolean }
declare global { interface Window { __CHAPTER_TWO_DIAGNOSTICS__: { getState(): FieldState } } }
const state = (page: Page): Promise<FieldState> => page.evaluate(() => window.__CHAPTER_TWO_DIAGNOSTICS__.getState());
test.use({ video: 'on' });

async function walk(page: Page, axis: 'x' | 'z', target: number): Promise<void> {
  const before = await state(page);
  const sign = target > before.player[axis] ? 1 : -1;
  if (Math.abs(target - before.player[axis]) < 0.2) return;
  const key = axis === 'x' ? (sign > 0 ? 'd' : 'a') : (sign > 0 ? 's' : 'w');
  await page.keyboard.down(key);
  try {
    await page.waitForFunction(({ axis, target, sign }) => {
      const s = window.__CHAPTER_TWO_DIAGNOSTICS__.getState();
      return sign > 0 ? s.player[axis] >= target : s.player[axis] <= target;
    }, { axis, target, sign }, { timeout: 12_000 });
  } finally { await page.keyboard.up(key); }
  const after = await state(page);
  expect(after.framesAdvanced).toBeGreaterThan(before.framesAdvanced);
  expect(after.distanceTravelled).toBeGreaterThan(before.distanceTravelled);
}

for (const route of [0, 1, 2]) {
  test(`keyboard bot route ${route} crosses into playable rooms`, async ({ page }, info) => {
    test.setTimeout(150_000);
    const errors: string[] = [];
    if (route === 2) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.emulateMedia({ reducedMotion: 'reduce' });
    }
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    await page.goto('/intro.html?debug&pace=20');
    await expect(page.locator('main')).toHaveAttribute('data-os-art-ts', 'ready');
    await page.keyboard.press('Enter');
    const evidence: object[] = [];
    while ((await page.locator('main').getAttribute('data-os-phase-ts')) !== 'doorway') {
      await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'waiting', { timeout: 30_000 });
      const choiceCount = await page.getByRole('radio').count();
      expect(choiceCount).toBeGreaterThan(0);
      const choice = route % choiceCount;
      evidence.push({ sceneIndex: (await page.evaluate(() => window.__INTRO_DIAGNOSTICS__.getState())).sceneIndex, choice });
      await page.keyboard.press(String(choice + 1));
      await expect(page.locator('main')).not.toHaveAttribute('data-os-phase-ts', 'waiting');
    }
    await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'doorway', { timeout: 30_000 });
    await page.locator('#os-enter-ts').click();
    await expect(page.locator('main')).toHaveAttribute('data-chapter', '2');
    await page.screenshot({ path: info.outputPath('arrival.png') });
    const entered = await state(page);
    expect(entered.active).toBe(true);
    expect(entered.thread).not.toBe('');
    if (route === 0) {
      await page.keyboard.press('Escape');
      await expect.poll(async () => (await state(page)).paused).toBe(true);
      const held = await state(page);
      await page.keyboard.down('w');
      await page.waitForTimeout(450);
      await page.keyboard.up('w');
      expect((await state(page)).player).toEqual(held.player);
      expect((await state(page)).distanceTravelled).toBe(held.distanceTravelled);
      await page.keyboard.press('Escape');
    }
    // Real keyboard navigation; diagnostics are READ ONLY, never teleport or answer hooks.
    let room = 0;
    while ((await state(page)).phase !== 'complete') {
      const x = [-8, 0, 8][(route + room) % 3];
      await walk(page, 'x', x);
      await walk(page, 'z', 2.4);
      await page.keyboard.press('e');
      if ((await state(page)).phase === 'prompt') {
        await expect(page.locator('#echo-answer')).toBeVisible();
        const answer = `mechanical answer ${route}-${room}`;
        await page.locator('#echo-answer').fill(answer);
        if (route === 0) {
          await page.locator('#echo-answer').press('Escape');
          await expect.poll(async () => (await state(page)).paused).toBe(true);
          await page.keyboard.press('Escape');
          await expect(page.locator('#echo-answer')).toBeVisible();
          await expect(page.locator('#echo-answer')).toHaveValue(answer);
        }
        await page.locator('#echo-answer').press('Enter');
      }
      await expect.poll(async () => (await state(page)).phase).toBe('result');
      await page.screenshot({ path: info.outputPath(`encounter-${room}.png`) });
      const choicesBeforeContinue = (await state(page)).choices;
      expect(choicesBeforeContinue.length).toBeGreaterThan(room);
      await page.locator('#echo-next').click();
      if ((await state(page)).phase === 'rewriting') {
        await expect.poll(async () => (await state(page)).phase).toBe('rewriting');
        const waiting = await state(page);
        await expect(page.locator('#echo-script')).toBeVisible();
        if (route === 0) {
          await page.keyboard.down('w');
          await page.waitForTimeout(600);
          await page.keyboard.up('w');
          const held = await state(page);
          expect(held.phase).toBe('rewriting');
          expect(held.player).toEqual(waiting.player);
          expect(held.choices).toEqual(waiting.choices);
          await page.keyboard.press('Escape');
          await expect(page.locator('#echo-next')).toBeHidden();
          await page.keyboard.press('Escape');
        }
        await page.screenshot({ path: info.outputPath(`rewrite-${room}.png`) });
        await page.locator('#echo-next').click();
        await expect.poll(async () => (await state(page)).roomIndex).toBeGreaterThan(waiting.roomIndex);
        expect((await state(page)).choices).toEqual(waiting.choices);
      }
      if ((await state(page)).phase !== 'complete') await expect.poll(async () => (await state(page)).phase).toBe('exploring');
      room += 1;
    }
    const completed = await state(page);
    expect(completed.distanceTravelled).toBeGreaterThan(0);
    await page.screenshot({ path: info.outputPath('rooms-complete.png') });
    await info.attach('bot-evidence', { body: JSON.stringify({ route, opening: evidence, entered, completed, errors }, null, 2), contentType: 'application/json' });
    writeFileSync(info.outputPath('bot-evidence.json'), JSON.stringify({ route, opening: evidence, entered, completed, errors }, null, 2));
    await page.locator('#echo-restart').click();
    expect((await state(page)).choices).toEqual([]);
    expect((await state(page)).distanceTravelled).toBe(0);
    await page.locator('#os-replay-ts').click();
    await expect(page.locator('main')).toHaveAttribute('data-chapter', '1');
    await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'cursor');
    expect(errors).toEqual([]);
  });
}
