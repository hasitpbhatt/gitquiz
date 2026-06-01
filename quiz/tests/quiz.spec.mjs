import { test, expect } from '@playwright/test';
import { setupMocks } from './test-utils.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

test('quiz initializes with progress bar at start', { tag: '@quiz' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await expect(page.locator('#progress-fill')).toBeVisible();
});

test('quiz progress bar updates on next', { tag: '@quiz' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await page.click('#next-btn');

  await expect(page.locator('#question-counter')).toContainText('2 / 2');
});

test('quiz timer starts on initialization', { tag: '@quiz' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  const timerVal = page.locator('#timer-val');
  await expect(timerVal).toBeVisible();

  await page.waitForTimeout(1500);
  const text = await timerVal.textContent();
  expect(text).not.toBe('00:00');
});

test('score display updates on correct answer', { tag: '@quiz' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  const scoreVal = page.locator('#score-val');
  await expect(scoreVal).toHaveText('0');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await expect(scoreVal).not.toHaveText('0');
});

test('streak increments on consecutive correct answers', { tag: '@quiz' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  const streakVal = page.locator('#streak-val');
  await expect(streakVal).toHaveText('0');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await expect(streakVal).toHaveText('1');

  await page.click('#next-btn');
  await page.locator('.option-btn', { hasText: 'A group of containers' }).click();
  await expect(streakVal).toHaveText('2');
});

test('streak resets on wrong answer', { tag: '@quiz' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await expect(page.locator('#streak-val')).toHaveText('1');

  await page.click('#next-btn');
  await page.locator('.option-btn', { hasText: 'A virtual machine' }).click();
  await expect(page.locator('#streak-val')).toHaveText('0');
});

test('wrong answer highlights correct option', { tag: '@quiz' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await page.locator('.option-btn', { hasText: 'A VM manager' }).click();

  await expect(page.locator('.option-btn.correct')).toContainText('A container orchestrator');
  await expect(page.locator('.option-btn.wrong')).toContainText('A VM manager');
});

test('explanation appears after answering', { tag: '@quiz' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await expect(page.locator('#explanation')).toBeHidden();

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  await expect(page.locator('#explanation')).toBeVisible();
  await expect(page.locator('#explanation')).toContainText('Expert Feedback');
});

test('next button appears after answering', { tag: '@quiz' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await expect(page.locator('#next-btn')).toBeHidden();

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  await expect(page.locator('#next-btn')).toBeVisible();
});

test('topic-title appears after answering', { tag: '@quiz' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  await expect(page.locator('#topic-title')).toBeVisible();
  await expect(page.locator('#topic-title')).toContainText('What is Kubernetes');
});

test('content-box appears after answering when content exists', { tag: '@quiz' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await expect(page.locator('#content-box')).toBeHidden();

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  await expect(page.locator('#content-box')).toBeVisible();
  await expect(page.locator('#content-box')).toContainText('container orchestration');
});

test('options disabled after selection', { tag: '@quiz' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  const options = page.locator('.option-btn');
  await expect(options.first()).toBeEnabled();

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  await expect(options.first()).toBeDisabled();
});

test('module-label displays course name and chapter', { tag: '@quiz' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  const label = page.locator('#module-label');
  await expect(label).toContainText(/Test Course/i);
});

test('quiz renders with question counter', { tag: '@quiz' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await expect(page.locator('#question-counter')).toContainText('1 / 2');
});

test('quiz renders all 4 options', { tag: '@quiz' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await expect(page.locator('#options-bin .option-btn')).toHaveCount(4);
});

test('score increases by base 100 points for correct answer', { tag: '@quiz' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  const scoreText = await page.locator('#score-val').textContent();
  const scoreNum = parseInt(scoreText.replace(/,/g, ''), 10);
  expect(scoreNum).toBeGreaterThanOrEqual(100);
  expect(scoreNum).toBeLessThanOrEqual(150);
});
