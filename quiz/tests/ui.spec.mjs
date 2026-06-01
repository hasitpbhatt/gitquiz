import { test, expect } from '@playwright/test';
import { setupMocks } from './test-utils.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

test('share button is visible on setup screen', { tag: '@ui' }, async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#share-btn')).toBeVisible();
});

test('share button opens share setup modal on setup screen', { tag: '@ui' }, async ({ page }) => {
  await page.goto('/');

  await page.click('#share-btn');

  await expect(page.locator('text=Share Quiz Portal')).toBeVisible();
  await expect(page.locator('text=Copy Link')).toBeVisible();
  await expect(page.locator('text=Download Image')).toBeVisible();
});

test('share modal close button removes modal', { tag: '@ui' }, async ({ page }) => {
  await page.goto('/');

  await page.click('#share-btn');
  await expect(page.locator('text=Share Quiz Portal')).toBeVisible();

  await page.click('button:has-text("Close")');
  await expect(page.locator('text=Share Quiz Portal')).toBeHidden();
});

test('share modal on quiz screen shows question share', { tag: '@ui' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await page.click('#share-btn');

  await expect(page.locator('text=Share Quiz Portal')).toBeHidden();
});

test('error overlay shows on invalid module', { tag: '@ui' }, async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.goto('/?course=test-course&c=999');

  await expect(page.locator('#error-overlay')).toBeVisible();
  await expect(page.locator('#error-message')).toContainText('404');
});

test('error message displayed when module fetch fails', { tag: '@ui' }, async ({ page }) => {
  await page.goto('/?course=test-course&c=555');

  await expect(page.locator('#error-overlay')).toBeVisible();
  await expect(page.locator('#error-message')).toContainText('404');
});

test('score, streak, and timer stats grid visible during quiz', { tag: '@ui' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.locator('#score-val')).toBeVisible();
  await expect(page.locator('#streak-val')).toBeVisible();
  await expect(page.locator('#timer-val')).toBeVisible();
});

test('menu button visible during quiz', { tag: '@ui' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.getByRole('button', { name: '← Menu' })).toBeVisible();
});

test('skip module button visible during quiz', { tag: '@ui' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.locator('text=Skip Module')).toBeVisible();
});

test('achievement card template exists in DOM', { tag: '@ui' }, async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#achievement-card-template')).toBeVisible();
});

test('ach-cert-name has default value', { tag: '@ui' }, async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#ach-cert-name')).toContainText('Explorer Name');
});
