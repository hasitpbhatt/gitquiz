import { test, expect } from '@playwright/test';
import { setupMocks, CATALOG_CONTENT } from './test-utils.mjs';

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

test('catalog type filter "book" shows only book courses', { tag: '@catalog' }, async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#course-dropdown .list-item');

  await page.click('.type-filter-btn[data-type="book"]');

  const options = page.locator('#course-dropdown .list-item');
  await expect(options).toHaveCount(1);
  await expect(options.first()).toHaveAttribute('data-value', 'book-atomic-habits');
});

test('catalog search is case insensitive', { tag: '@catalog' }, async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#course-dropdown .list-item');

  await page.fill('#catalog-search', 'TIM');

  const options = page.locator('#course-dropdown .list-item');
  await expect(options).toHaveCount(1);
  await expect(options.first()).toHaveAttribute('data-value', 'podcast-tim-ferriss');
});

test('catalog search with hyphens replaced by spaces', { tag: '@catalog' }, async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#course-dropdown .list-item');

  await page.fill('#catalog-search', 'atomic habits');

  const options = page.locator('#course-dropdown .list-item');
  await expect(options).toHaveCount(1);
  await expect(options.first()).toHaveAttribute('data-value', 'book-atomic-habits');
});

test('catalog dropdown selectedIndex resets after filter', { tag: '@catalog' }, async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('#course-dropdown .list-item');

  const options = page.locator('#course-dropdown .list-item');
  await expect(options).toHaveCount(4);

  await page.fill('#catalog-search', 'tim');

  const firstOption = options.first();
  await expect(firstOption).toHaveAttribute('data-value', 'podcast-tim-ferriss');
});

test('new courses show NEW badge when not seen before', { tag: '@catalog' }, async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('quizSeenCourses', '[]'));
  await page.reload();
  await page.waitForSelector('#course-dropdown .list-item');

  const options = page.locator('#course-dropdown .list-item');
  const count = await options.count();
  for (let i = 0; i < count; i++) {
    const html = await options.nth(i).innerHTML();
    expect(html).toContain('NEW');
  }
});

test('seen courses do not show NEW badge', { tag: '@catalog' }, async ({ page }) => {
  const allSeen = CATALOG_CONTENT.trim().split('\n');
  await page.goto('/');
  await page.evaluate((ids) => localStorage.setItem('quizSeenCourses', JSON.stringify(ids)), allSeen);
  await page.reload();
  await page.waitForSelector('#course-dropdown .list-item');

  const options = page.locator('#course-dropdown .list-item');
  const count = await options.count();
  for (let i = 0; i < count; i++) {
    const html = await options.nth(i).innerHTML();
    expect(html).not.toContain('NEW');
  }
});

test('new courses sort before seen courses', { tag: '@catalog' }, async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('quizSeenCourses', JSON.stringify(['book-atomic-habits', 'test-course'])));
  await page.reload();
  await page.waitForSelector('#course-dropdown .list-item');

  const options = page.locator('#course-dropdown .list-item');
  await expect(options.nth(0)).toHaveAttribute('data-value', 'podcast-tim-ferriss');
  await expect(options.nth(1)).toHaveAttribute('data-value', 'coursera-machine-learning');
  await expect(options.nth(2)).toHaveAttribute('data-value', 'book-atomic-habits');
  await expect(options.nth(3)).toHaveAttribute('data-value', 'test-course');
});

test('markCourseSeen called when opening a course from dropdown', { tag: '@catalog' }, async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('quizSeenCourses', '[]'));
  await page.reload();
  await page.waitForSelector('#course-dropdown .list-item');

  await page.click('#course-dropdown .list-item[data-value="book-atomic-habits"]');
  await page.click('#begin-btn-wrapper button');
  await page.waitForSelector('#preview-container:not(.hidden)');

  const seen = await page.evaluate(() => JSON.parse(localStorage.getItem('quizSeenCourses')));
  expect(seen).toContain('book-atomic-habits');
});
