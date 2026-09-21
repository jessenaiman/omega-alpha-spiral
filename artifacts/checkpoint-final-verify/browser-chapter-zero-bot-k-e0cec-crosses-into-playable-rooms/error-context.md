# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: browser\chapter-zero-bot.spec.ts >> keyboard bot route 0 crosses into playable rooms
- Location: tests\browser\chapter-zero-bot.spec.ts:26:3

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator:  locator('main')
Expected: "waiting"
Received: "doorway"
Timeout:  30000ms

Call log:
  - Expect "toHaveAttribute" locator('main') with timeout 30000ms
  - waiting for locator('main')
    3 × locator resolved to <main class="os-boot" data-chapter="1" data-os-scene-ts="8" data-os-plate-ts="2" data-os-voice-ts="1" data-os-format-ts="0" data-os-art-ts="ready" data-os-door-ts="ready" data-os-text-ts="three" data-os-started-ts="true" data-os-corrupt-ts="false" data-os-phase-ts="debating">…</main>
      - unexpected value "debating"
    - locator resolved to <main class="os-boot" data-chapter="1" data-os-scene-ts="8" data-os-plate-ts="2" data-os-voice-ts="2" data-os-format-ts="0" data-os-art-ts="ready" data-os-door-ts="ready" data-os-text-ts="three" data-os-started-ts="true" data-os-corrupt-ts="false" data-os-phase-ts="debating">…</main>
    - unexpected value "debating"
    - locator resolved to <main class="os-boot" data-chapter="1" data-os-scene-ts="8" data-os-plate-ts="2" data-os-voice-ts="0" data-os-format-ts="0" data-os-art-ts="ready" data-os-door-ts="ready" data-os-text-ts="three" data-os-started-ts="true" data-os-corrupt-ts="false" data-os-phase-ts="debating">…</main>
    - unexpected value "debating"
    2 × locator resolved to <main class="os-boot" data-chapter="1" data-os-scene-ts="8" data-os-plate-ts="2" data-os-voice-ts="0" data-os-format-ts="0" data-os-art-ts="ready" data-os-door-ts="ready" data-os-text-ts="three" data-os-started-ts="true" data-os-phase-ts="writing" data-os-corrupt-ts="false">…</main>
      - unexpected value "writing"
    56 × locator resolved to <main class="os-boot" data-chapter="1" data-os-scene-ts="8" data-os-plate-ts="2" data-os-voice-ts="0" data-os-format-ts="0" data-os-art-ts="ready" data-os-door-ts="ready" data-os-text-ts="three" data-os-started-ts="true" data-os-phase-ts="doorway" data-os-corrupt-ts="false">…</main>
       - unexpected value "doorway"

```

```yaml
- main:
  - region "An invitation"
  - text: Enter · W · step through
  - button "step through"
  - button "replay boot ↺"
```

# Test source

```ts
  1   | import { expect, test, type Page } from '@playwright/test';
  2   | import { writeFileSync } from 'node:fs';
  3   | interface FieldState { active: boolean; phase: string; roomIndex: number; player: { x: number; z: number }; framesAdvanced: number; distanceTravelled: number; choices: { object: string; answer: string }[]; thread: string; guide: string | null; paused: boolean }
  4   | declare global { interface Window { __CHAPTER_TWO_DIAGNOSTICS__: { getState(): FieldState } } }
  5   | const state = (page: Page): Promise<FieldState> => page.evaluate(() => window.__CHAPTER_TWO_DIAGNOSTICS__.getState());
  6   | test.use({ video: 'on' });
  7   | 
  8   | async function walk(page: Page, axis: 'x' | 'z', target: number): Promise<void> {
  9   |   const before = await state(page);
  10  |   const sign = target > before.player[axis] ? 1 : -1;
  11  |   if (Math.abs(target - before.player[axis]) < 0.2) return;
  12  |   const key = axis === 'x' ? (sign > 0 ? 'd' : 'a') : (sign > 0 ? 's' : 'w');
  13  |   await page.keyboard.down(key);
  14  |   try {
  15  |     await page.waitForFunction(({ axis, target, sign }) => {
  16  |       const s = window.__CHAPTER_TWO_DIAGNOSTICS__.getState();
  17  |       return sign > 0 ? s.player[axis] >= target : s.player[axis] <= target;
  18  |     }, { axis, target, sign }, { timeout: 12_000 });
  19  |   } finally { await page.keyboard.up(key); }
  20  |   const after = await state(page);
  21  |   expect(after.framesAdvanced).toBeGreaterThan(before.framesAdvanced);
  22  |   expect(after.distanceTravelled).toBeGreaterThan(before.distanceTravelled);
  23  | }
  24  | 
  25  | for (const route of [0, 1, 2]) {
  26  |   test(`keyboard bot route ${route} crosses into playable rooms`, async ({ page }, info) => {
  27  |     test.setTimeout(150_000);
  28  |     const errors: string[] = [];
  29  |     if (route === 2) {
  30  |       await page.setViewportSize({ width: 390, height: 844 });
  31  |       await page.emulateMedia({ reducedMotion: 'reduce' });
  32  |     }
  33  |     page.on('pageerror', error => errors.push(error.message));
  34  |     page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  35  |     page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  36  |     await page.goto('/intro.html?debug&pace=20');
  37  |     await expect(page.locator('main')).toHaveAttribute('data-os-art-ts', 'ready');
  38  |     await page.keyboard.press('Enter');
  39  |     const evidence: object[] = [];
  40  |     while (true) {
> 41  |       await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'waiting', { timeout: 30_000 });
      |                                          ^ Error: expect(locator).toHaveAttribute(expected) failed
  42  |       const choiceCount = await page.getByRole('radio').count();
  43  |       expect(choiceCount).toBeGreaterThan(0);
  44  |       const choice = route % choiceCount;
  45  |       evidence.push({ sceneIndex: (await page.evaluate(() => window.__INTRO_DIAGNOSTICS__.getState())).sceneIndex, choice });
  46  |       await page.keyboard.press(String(choice + 1));
  47  |       await expect(page.locator('main')).not.toHaveAttribute('data-os-phase-ts', 'waiting');
  48  |       if ((await page.locator('main').getAttribute('data-os-phase-ts')) === 'doorway') break;
  49  |     }
  50  |     await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'doorway', { timeout: 30_000 });
  51  |     await page.locator('#os-enter-ts').click();
  52  |     await expect(page.locator('main')).toHaveAttribute('data-chapter', '2');
  53  |     await page.screenshot({ path: info.outputPath('arrival.png') });
  54  |     const entered = await state(page);
  55  |     expect(entered.active).toBe(true);
  56  |     expect(entered.thread).not.toBe('');
  57  |     if (route === 0) {
  58  |       await page.keyboard.press('Escape');
  59  |       await expect.poll(async () => (await state(page)).paused).toBe(true);
  60  |       const held = await state(page);
  61  |       await page.keyboard.down('w');
  62  |       await page.waitForTimeout(450);
  63  |       await page.keyboard.up('w');
  64  |       expect((await state(page)).player).toEqual(held.player);
  65  |       expect((await state(page)).distanceTravelled).toBe(held.distanceTravelled);
  66  |       await page.keyboard.press('Escape');
  67  |     }
  68  |     // Real keyboard navigation; diagnostics are READ ONLY, never teleport or answer hooks.
  69  |     let room = 0;
  70  |     while ((await state(page)).phase !== 'complete') {
  71  |       const x = [-8, 0, 8][(route + room) % 3];
  72  |       await walk(page, 'x', x);
  73  |       await walk(page, 'z', 2.4);
  74  |       await page.keyboard.press('e');
  75  |       if ((await state(page)).phase === 'prompt') {
  76  |         await expect(page.locator('#echo-answer')).toBeVisible();
  77  |         const answer = `mechanical answer ${route}-${room}`;
  78  |         await page.locator('#echo-answer').fill(answer);
  79  |         if (route === 0) {
  80  |           await page.locator('#echo-answer').press('Escape');
  81  |           await expect.poll(async () => (await state(page)).paused).toBe(true);
  82  |           await page.keyboard.press('Escape');
  83  |           await expect(page.locator('#echo-answer')).toBeVisible();
  84  |           await expect(page.locator('#echo-answer')).toHaveValue(answer);
  85  |         }
  86  |         await page.locator('#echo-answer').press('Enter');
  87  |       }
  88  |       await expect.poll(async () => (await state(page)).phase).toBe('result');
  89  |       await page.screenshot({ path: info.outputPath(`encounter-${room}.png`) });
  90  |       const choicesBeforeContinue = (await state(page)).choices;
  91  |       expect(choicesBeforeContinue.length).toBeGreaterThan(room);
  92  |       await page.locator('#echo-next').click();
  93  |       if ((await state(page)).phase === 'rewriting') {
  94  |         await expect.poll(async () => (await state(page)).phase).toBe('rewriting');
  95  |         const waiting = await state(page);
  96  |         await expect(page.locator('#echo-script')).toBeVisible();
  97  |         if (route === 0) {
  98  |           await page.keyboard.down('w');
  99  |           await page.waitForTimeout(600);
  100 |           await page.keyboard.up('w');
  101 |           const held = await state(page);
  102 |           expect(held.phase).toBe('rewriting');
  103 |           expect(held.player).toEqual(waiting.player);
  104 |           expect(held.choices).toEqual(waiting.choices);
  105 |           await page.keyboard.press('Escape');
  106 |           await expect(page.locator('#echo-next')).toBeHidden();
  107 |           await page.keyboard.press('Escape');
  108 |         }
  109 |         await page.screenshot({ path: info.outputPath(`rewrite-${room}.png`) });
  110 |         await page.locator('#echo-next').click();
  111 |         await expect.poll(async () => (await state(page)).roomIndex).toBeGreaterThan(waiting.roomIndex);
  112 |         expect((await state(page)).choices).toEqual(waiting.choices);
  113 |       }
  114 |       if ((await state(page)).phase !== 'complete') await expect.poll(async () => (await state(page)).phase).toBe('exploring');
  115 |       room += 1;
  116 |     }
  117 |     const completed = await state(page);
  118 |     expect(completed.distanceTravelled).toBeGreaterThan(0);
  119 |     await page.screenshot({ path: info.outputPath('rooms-complete.png') });
  120 |     await info.attach('bot-evidence', { body: JSON.stringify({ route, opening: evidence, entered, completed, errors }, null, 2), contentType: 'application/json' });
  121 |     writeFileSync(info.outputPath('bot-evidence.json'), JSON.stringify({ route, opening: evidence, entered, completed, errors }, null, 2));
  122 |     await page.locator('#echo-restart').click();
  123 |     expect((await state(page)).choices).toEqual([]);
  124 |     expect((await state(page)).distanceTravelled).toBe(0);
  125 |     await page.locator('#os-replay-ts').click();
  126 |     await expect(page.locator('main')).toHaveAttribute('data-chapter', '1');
  127 |     await expect(page.locator('main')).toHaveAttribute('data-os-phase-ts', 'cursor');
  128 |     expect(errors).toEqual([]);
  129 |   });
  130 | }
  131 | 
```