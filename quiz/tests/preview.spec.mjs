import { test, expect } from '@playwright/test';
import { setupMocks } from './test-utils.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

test('preview shows correct number of questions', { tag: '@preview' }, async ({ page }) => {
  await page.goto('/?course=test-course&q=1');

  await expect(page.locator('#preview-meta')).toContainText('2 questions');
});

test('preview shows description from first question with q=1', { tag: '@preview' }, async ({ page }) => {
  await page.goto('/?course=test-course&q=1');

  await expect(page.locator('#preview-description-text')).toContainText('deploying a microservices');
});

test('preview with q=2 shows second question description', { tag: '@preview' }, async ({ page }) => {
  await page.goto('/?course=test-course&q=2');

  await expect(page.locator('#preview-description-text')).toContainText('tightly-coupled containers');
});

test('preview Start Quiz button calls initializeQuiz', { tag: '@preview' }, async ({ page }) => {
  await page.goto('/?course=test-course&q=1');

  await page.click('text=Start Quiz');

  await expect(page.locator('#quiz-container')).toBeVisible();
  await expect(page.locator('#question-counter')).toContainText('1 / 2');
  await expect(page.locator('#description-text')).toContainText('deploying a microservices');
});

test('preview Cancel returns to setup', { tag: '@preview' }, async ({ page }) => {
  await page.goto('/?course=test-course&q=1');

  await page.click('text=Cancel');

  await expect(page.locator('#setup-container')).toBeVisible();
});

test('preview renders static option styles', { tag: '@preview' }, async ({ page }) => {
  await page.goto('/?course=test-course&q=1');

  const options = page.locator('#preview-options-bin .preview-option');
  await expect(options.first()).toHaveCSS('cursor', 'default');
});
