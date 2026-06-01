import { test, expect } from '@playwright/test';
import { setupMocks } from './test-utils.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

test('course param without q or c starts quiz directly', { tag: '@params' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.locator('#setup-container')).toBeHidden();
  await expect(page.locator('#quiz-flow')).toBeVisible();
});

test('invalid course param shows setup screen', { tag: '@params' }, async ({ page }) => {
  await page.goto('/?course=nonexistent-course');

  await expect(page.locator('#setup-container')).toBeVisible();
});
