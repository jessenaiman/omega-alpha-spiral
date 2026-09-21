import { defineConfig } from '@playwright/test';
import base from './playwright.config.js';

export default defineConfig({
  ...base,
  outputDir: 'test-results/release',
  use: { ...base.use, baseURL: 'http://127.0.0.1:4188' },
  webServer: {
    command: 'npm run preview',
    url: 'http://127.0.0.1:4188',
    reuseExistingServer: false,
    timeout: 20_000,
  },
});
