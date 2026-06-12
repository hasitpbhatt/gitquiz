import { test, expect } from '@playwright/test';
import { setupMocks } from './test-utils.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

test('ai section appears after answering correct', { tag: '@ai' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  await expect(page.locator('#ai-section')).toBeVisible();
  await expect(page.locator('.ai-persona-btn')).toHaveCount(4);
});

test('ai response div hidden initially', { tag: '@ai' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.locator('#ai-response')).toBeHidden();
});

test('all 4 persona buttons have correct labels', { tag: '@ai' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  const buttons = page.locator('.ai-persona-btn');
  await expect(buttons.nth(0)).toHaveText(/Like I'm 10/);
  await expect(buttons.nth(1)).toHaveText(/Deep Dive/);
  await expect(buttons.nth(2)).toHaveText(/First Principles/);
  await expect(buttons.nth(3)).toHaveText(/Socratic Tutor/);
});

test('clicking a persona button triggers AI response area', { tag: '@ai' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  await page.locator('.ai-persona-btn', { hasText: /Deep Dive/ }).click();

  await expect(page.locator('#ai-response')).not.toBeHidden();
});
