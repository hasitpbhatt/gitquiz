import { test, expect } from '@playwright/test';
import { setupMocks } from './test-utils.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

test('preview shows correct number of questions', { tag: '@preview' }, async ({ page }) => {
  await page.goto('/?course=test-course&q=1');
  await expect(page.locator('#preview-meta')).not.toBeEmpty();

  await expect(page.locator('#preview-meta')).toContainText('2 questions');
});

test('preview shows summary card with difficulty tally', { tag: '@preview' }, async ({ page }) => {
  await page.goto('/?course=test-course&q=1');
  await expect(page.locator('#preview-meta')).not.toBeEmpty();

  await expect(page.locator('#preview-summary')).toBeVisible();
  // 001.json has 1 easy + 1 medium
  await expect(page.locator('#summary-difficulty')).toBeVisible();
  await expect(page.locator('#summary-difficulty-text')).toHaveText('1 easy · 1 medium');
});

test('preview summary card shows course-level overview regardless of q param', { tag: '@preview' }, async ({ page }) => {
  await page.goto('/?course=test-course&q=2');
  await expect(page.locator('#preview-meta')).not.toBeEmpty();

  // Summary card is course-level, not question-specific
  await expect(page.locator('#preview-summary')).toBeVisible();
  await expect(page.locator('#summary-difficulty')).toBeVisible();
  await expect(page.locator('#summary-difficulty-text')).toHaveText('1 easy · 1 medium');
});

test('preview Start Quiz button calls initializeQuiz', { tag: '@preview' }, async ({ page }) => {
  await page.goto('/?course=test-course&q=1');
  await expect(page.locator('#preview-meta')).not.toBeEmpty();

  await page.click('text=Start Quiz');

  await expect(page.locator('#quiz-container')).toBeVisible();
  await expect(page.locator('#question-counter')).toContainText('1 / 2');
  await expect(page.locator('#description-text')).toContainText('deploying a microservices');
});

test('preview Cancel returns to setup', { tag: '@preview' }, async ({ page }) => {
  await page.goto('/?course=test-course&q=1');
  await expect(page.locator('#preview-meta')).not.toBeEmpty();

  await page.click('text=Cancel');

  await expect(page.locator('#setup-container')).toBeVisible();
});

test('preview hides description and options when showing summary card', { tag: '@preview' }, async ({ page }) => {
  await page.goto('/?course=test-course&q=1');
  await expect(page.locator('#preview-meta')).not.toBeEmpty();

  await expect(page.locator('#preview-description-text')).toBeHidden();
  await expect(page.locator('#preview-options-bin')).toBeHidden();
});

test('course+c params load specific chapter summary card', { tag: '@preview' }, async ({ page }) => {
  await page.goto('/?course=test-course&c=002&q=1');
  await expect(page.locator('#preview-meta')).not.toBeEmpty();

  await expect(page.locator('#preview-container')).toBeVisible();
  await expect(page.locator('#quiz-container')).toBeHidden();
  await expect(page.locator('#setup-container')).toBeHidden();
  await expect(page.locator('#preview-summary')).toBeVisible();
  // 002.json has 1 easy question
  await expect(page.locator('#summary-difficulty')).toBeVisible();
  await expect(page.locator('#summary-difficulty-text')).toHaveText('1 easy');
});

test('course+c+q params start quiz from correct chapter after clicking Start Quiz', { tag: '@preview' }, async ({ page }) => {
  await page.goto('/?course=test-course&c=002&q=1');
  await expect(page.locator('#preview-meta')).not.toBeEmpty();

  await page.click('text=Start Quiz');

  await expect(page.locator('#quiz-container')).toBeVisible();
  await expect(page.locator('#preview-container')).toBeHidden();
  await expect(page.locator('#question-counter')).toContainText('1 / 1');
  await expect(page.locator('#description-text')).toContainText('stable networking');
});

test('preview shows chapter grid for multi-chapter course', { tag: '@preview' }, async ({ page }) => {
  await page.goto('/?course=test-course&q=1');
  await expect(page.locator('#preview-meta')).not.toBeEmpty();

  const grid = page.locator('#preview-chapter-grid');
  await expect(grid).toBeVisible();
  const buttons = grid.locator('.chapter-btn');
  await expect(buttons).toHaveCount(2);
  await expect(buttons.nth(0)).toHaveText('1');
  await expect(buttons.nth(1)).toHaveText('2');
});

test('preview chapter grid highlights current chapter', { tag: '@preview' }, async ({ page }) => {
  await page.goto('/?course=test-course&c=002&q=1');
  await expect(page.locator('#preview-meta')).not.toBeEmpty();

  const activeBtn = page.locator('#preview-chapter-grid .chapter-btn-active');
  await expect(activeBtn).toHaveCount(1);
  await expect(activeBtn).toHaveText('2');
});

test('preview chapter grid click starts quiz from selected chapter', { tag: '@preview' }, async ({ page }) => {
  await page.goto('/?course=test-course&q=1');
  await expect(page.locator('#preview-meta')).not.toBeEmpty();

  await page.locator('#preview-chapter-grid .chapter-btn').nth(1).click();

  await expect(page.locator('#quiz-container')).toBeVisible();
  await expect(page.locator('#question-counter')).toContainText('1 / 1');
  await expect(page.locator('#description-text')).toContainText('stable networking');
});
