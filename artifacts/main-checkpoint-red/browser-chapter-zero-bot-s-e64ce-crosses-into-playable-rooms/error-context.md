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

Expected: 1
Received: undefined
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
    - paragraph [ref=e11]: What is the first story you ever loved?
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test';
  2   | import { readFileSync, writeFileSync } from 'node:fs';
  3   | const runtime = JSON.parse(readFileSync(new URL('../../src/intro/ghost-script.json', import.meta.url), 'utf8'));
  4   | 
  5   | const source = JSON.parse(readFileSync(new URL('../../project-management/official game docs (read-only)/chapter-zero-stages/stage_1_opening/ghost.json', import.meta.url), 'utf8'));
  6   | interface FieldState { active: boolean; phase: string; roomIndex: number; scriptRevision: number; player: { x: number; z: number }; framesAdvanced: number; distanceTravelled: number; choices: { object: string; answer: string }[]; thread: string; guide: string | null; paused: boolean }
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
  44  |     const revisions: object[] = [];
  45  |     for (const scene of source.scenes) {
  46  |       if (!scene.choice) continue;
  47  |       await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'waiting', { timeout: 30_000 });
  48  |       const question = (Array.isArray(scene.choice.question) ? scene.choice.question.join('\n') : scene.choice.question).replace(/\[[^|\]]+\|([^\]]+)\]/g, '$1');
  49  |       await expect(page.locator('#os-question-ts')).toHaveText(question);
  50  |       await expect(page.locator('.os-choice-copy')).toHaveText(scene.choice.options.map((option: { text: string }) => option.text));
  51  |       evidence.push({ scene: scene.id, option: route, text: scene.choice.options[route].text });
  52  |       await page.keyboard.press(String(route + 1));
  53  |       await expect(page.locator('main')).not.toHaveAttribute('data-os-phase-ts', 'waiting');
  54  |     }
  55  |     await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'doorway', { timeout: 30_000 });
  56  |     await page.getByRole('button', { name: 'step through', exact: true }).click();
  57  |     await expect(page.locator('main')).toHaveAttribute('data-chapter', '2');
  58  |     await page.screenshot({ path: info.outputPath('arrival.png') });
  59  |     const entered = await state(page);
  60  |     expect(entered.active).toBe(true);
  61  |     expect(entered.thread).not.toBe('');
  62  |     if (route === 0) {
  63  |       await page.keyboard.press('Escape');
  64  |       await expect.poll(async () => (await state(page)).paused).toBe(true);
  65  |       const held = await state(page);
  66  |       await page.keyboard.down('w');
  67  |       await page.waitForTimeout(450);
  68  |       await page.keyboard.up('w');
  69  |       expect((await state(page)).player).toEqual(held.player);
  70  |       expect((await state(page)).distanceTravelled).toBe(held.distanceTravelled);
  71  |       await page.keyboard.press('Escape');
  72  |     }
  73  |     // Real keyboard navigation; diagnostics are READ ONLY, never teleport or answer hooks.
  74  |     for (let room = 0; room < 3; room += 1) {
  75  |       const kind = ['door', 'monster', 'chest'][(route + room) % 3];
  76  |       const x = { door: -8, monster: 0, chest: 8 }[kind]!;
  77  |       await walk(page, 'x', x);
  78  |       await walk(page, 'z', 2.4);
  79  |       await page.keyboard.press('e');
  80  |       if (kind === 'door') {
  81  |         await expect(page.locator('#echo-answer')).toBeVisible();
  82  |         await page.locator('#echo-answer').fill(`Bot route ${route}, room ${room}: remembered story`);
  83  |         if (route === 0) {
  84  |           await page.locator('#echo-answer').press('Escape');
  85  |           await expect.poll(async () => (await state(page)).paused).toBe(true);
  86  |           await page.keyboard.press('Escape');
  87  |           await expect(page.locator('#echo-answer')).toBeVisible();
  88  |           await expect(page.locator('#echo-answer')).toHaveValue(`Bot route ${route}, room ${room}: remembered story`);
  89  |         }
  90  |         await page.locator('#echo-answer').press('Enter');
  91  |       }
  92  |       await expect.poll(async () => (await state(page)).phase).toBe('result');
  93  |       await page.screenshot({ path: info.outputPath(`room-${room}-${kind}.png`) });
  94  |       expect((await state(page)).choices).toHaveLength(room + 1);
  95  |       await page.getByRole('button', { name: 'Continue', exact: true }).click();
  96  |       if (room < 2) {
  97  |         await expect.poll(async () => (await state(page)).phase).toBe('rewriting');
  98  |         const waiting = await state(page);
> 99  |         expect(waiting.scriptRevision).toBe(room + 1);
      |                                        ^ Error: expect(received).toBe(expected) // Object.is equality
  100 |         await expect(page.locator('#echo-script')).toBeVisible();
  101 |         await expect(page.locator('#echo-script')).toContainText(`REVISION=${room + 2}`);
  102 |         await expect(page.locator('#echo-script')).toContainText(`DUNGEON_MASTER="${['Shadow', 'Ambition'][room]}"`);
  103 |         if (route === 0) {
  104 |           await page.keyboard.down('w');
  105 |           await page.waitForTimeout(600);
  106 |           await page.keyboard.up('w');
  107 |           const held = await state(page);
  108 |           expect(held.phase).toBe('rewriting');
  109 |           expect(held.player).toEqual(waiting.player);
  110 |           expect(held.choices).toEqual(waiting.choices);
  111 |           await page.keyboard.press('Escape');
  112 |           await expect(page.getByRole('button', { name: 'Reboot into next floor' })).toBeHidden();
  113 |           await page.keyboard.press('Escape');
  114 |         }
  115 |         revisions.push({ current: waiting.scriptRevision, next: room + 2, script: await page.locator('#echo-script').innerText() });
  116 |         await page.screenshot({ path: info.outputPath(`rewrite-${room + 2}.png`) });
  117 |         await page.getByRole('button', { name: 'Reboot into next floor', exact: true }).click();
  118 |         await expect.poll(async () => (await state(page)).scriptRevision).toBe(room + 2);
  119 |         expect((await state(page)).choices).toEqual(waiting.choices);
  120 |       }
  121 |       await expect.poll(async () => (await state(page)).phase).toBe(room === 2 ? 'complete' : 'exploring');
  122 |     }
  123 |     const completed = await state(page);
  124 |     expect(completed.guide).not.toBeNull();
  125 |     expect(completed.distanceTravelled).toBeGreaterThan(0);
  126 |     await page.screenshot({ path: info.outputPath('rooms-complete.png') });
  127 |     await info.attach('bot-evidence', { body: JSON.stringify({ route, opening: evidence, entered, completed, errors }, null, 2), contentType: 'application/json' });
  128 |     writeFileSync(info.outputPath('bot-evidence.json'), JSON.stringify({ route, opening: evidence, revisions, entered, completed, errors }, null, 2));
  129 |     await page.getByRole('button', { name: 'Restart rooms', exact: true }).click();
  130 |     expect((await state(page)).choices).toEqual([]);
  131 |     expect((await state(page)).distanceTravelled).toBe(0);
  132 |     await page.getByRole('button', { name: /replay boot/ }).click();
  133 |     await expect(page.locator('main')).toHaveAttribute('data-chapter', '1');
  134 |     await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'cursor');
  135 |     expect(errors).toEqual([]);
  136 |   });
  137 | }
  138 | 
```