# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: browser\chapter-zero-bot.spec.ts >> source-driven bot route 0 crosses into playable rooms
- Location: tests\browser\chapter-zero-bot.spec.ts:29:3

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false

Call Log:
- Timeout 5000ms exceeded while waiting on the predicate
```

# Page snapshot

```yaml
- main [ref=e2]:
  - button "replay boot ↺" [ref=e4] [cursor=pointer]
  - region "Echo chamber gameplay":
    - generic [ref=e5]:
      - strong [ref=e6]: ECHO CHAMBER / 1 — GRAYBOX
      - generic [ref=e7]: WASD / arrows · E interact · Esc pause · R restart
      - button "Pause" [ref=e8] [cursor=pointer]
      - button "Restart rooms" [ref=e9] [cursor=pointer]
    - generic [ref=e10]:
      - paragraph [ref=e11]: What is the first story you ever loved?
      - generic [ref=e12]:
        - generic [ref=e13]: Your answer
        - textbox "Your answer" [active] [ref=e14]: "Bot route 0, room 0: remembered story"
        - button "Answer" [ref=e15] [cursor=pointer]
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test';
  2   | import { readFileSync, writeFileSync } from 'node:fs';
  3   | const runtime = JSON.parse(readFileSync(new URL('../../src/intro/ghost-script.json', import.meta.url), 'utf8'));
  4   | 
  5   | const source = JSON.parse(readFileSync(new URL('../../project-management/official game docs (read-only)/chapter-zero-stages/stage_1_opening/ghost.json', import.meta.url), 'utf8'));
  6   | interface FieldState { active: boolean; phase: string; roomIndex: number; player: { x: number; z: number }; framesAdvanced: number; distanceTravelled: number; choices: { object: string; answer: string }[]; thread: string; guide: string | null; paused: boolean }
  7   | declare global { interface Window { __CHAPTER_TWO_DIAGNOSTICS__: { getState(): FieldState } } }
  8   | const state = (page: Page): Promise<FieldState> => page.evaluate(() => window.__CHAPTER_TWO_DIAGNOSTICS__.getState());
  9   | test.use({ video: 'on' });
  10  | 
  11  | async function walk(page: Page, axis: 'x' | 'z', target: number): Promise<void> {
  12  |   const before = await state(page);
  13  |   const sign = target > before.player[axis] ? 1 : -1;
  14  |   if (Math.abs(target - before.player[axis]) < 0.2) return;
  15  |   const key = axis === 'x' ? (sign > 0 ? 'd' : 'a') : (sign > 0 ? 's' : 'w');
  16  |   await page.keyboard.down(key);
  17  |   try {
  18  |     await page.waitForFunction(({ axis, target, sign }) => {
  19  |       const s = window.__CHAPTER_TWO_DIAGNOSTICS__.getState();
  20  |       return sign > 0 ? s.player[axis] >= target : s.player[axis] <= target;
  21  |     }, { axis, target, sign }, { timeout: 12_000 });
  22  |   } finally { await page.keyboard.up(key); }
  23  |   const after = await state(page);
  24  |   expect(after.framesAdvanced).toBeGreaterThan(before.framesAdvanced);
  25  |   expect(after.distanceTravelled).toBeGreaterThan(before.distanceTravelled);
  26  | }
  27  | 
  28  | for (const route of [0, 1, 2]) {
  29  |   test(`source-driven bot route ${route} crosses into playable rooms`, async ({ page }, info) => {
  30  |     test.setTimeout(150_000);
  31  |     expect(runtime).toEqual(source);
  32  |     const errors: string[] = [];
  33  |     if (route === 2) {
  34  |       await page.setViewportSize({ width: 390, height: 844 });
  35  |       await page.emulateMedia({ reducedMotion: 'reduce' });
  36  |     }
  37  |     page.on('pageerror', error => errors.push(error.message));
  38  |     page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  39  |     page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  40  |     await page.goto('/intro.html?debug&pace=20');
  41  |     await expect(page.locator('main')).toHaveAttribute('data-os-art-ts', 'ready');
  42  |     await page.keyboard.press('Enter');
  43  |     const evidence: object[] = [];
  44  |     for (const scene of source.scenes) {
  45  |       if (!scene.choice) continue;
  46  |       await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'waiting', { timeout: 30_000 });
  47  |       const question = (Array.isArray(scene.choice.question) ? scene.choice.question.join('\n') : scene.choice.question).replace(/\[[^|\]]+\|([^\]]+)\]/g, '$1');
  48  |       await expect(page.locator('#os-question-ts')).toHaveText(question);
  49  |       await expect(page.locator('.os-choice-copy')).toHaveText(scene.choice.options.map((option: { text: string }) => option.text));
  50  |       evidence.push({ scene: scene.id, option: route, text: scene.choice.options[route].text });
  51  |       await page.keyboard.press(String(route + 1));
  52  |       await expect(page.locator('main')).not.toHaveAttribute('data-os-phase-ts', 'waiting');
  53  |     }
  54  |     await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'doorway', { timeout: 30_000 });
  55  |     await page.getByRole('button', { name: 'step through', exact: true }).click();
  56  |     await expect(page.locator('main')).toHaveAttribute('data-chapter', '2');
  57  |     await page.screenshot({ path: info.outputPath('arrival.png') });
  58  |     const entered = await state(page);
  59  |     expect(entered.active).toBe(true);
  60  |     expect(entered.thread).not.toBe('');
  61  |     if (route === 0) {
  62  |       await page.keyboard.press('Escape');
  63  |       await expect.poll(async () => (await state(page)).paused).toBe(true);
  64  |       const held = await state(page);
  65  |       await page.keyboard.down('w');
  66  |       await page.waitForTimeout(450);
  67  |       await page.keyboard.up('w');
  68  |       expect((await state(page)).player).toEqual(held.player);
  69  |       expect((await state(page)).distanceTravelled).toBe(held.distanceTravelled);
  70  |       await page.keyboard.press('Escape');
  71  |     }
  72  |     // Real keyboard navigation; diagnostics are READ ONLY, never teleport or answer hooks.
  73  |     for (let room = 0; room < 3; room += 1) {
  74  |       const kind = ['door', 'monster', 'chest'][(route + room) % 3];
  75  |       const x = { door: -8, monster: 0, chest: 8 }[kind]!;
  76  |       await walk(page, 'x', x);
  77  |       await walk(page, 'z', 2.4);
  78  |       await page.keyboard.press('e');
  79  |       if (kind === 'door') {
  80  |         await expect(page.locator('#echo-answer')).toBeVisible();
  81  |         await page.locator('#echo-answer').fill(`Bot route ${route}, room ${room}: remembered story`);
  82  |         if (route === 0) {
  83  |           await page.locator('#echo-answer').press('Escape');
> 84  |           await expect.poll(async () => (await state(page)).paused).toBe(true);
      |                                                                     ^ Error: expect(received).toBe(expected) // Object.is equality
  85  |           await page.keyboard.press('Escape');
  86  |           await expect(page.locator('#echo-answer')).toBeVisible();
  87  |           await expect(page.locator('#echo-answer')).toHaveValue(`Bot route ${route}, room ${room}: remembered story`);
  88  |         }
  89  |         await page.locator('#echo-answer').press('Enter');
  90  |       }
  91  |       await expect.poll(async () => (await state(page)).phase).toBe('result');
  92  |       await page.screenshot({ path: info.outputPath(`room-${room}-${kind}.png`) });
  93  |       expect((await state(page)).choices).toHaveLength(room + 1);
  94  |       await page.getByRole('button', { name: 'Continue', exact: true }).click();
  95  |       await expect.poll(async () => (await state(page)).phase).toBe(room === 2 ? 'complete' : 'exploring');
  96  |     }
  97  |     const completed = await state(page);
  98  |     expect(completed.guide).not.toBeNull();
  99  |     expect(completed.distanceTravelled).toBeGreaterThan(0);
  100 |     await page.screenshot({ path: info.outputPath('rooms-complete.png') });
  101 |     await info.attach('bot-evidence', { body: JSON.stringify({ route, opening: evidence, entered, completed, errors }, null, 2), contentType: 'application/json' });
  102 |     writeFileSync(info.outputPath('bot-evidence.json'), JSON.stringify({ route, opening: evidence, entered, completed, errors }, null, 2));
  103 |     await page.getByRole('button', { name: 'Restart rooms', exact: true }).click();
  104 |     expect((await state(page)).choices).toEqual([]);
  105 |     expect((await state(page)).distanceTravelled).toBe(0);
  106 |     await page.getByRole('button', { name: /replay boot/ }).click();
  107 |     await expect(page.locator('main')).toHaveAttribute('data-chapter', '1');
  108 |     await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'cursor');
  109 |     expect(errors).toEqual([]);
  110 |   });
  111 | }
  112 | 
```