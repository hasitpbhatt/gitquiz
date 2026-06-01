import { test, expect } from '@playwright/test';
import { setupMocks } from './test-utils.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

test('catalog type filter "book" shows only book courses', { tag: '@catalog' }, async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#course-dropdown option:not([disabled])');

  await page.click('.type-filter-btn[data-type="book"]');

  const options = page.locator('#course-dropdown option');
  await expect(options).toHaveCount(1);
  await expect(options.first()).toHaveAttribute('value', 'book-atomic-habits');
});

test('catalog search is case insensitive', { tag: '@catalog' }, async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#course-dropdown option:not([disabled])');

  await page.fill('#catalog-search', 'TIM');

  const options = page.locator('#course-dropdown option');
  await expect(options).toHaveCount(1);
  await expect(options.first()).toHaveAttribute('value', 'podcast-tim-ferriss');
});

test('catalog search with hyphens replaced by spaces', { tag: '@catalog' }, async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#course-dropdown option:not([disabled])');

  await page.fill('#catalog-search', 'atomic habits');

  const options = page.locator('#course-dropdown option');
  await expect(options).toHaveCount(1);
  await expect(options.first()).toHaveAttribute('value', 'book-atomic-habits');
});

test('catalog dropdown selectedIndex resets after filter', { tag: '@catalog' }, async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#course-dropdown option:not([disabled])');

  const options = page.locator('#course-dropdown option');
  await expect(options).toHaveCount(4);

  await page.fill('#catalog-search', 'tim');

  const firstOption = options.first();
  await expect(firstOption).toHaveAttribute('value', 'podcast-tim-ferriss');
});
