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

test('return to catalog button visible on completion', { tag: '@navigation' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await page.click('#next-btn');
  await page.locator('.option-btn', { hasText: 'A group of containers' }).click();
  await page.click('#next-btn');

  await expect(page.locator('text=Return to Catalog')).toBeVisible();
});
