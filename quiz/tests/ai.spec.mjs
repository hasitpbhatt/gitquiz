import { test, expect } from '@playwright/test';
import { setupMocks } from './test-utils.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

test('ai section appears after answering correct', { tag: '@ai' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  await expect(page.locator('#ai-section')).toBeVisible();
  await expect(page.locator('#explain-more-btn')).toBeVisible();
});

test('ai response div hidden initially', { tag: '@ai' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.locator('#ai-response')).toBeHidden();
});
