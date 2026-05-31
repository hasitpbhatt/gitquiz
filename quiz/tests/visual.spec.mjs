import { test, expect } from '@playwright/test';

const CATALOG_CONTENT = 'test-course';
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
});

test('setup screen shows when no params given', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#setup-container')).toBeVisible();
  await expect(page.locator('#preview-container')).toBeHidden();
  await expect(page.locator('#quiz-container')).toBeHidden();
});

test('setup screen shows when q param given without course', async ({ page }) => {
  await page.goto('/?q=1');

  await expect(page.locator('#setup-container')).toBeVisible();
  await expect(page.locator('#preview-container')).toBeHidden();
  await expect(page.locator('#quiz-container')).toBeHidden();
});

test('setup screen shows when c param given without course', async ({ page }) => {
  await page.goto('/?c=2');

  await expect(page.locator('#setup-container')).toBeVisible();
  await expect(page.locator('#preview-container')).toBeHidden();
  await expect(page.locator('#quiz-container')).toBeHidden();
});

test('preview screen shows with course and q param', async ({ page }) => {
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

test('preview screen shows for different chapter via c param', async ({ page }) => {
  await page.goto('/?course=test-course&q=1&c=2');

  await expect(page.locator('#preview-container')).toBeVisible();

  await expect(page.locator('#preview-description-text')).toContainText('stable networking');

  const options = page.locator('#preview-options-bin .preview-option');
  await expect(options).toHaveCount(4);
});

test('quiz screen without q param starts quiz directly', async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.locator('#quiz-container')).toBeVisible();
  await expect(page.locator('#setup-container')).toBeHidden();
  await expect(page.locator('#preview-container')).toBeHidden();

  await expect(page.locator('#description-text')).toContainText('deploying a microservices');

  const options = page.locator('#options-bin .option-btn');
  await expect(options).toHaveCount(4);
});

test('quiz screen with c param starts from chapter 2', async ({ page }) => {
  await page.goto('/?course=test-course&c=2');

  await expect(page.locator('#quiz-container')).toBeVisible();

  await expect(page.locator('#description-text')).toContainText('stable networking');

  const options = page.locator('#options-bin .option-btn');
  await expect(options).toHaveCount(4);
});

test('preview Start Quiz button transitions to quiz screen', async ({ page }) => {
  await page.goto('/?course=test-course&q=1');

  await expect(page.locator('#preview-container')).toBeVisible();

  await page.getByRole('button', { name: 'Start Quiz' }).click();

  await expect(page.locator('#quiz-container')).toBeVisible();
  await expect(page.locator('#preview-container')).toBeHidden();
  await expect(page.locator('#setup-container')).toBeHidden();

  await expect(page.locator('#description-text')).toContainText('deploying a microservices');
});

test('preview Cancel button returns to setup screen', async ({ page }) => {
  await page.goto('/?course=test-course&q=1');

  await expect(page.locator('#preview-container')).toBeVisible();

  await page.getByRole('button', { name: 'Cancel' }).click();

  await expect(page.locator('#setup-container')).toBeVisible();
  await expect(page.locator('#preview-container')).toBeHidden();
  await expect(page.locator('#quiz-container')).toBeHidden();
});

test('preview topic-title and content-box remain hidden', async ({ page }) => {
  await page.goto('/?course=test-course&q=1');

  await expect(page.locator('#preview-topic-title')).toBeHidden();
  await expect(page.locator('#preview-content-box')).toBeHidden();
});
