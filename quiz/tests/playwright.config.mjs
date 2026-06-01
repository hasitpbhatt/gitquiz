import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.mjs',
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://localhost:8765',
    screenshot: 'on',
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
    command: 'python -m http.server 8765 --directory ../../quiz',
    port: 8765,
    reuseExistingServer: false,
    timeout: 10000,
  },
});
