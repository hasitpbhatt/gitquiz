import { test, expect } from '@playwright/test';
import { setupLocalMocks } from './test-utils.mjs';

const CATALOG_CONTENT = [
  'book-atomic-habits',
  'podcast-tim-ferriss',
  'coursera-machine-learning',
  'test-course',
].join('\n');
const MOCK_MODULES = {
  '001.json': [
    {
      question: 'What is Kubernetes?',
      description: 'Scenario: You are deploying a microservices application with multiple containers across a cluster.',
      options: ['A VM manager', 'A container orchestrator', 'A database', 'A programming language'],
      answer: 'A container orchestrator',
      explanation: 'Kubernetes automates the deployment, scaling, and management of containerized applications.',
    },
    {
      question: 'What is a Pod?',
      description: 'Scenario: You need to run multiple tightly-coupled containers that share storage and network.',
      options: ['A group of containers', 'A single container', 'A virtual machine', 'A storage volume'],
      answer: 'A group of containers',
      explanation: 'A Pod is the smallest deployable unit that can contain one or more containers.',
    },
  ],
  '002.json': [
    {
      question: 'What is a Service?',
      description: 'Scenario: You want stable networking for your Pods that can scale up and down.',
      options: ['A pod template', 'A network endpoint', 'A storage class', 'A config map'],
      answer: 'A network endpoint',
      explanation: 'Services provide stable network endpoints for accessing Pods.',
    },
    {
      question: 'What is a Deployment?',
      description: 'Scenario: You need to manage Pod replicas with rolling updates and rollbacks.',
      options: ['A pod scheduler', 'A replica manager', 'A volume controller', 'A service mesh'],
      answer: 'A replica manager',
      explanation: 'Deployments manage desired replica counts with update strategies.',
    },
  ],
};

function setupMocks(page) {
  return page.route('**/raw.githubusercontent.com/**', async (route) => {
    const url = route.request().url();

    if (url.includes('courses_list.txt')) {
      return route.fulfill({ body: CATALOG_CONTENT, contentType: 'text/plain' });
    }

    for (const [file, data] of Object.entries(MOCK_MODULES)) {
      if (url.includes(file)) {
        return route.fulfill({ body: JSON.stringify(data), contentType: 'application/json' });
      }
    }

    return route.fulfill({ status: 404, body: 'Not Found' });
  });
}

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
  await setupLocalMocks(page);
});

test('setup screen shows when no params given', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#setup-container')).toBeVisible();
  await expect(page.locator('#preview-container')).toBeHidden();
  await expect(page.locator('#quiz-container')).toBeHidden();
});

test('setup screen shows when q param given without course', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/?q=1');

  await expect(page.locator('#setup-container')).toBeVisible();
  await expect(page.locator('#preview-container')).toBeHidden();
  await expect(page.locator('#quiz-container')).toBeHidden();
});

test('setup screen shows when c param given without course', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/?c=2');

  await expect(page.locator('#setup-container')).toBeVisible();
  await expect(page.locator('#preview-container')).toBeHidden();
  await expect(page.locator('#quiz-container')).toBeHidden();
});

test('preview screen shows with course and q param', { tag: ['@visual', '@preview'] }, async ({ page }) => {
  await page.goto('/?course=test-course&q=1');

  await expect(page.locator('#preview-container')).toBeVisible();
  await expect(page.locator('#setup-container')).toBeHidden();
  await expect(page.locator('#quiz-container')).toBeHidden();

  await expect(page.locator('#preview-badge')).toContainText(/Test Course/i);
  await expect(page.locator('#preview-description-text')).toContainText('deploying a microservices');

  const options = page.locator('#preview-options-bin .preview-option');
  await expect(options).toHaveCount(4);

  await expect(options.first()).toHaveCSS('cursor', 'default');

  await expect(page.getByRole('button', { name: 'Start Quiz' })).toBeVisible();
});

test('preview screen shows for different chapter via c param', { tag: ['@visual', '@preview'] }, async ({ page }) => {
  await page.goto('/?course=test-course&q=1&c=2');

  await expect(page.locator('#preview-container')).toBeVisible();

  await expect(page.locator('#preview-description-text')).toContainText('stable networking');

  const options = page.locator('#preview-options-bin .preview-option');
  await expect(options).toHaveCount(4);
});

test('quiz screen without q param starts quiz directly', { tag: ['@visual', '@quiz'] }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.locator('#quiz-container')).toBeVisible();
  await expect(page.locator('#setup-container')).toBeHidden();
  await expect(page.locator('#preview-container')).toBeHidden();

  await expect(page.locator('#description-text')).toContainText('deploying a microservices');

  const options = page.locator('#options-bin .option-btn');
  await expect(options).toHaveCount(4);
});

test('quiz screen with c param starts from chapter 2', { tag: ['@visual', '@quiz', '@params'] }, async ({ page }) => {
  await page.goto('/?course=test-course&c=2');

  await expect(page.locator('#quiz-container')).toBeVisible();

  await expect(page.locator('#description-text')).toContainText('stable networking');

  const options = page.locator('#options-bin .option-btn');
  await expect(options).toHaveCount(4);
});

test('preview Start Quiz button transitions to quiz screen', { tag: ['@visual', '@preview'] }, async ({ page }) => {
  await page.goto('/?course=test-course&q=1');

  await expect(page.locator('#preview-container')).toBeVisible();

  await page.getByRole('button', { name: 'Start Quiz' }).click();

  await expect(page.locator('#quiz-container')).toBeVisible();
  await expect(page.locator('#preview-container')).toBeHidden();
  await expect(page.locator('#setup-container')).toBeHidden();

  await expect(page.locator('#description-text')).toContainText('deploying a microservices');
});

test('preview Cancel button returns to setup screen', { tag: ['@visual', '@preview'] }, async ({ page }) => {
  await page.goto('/?course=test-course&q=1');

  await expect(page.locator('#preview-container')).toBeVisible();

  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page.locator('#setup-container')).toBeVisible();
  await expect(page.locator('#preview-container')).toBeHidden();
  await expect(page.locator('#quiz-container')).toBeHidden();
});

test('preview topic-title and content-box remain hidden', { tag: ['@visual', '@preview'] }, async ({ page }) => {
  await page.goto('/?course=test-course&q=1');

  await expect(page.locator('#preview-topic-title')).toBeHidden();
  await expect(page.locator('#preview-content-box')).toBeHidden();
});

test('wrong answer highlights correct option and shows explanation', { tag: ['@visual', '@quiz'] }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.locator('#quiz-container')).toBeVisible();
  await expect(page.locator('#score-val')).toHaveText('0');

  await page.locator('.option-btn', { hasText: 'A VM manager' }).click();

  await expect(page.locator('.option-btn.wrong')).toContainText('A VM manager');
  await expect(page.locator('.option-btn.correct')).toContainText('A container orchestrator');
  await expect(page.locator('#explanation')).toBeVisible();
  await expect(page.locator('#next-btn')).toBeVisible();
  await expect(page.locator('#score-val')).toHaveText('0');
});

test('correct answer increases score', { tag: ['@visual', '@quiz'] }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.locator('#quiz-container')).toBeVisible();
  await expect(page.locator('#score-val')).toHaveText('0');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  await expect(page.locator('.option-btn.correct')).toContainText('A container orchestrator');
  await expect(page.locator('#explanation')).toBeVisible();
  await expect(page.locator('#next-btn')).toBeVisible();
  await expect(page.locator('#score-val')).not.toHaveText('0');
});

test('catalog loads and shows all options', { tag: ['@visual', '@catalog'] }, async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#setup-container')).toBeVisible();

  const options = page.locator('#course-dropdown option');
  await expect(options).toHaveCount(4);
  await expect(options.nth(0)).toHaveAttribute('value', 'book-atomic-habits');
  await expect(options.nth(1)).toHaveAttribute('value', 'podcast-tim-ferriss');
  await expect(options.nth(2)).toHaveAttribute('value', 'coursera-machine-learning');
  await expect(options.nth(3)).toHaveAttribute('value', 'test-course');
});

test('catalog text search filters options', { tag: ['@visual', '@catalog'] }, async ({ page }) => {
  await page.goto('/');

  const options = page.locator('#course-dropdown option');
  await expect(options).toHaveCount(4);

  await page.fill('#catalog-search', 'atomic');

  await expect(options).toHaveCount(1);
  await expect(options.first()).toHaveAttribute('value', 'book-atomic-habits');
});

test('catalog type filter shows only matching types', { tag: ['@visual', '@catalog'] }, async ({ page }) => {
  await page.goto('/');

  const options = page.locator('#course-dropdown option');
  await expect(options).toHaveCount(4);

  await page.click('.type-filter-btn[data-type="book"]');
  await expect(options).toHaveCount(1);
  await expect(options.first()).toHaveAttribute('value', 'book-atomic-habits');

  await page.click('.type-filter-btn[data-type="podcast"]');
  await expect(options).toHaveCount(1);
  await expect(options.first()).toHaveAttribute('value', 'podcast-tim-ferriss');

  await page.click('.type-filter-btn[data-type="coursera"]');
  await expect(options).toHaveCount(1);
  await expect(options.first()).toHaveAttribute('value', 'coursera-machine-learning');
});

test('catalog combined search and type filter', { tag: ['@visual', '@catalog'] }, async ({ page }) => {
  await page.goto('/');

  const options = page.locator('#course-dropdown option');
  await expect(options).toHaveCount(4);

  await page.click('.type-filter-btn[data-type="coursera"]');
  await page.fill('#catalog-search', 'learning');

  await expect(options).toHaveCount(1);
  await expect(options.first()).toHaveAttribute('value', 'coursera-machine-learning');

  await page.fill('#catalog-search', 'atomic');
  await expect(page.locator('#course-dropdown')).toContainText('No matches found');
});

test('catalog no matches shows placeholder', { tag: ['@visual', '@catalog'] }, async ({ page }) => {
  await page.goto('/');

  const options = page.locator('#course-dropdown option');
  await expect(options).toHaveCount(4);

  await page.fill('#catalog-search', 'zzzdoesnotexist');

  await expect(page.locator('#course-dropdown')).toContainText('No matches found');
});

test('catalog empty search restores all options', { tag: ['@visual', '@catalog'] }, async ({ page }) => {
  await page.goto('/');

  const options = page.locator('#course-dropdown option');
  await expect(options).toHaveCount(4);

  await page.fill('#catalog-search', 'tim');
  await expect(options).toHaveCount(1);

  await page.fill('#catalog-search', '');
  await expect(options).toHaveCount(4);
});

test('catalog "All" type filter shows everything', { tag: ['@visual', '@catalog'] }, async ({ page }) => {
  await page.goto('/');

  const options = page.locator('#course-dropdown option');
  await expect(options).toHaveCount(4);

  await page.click('.type-filter-btn[data-type="book"]');
  await expect(options).toHaveCount(1);

  await page.click('.type-filter-btn[data-type="all"]');
  await expect(options).toHaveCount(4);
});

test('catalog type filter button active state toggles', { tag: ['@visual', '@catalog'] }, async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.type-filter-btn[data-type="all"]')).toHaveClass(/active/);

  await page.click('.type-filter-btn[data-type="book"]');
  await expect(page.locator('.type-filter-btn[data-type="book"]')).toHaveClass(/active/);
  await expect(page.locator('.type-filter-btn[data-type="all"]')).not.toHaveClass(/active/);

  await page.click('.type-filter-btn[data-type="all"]');
  await expect(page.locator('.type-filter-btn[data-type="all"]')).toHaveClass(/active/);
  await expect(page.locator('.type-filter-btn[data-type="book"]')).not.toHaveClass(/active/);
});

test('preview-badge has title attribute with course name', { tag: ['@visual', '@preview'] }, async ({ page }) => {
  await page.goto('/?course=test-course&q=1');

  const badge = page.locator('#preview-badge');
  await expect(badge).toHaveAttribute('title', 'Test Course');
});

test('preview-title has title attribute with course name and filename', { tag: ['@visual', '@preview'] }, async ({ page }) => {
  await page.goto('/?course=test-course&q=1');

  const title = page.locator('#preview-title');
  await expect(title).toHaveAttribute('title', 'Test Course • 001');
});

test('module-label has title attribute after quiz starts', { tag: ['@visual', '@quiz'] }, async ({ page }) => {
  await page.goto('/?course=test-course&q=1');

  await page.click('text=Start Quiz');

  const label = page.locator('#module-label');
  await expect(label).toHaveAttribute('title', 'Test Course • 001');
});

test('correct/wrong option colors are dark-appropriate in dark mode', { tag: '@visual' }, async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/?course=test-course');
  await page.waitForSelector('.option-btn');

  await page.locator('.option-btn', { hasText: 'A VM manager' }).click();

  const correctBtn = page.locator('.option-btn.correct');
  const wrongBtn = page.locator('.option-btn.wrong');

  const correctBg = await correctBtn.evaluate(el => getComputedStyle(el).backgroundColor);
  const wrongBg = await wrongBtn.evaluate(el => getComputedStyle(el).backgroundColor);

  expect(correctBg).not.toBe('rgb(220, 252, 231)');
  expect(wrongBg).not.toBe('rgb(254, 226, 226)');

  // Label badges (A/B/C/D) should use dark-appropriate colors too, not light-mode gray
  const correctBadge = correctBtn.locator('> span:first-child');
  const wrongBadge = wrongBtn.locator('> span:first-child');
  const correctBadgeBg = await correctBadge.evaluate(el => getComputedStyle(el).backgroundColor);
  const wrongBadgeBg = await wrongBadge.evaluate(el => getComputedStyle(el).backgroundColor);
  expect(correctBadgeBg).toBe('rgb(6, 78, 59)');
  expect(wrongBadgeBg).toBe('rgb(127, 29, 29)');

  // Key-hints should also be dark-appropriate
  const correctHint = correctBtn.locator('.key-hint');
  const wrongHint = wrongBtn.locator('.key-hint');
  const correctHintColor = await correctHint.evaluate(el => getComputedStyle(el).color);
  const wrongHintColor = await wrongHint.evaluate(el => getComputedStyle(el).color);
  expect(correctHintColor).toBe('rgb(110, 231, 183)');
  expect(wrongHintColor).toBe('rgb(252, 165, 165)');
});

test('theme toggle button exists and toggles data-theme and dark class', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#theme-toggle')).toBeVisible();

  const html = page.locator('html');

  await page.locator('#theme-toggle').click();
  const theme1 = await html.getAttribute('data-theme');
  expect(['dark', 'light']).toContain(theme1);
  const hasDark1 = await html.evaluate(el => el.classList.contains('dark'));
  expect(hasDark1).toBe(theme1 === 'dark');

  await page.locator('#theme-toggle').click();
  const theme2 = await html.getAttribute('data-theme');
  expect(theme2).not.toBe(theme1);
  const hasDark2 = await html.evaluate(el => el.classList.contains('dark'));
  expect(hasDark2).toBe(theme2 === 'dark');

  const saved = await page.evaluate(() => localStorage.getItem('quizTheme'));
  expect(saved).toBe(theme2);
});

test('theme toggle persists across page reload', { tag: '@visual' }, async ({ page }) => {
  await page.goto('/');
  await page.locator('#theme-toggle').click();
  const theme = await page.locator('html').getAttribute('data-theme');
  const hasDark = await page.locator('html').evaluate(el => el.classList.contains('dark'));
  expect(hasDark).toBe(theme === 'dark');

  await page.reload();
  await expect(page.locator('#theme-toggle')).toBeVisible();
  const persisted = await page.locator('html').getAttribute('data-theme');
  expect(persisted).toBe(theme);
  const persistedDark = await page.locator('html').evaluate(el => el.classList.contains('dark'));
  expect(persistedDark).toBe(theme === 'dark');
});

test('subtitle text is visible after toggling to light mode in dark system', { tag: '@visual' }, async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await expect(page.locator('#setup-container')).toBeVisible();

  const subtitle = page.locator('#setup-container header p');

  // Initially in dark mode, subtitle should be light (slate-400)
  const initialColor = await subtitle.evaluate(el => getComputedStyle(el).color);
  expect(initialColor).toBe('rgb(148, 163, 184)');

  // Toggle to light mode
  await page.locator('#theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

  // Should now be dark text visible on light bg (slate-500)
  const toggledColor = await subtitle.evaluate(el => getComputedStyle(el).color);
  expect(toggledColor).toBe('rgb(100, 116, 139)');
});
