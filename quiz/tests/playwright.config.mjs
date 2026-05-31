import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.mjs',
  timeout: 30000,
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: 'http://localhost:8765',
    headless: true,
    viewport: { width: 1280, height: 800 },
    screenshot: 'on',
  },
  webServer: {
    command: 'python -m http.server 8765 --directory ../../quiz',
    port: 8765,
    reuseExistingServer: true,
    timeout: 10000,
  },
});
