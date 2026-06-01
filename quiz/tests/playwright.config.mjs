import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.mjs',
  timeout: 30000,
  fullyParallel: true,
  workers: 4,
  retries: 0,
  use: {
    baseURL: 'http://localhost:8765',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      testIgnore: 'schema.spec.mjs',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 },
      },
    },
    {
      name: 'mobile',
      testIgnore: 'schema.spec.mjs',
      use: {
        ...devices['Pixel 5'],
      },
    },
  ],
  webServer: {
    command: 'node serve.mjs',
    port: 8765,
    reuseExistingServer: true,
    timeout: 10000,
  },
});
