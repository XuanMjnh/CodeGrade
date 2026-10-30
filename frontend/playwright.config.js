import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const edge =
  process.platform === 'win32' &&
  existsSync('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe');
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  expect: { timeout: 15000 },
  reporter: 'list',
  use: {
    baseURL: process.env.CG_UI_URL || 'http://127.0.0.1:5173',
    headless: true,
    actionTimeout: 12000,
    navigationTimeout: 15000,
    viewport: { width: 1440, height: 1000 },
    ...(edge ? { channel: 'msedge' } : {}),
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: process.env.CG_UI_URL
    ? undefined
    : {
        command: 'npm run dev -- --host 127.0.0.1 --port 5173 --strictPort',
        url: 'http://127.0.0.1:5173',
        reuseExistingServer: true,
        timeout: 60000,
      },
});
