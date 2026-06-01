import { test, expect } from '@playwright/test';
import { setupMocks } from './test-utils.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

test('setup screen shows catalog after load', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#course-dropdown option:not([disabled])');

  await expect(page.locator('#setup-container')).toBeVisible();
  await expect(page.locator('#course-dropdown option')).toHaveCount(4);
  await expect(page.locator('#course-dropdown')).not.toContainText('Connecting to vault');
});

test('custom URL input toggles visibility', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#url-section')).toHaveCount(0);
  await page.click('#url-toggle-btn', { force: true });
  await expect(page.locator('#url-section')).toBeVisible();
  await page.click('#url-toggle-btn', { force: true });
  await expect(page.locator('#url-section')).toBeHidden();
});

test('fill example populates URL and shows section if hidden', async ({ page }) => {
  await page.goto('/');

  await page.waitForFunction(() => typeof fillExample === 'function');
  await page.evaluate(() => fillExample());
  await expect(page.locator('#quiz-url')).not.toHaveValue('');
  await expect(page.locator('#url-section')).toBeVisible();
});

test('handleStart shows notification when no selection and no URL', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() =>
    document.getElementById('course-dropdown').options.length > 0
  );
  await page.evaluate(() => {
    document.getElementById('course-dropdown').selectedIndex = -1;
  });

  await page.click('text=Open Vault');

  const notification = page.locator('.fixed.bottom-4');
  await expect(notification).toBeVisible();
  await expect(notification).toContainText('Selection Required');
});

test('custom URL loads quiz from pasted GitHub URL', async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#course-dropdown option:not([disabled])');

  await page.click('#url-toggle-btn', { force: true });
  await expect(page.locator('#url-section')).toBeVisible();

  await page.fill('#quiz-url', 'https://raw.githubusercontent.com/hasitpbhatt/gitquiz/main/courses/test-course/001.json');
  await page.evaluate(() => handleStart());

  await page.waitForSelector('.option-btn');
  await expect(page.locator('#question-counter')).toContainText('1 / 2');
});
