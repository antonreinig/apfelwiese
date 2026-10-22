// Durchklick-Tests im Browser gegen ein Deployment (Standard: Live-Version).
// Lokal mit dem installierten Chrome, in GitHub Actions mit dem mitgelieferten Chromium.

import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  // GitHub-Rechner sind langsamer: Elemente dürfen bis zu 20 Sekunden brauchen
  expect: { timeout: 20_000 },
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.BASIS_URL ?? 'https://apfelwiese.app',
    ...devices['Pixel 7'],
    channel: process.env.CI ? undefined : 'chrome',
    locale: 'de-DE',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
})
