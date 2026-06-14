import { test, expect } from '@playwright/test';
import { setupMocks, setupSingleQuestionMock } from './test-utils.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

test('next button advances to next question', { tag: '@navigation' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await page.click('#next-btn');

  await expect(page.locator('#description-text')).toContainText('tightly-coupled containers');
});

test('completing all questions shows completion screen', { tag: '@navigation' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await page.click('#next-btn');

  await page.locator('.option-btn', { hasText: 'A group of containers' }).click();
  await page.click('#next-btn');

  await expect(page.locator('#completion-screen')).toBeVisible();
  await expect(page.locator('#final-score-val')).not.toHaveText('0');
  await expect(page.locator('#final-timer-val')).toBeVisible();
});

test('skip module attempts to load next module', { tag: '@navigation' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await page.click('#next-btn');

  await page.locator('.option-btn', { hasText: 'A group of containers' }).click();
  await page.click('#next-btn');

  await expect(page.locator('#completion-screen')).toBeVisible();
  await expect(page.locator('#transition-actions')).toContainText('Next Module');
});

test('completion screen shows mastery message when no next module', { tag: '@navigation' }, async ({ page }) => {
  await setupSingleQuestionMock(page);
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  const options = page.locator('.option-btn');
  await expect(options).toHaveCount(4);

  await page.locator('.option-btn', { hasText: 'Option A' }).click();
  await page.click('#next-btn');

  await expect(page.locator('#completion-screen')).toBeVisible();
  await expect(page.locator('#completion-title')).toContainText('Course Track Completed');
  await expect(page.locator('#transition-actions')).toContainText('Mastery Complete');
});

test('download achievement card button visible on completion', { tag: '@navigation' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await page.click('#next-btn');
  await page.locator('.option-btn', { hasText: 'A group of containers' }).click();
  await page.click('#next-btn');

  await expect(page.locator('text=Download Achievement Card')).toBeVisible();
});

test('module chaining loads next module after completion', { tag: '@navigation' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await page.click('#next-btn');
  await page.locator('.option-btn', { hasText: 'A group of containers' }).click();
  await page.click('#next-btn');

  await expect(page.locator('#completion-screen')).toBeVisible();
  await expect(page.locator('#transition-actions')).toContainText('Start Next Module');

  await page.locator('text=Start Next Module').click();
  await page.waitForSelector('.option-btn', { timeout: 5000 });

  await expect(page.locator('#description-text')).toContainText('stable networking');
  await expect(page.locator('#question-counter')).toContainText('1 / 1');
});

test('return to catalog button visible on completion', { tag: '@navigation' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await page.click('#next-btn');
  await page.locator('.option-btn', { hasText: 'A group of containers' }).click();
  await page.click('#next-btn');

  await expect(page.locator('text=Return to Catalog')).toBeVisible();
});

test('chapter-end lifeline bonus notification when token unused', { tag: '@navigation' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await page.click('#next-btn');
  await page.locator('.option-btn', { hasText: 'A group of containers' }).click();
  await page.click('#next-btn');

  await expect(page.locator('h4:has-text("Lifeline Bonus")')).toBeVisible();
});

test('lifeline state marked as used after chapter-end bonus', { tag: '@navigation' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await page.click('#next-btn');
  await page.locator('.option-btn', { hasText: 'A group of containers' }).click();
  await page.click('#next-btn');

  const llState = await page.evaluate(() => JSON.parse(localStorage.getItem('quizLifelines')));
  expect(llState['test-course_001'].fifty).toBe(true);
});

test('no lifeline bonus when token already used', { tag: '@navigation' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await page.locator('#lifeline-btn').click();
  await page.locator('.option-btn:not(.option-dimmed)').first().click();
  await page.click('#next-btn');
  await page.locator('.option-btn', { hasText: 'A group of containers' }).click();
  await page.click('#next-btn');

  await expect(page.locator('h4:has-text("Lifeline Bonus")')).toHaveCount(0);
});
