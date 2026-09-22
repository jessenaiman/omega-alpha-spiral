import { expect, test, type Page, type TestInfo } from '@playwright/test';

interface BotState {
  frame: number;
  storyMode: string;
  canContinue: boolean;
  pendingChoice: number;
  objectiveProgress: number;
  complete: boolean;
  playerPosition: { x: number; y: number; z: number };
  choiceTargets: Array<{ x: number; y: number; z: number }>;
  physics: { ready: boolean; bodies: number; colliders: number; sensors: number; activeSensors: number; steps: number };
}

interface BotMetrics {
  choices: number[];
  framesAdvanced: number;
  distanceTravelled: number;
  physicsSteps: number;
  softlockWindows: number;
  consoleErrors: string[];
}

test.use({ video: 'on' });

async function readState(page: Page): Promise<BotState> {
  return page.evaluate((): BotState => {
    const diagnostics = (window as unknown as { __THREE_GAME_DIAGNOSTICS__?: { state: BotState } }).__THREE_GAME_DIAGNOSTICS__;
    if (!diagnostics) throw new Error('Intro diagnostics are unavailable');
    return diagnostics.state;
  });
}

async function steer(page: Page, targetX: () => Promise<number>, until: (state: BotState) => boolean, metrics: BotMetrics): Promise<void> {
  let horizontal: 'ArrowLeft' | 'ArrowRight' | null = null;
  let previous: BotState = await readState(page);
  let stationarySamples: number = 0;
  await page.keyboard.down('ArrowUp');
  try {
    for (let sample: number = 0; sample < 180; sample += 1) {
      const state: BotState = await readState(page);
      if (until(state)) return;
      const x: number = await targetX();
      const dx: number = x - state.playerPosition.x;
      const desired: 'ArrowLeft' | 'ArrowRight' | null = Math.abs(dx) < 0.11 ? null : dx < 0 ? 'ArrowLeft' : 'ArrowRight';
      if (desired !== horizontal) {
        if (horizontal) await page.keyboard.up(horizontal);
        horizontal = desired;
        if (horizontal) await page.keyboard.down(horizontal);
      }
      const distance: number = Math.hypot(
        state.playerPosition.x - previous.playerPosition.x,
        state.playerPosition.y - previous.playerPosition.y,
        state.playerPosition.z - previous.playerPosition.z,
      );
      metrics.distanceTravelled += distance;
      if (state.frame > previous.frame && distance < 0.001) stationarySamples += 1;
      else stationarySamples = 0;
      if (stationarySamples >= 10) {
        metrics.softlockWindows += 1;
        stationarySamples = 0;
      }
      previous = state;
      await page.waitForTimeout(45);
    }
  } finally {
    await page.keyboard.up('ArrowUp');
    if (horizontal) await page.keyboard.up(horizontal);
  }
  throw new Error('Bot failed to reach the next narrative sensor');
}

test('observable bot steers through four answer routes and steps through the final door', async ({ page }, testInfo: TestInfo) => {
  test.setTimeout(120_000);
  const consoleErrors: string[] = [];
  page.on('pageerror', (error: Error): void => { consoleErrors.push(error.message); });
  page.on('console', (message): void => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/intro.html?debug');
  await expect(page.locator('main')).toHaveAttribute('data-os-art-ts', 'ready');
  await expect(page.locator('main')).toHaveAttribute('data-os-physics-ts', 'ready');
  await page.keyboard.press('Enter');
  await expect.poll(async (): Promise<string> => (await readState(page)).storyMode).toBe('waiting');

  const initial: BotState = await readState(page);
  const metrics: BotMetrics = {
    choices: [0, 1, 2, 0], framesAdvanced: 0, distanceTravelled: 0,
    physicsSteps: 0, softlockWindows: 0, consoleErrors,
  };

  for (let question: number = 0; question < metrics.choices.length; question += 1) {
    const choice: number = metrics.choices[question];
    await steer(
      page,
      async (): Promise<number> => (await readState(page)).choiceTargets[choice].x,
      (state: BotState): boolean => state.storyMode === 'response' || state.pendingChoice === choice,
      metrics,
    );
    const reached: BotState = await readState(page);
    if (reached.storyMode === 'waiting' && reached.pendingChoice === choice) await page.keyboard.press('Enter');
    await expect.poll(async (): Promise<string> => (await readState(page)).storyMode).toBe('response');
    await expect.poll(async (): Promise<boolean> => (await readState(page)).canContinue).toBe(true);
    await page.keyboard.press('Enter');
    if (question < metrics.choices.length - 1) {
      await expect.poll(async (): Promise<string> => (await readState(page)).storyMode).toBe('travel');
      await steer(page, async (): Promise<number> => 0, (state: BotState): boolean => state.storyMode !== 'travel', metrics);
      await expect.poll(async (): Promise<boolean> => (await readState(page)).canContinue).toBe(true);
      await page.keyboard.press('Enter');
      await expect.poll(async (): Promise<string> => (await readState(page)).storyMode).toBe('waiting');
    }
  }

  await expect.poll(async (): Promise<string> => (await readState(page)).storyMode).toBe('doorway');
  await page.locator('#os-enter-ts').click();
  await expect.poll(async (): Promise<boolean> => (await readState(page)).complete).toBe(true);
  const final: BotState = await readState(page);
  metrics.framesAdvanced = final.frame - initial.frame;
  metrics.physicsSteps = final.physics.steps;
  await testInfo.attach('intro-bot-metrics.json', {
    body: JSON.stringify(metrics, null, 2), contentType: 'application/json',
  });
  console.info(`INTRO_BOT_METRICS ${JSON.stringify(metrics)}`);

  expect(final.objectiveProgress).toBe(4);
  expect(final.physics.ready).toBe(true);
  expect(final.physics.bodies).toBe(5);
  expect(final.physics.colliders).toBe(5);
  expect(final.physics.sensors).toBe(4);
  expect(metrics.framesAdvanced).toBeGreaterThan(30);
  expect(metrics.distanceTravelled).toBeGreaterThan(12);
  expect(metrics.physicsSteps).toBeGreaterThan(60);
  expect(metrics.softlockWindows).toBe(0);
  expect(consoleErrors).toEqual([]);
});
