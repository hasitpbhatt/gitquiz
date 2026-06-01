import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'schema.spec.mjs',
  fullyParallel: true,
  workers: 4,
});
