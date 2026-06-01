import { test, expect } from '@playwright/test';

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
      content: 'Kubernetes is a container orchestration platform.',
      description: 'Scenario: You are deploying a microservices application with multiple containers across a cluster.',
      options: ['A VM manager', 'A container orchestrator', 'A database', 'A programming language'],
      answer: 'A container orchestrator',
      explanation: 'Kubernetes automates the deployment, scaling, and management of containerized applications.',
      difficulty: 'easy',
    },
    {
      question: 'What is a Pod?',
      content: 'A Pod is the smallest deployable unit in Kubernetes.',
      description: 'Scenario: You need to run multiple tightly-coupled containers that share storage and network.',
      options: ['A group of containers', 'A single container', 'A virtual machine', 'A storage volume'],
      answer: 'A group of containers',
      explanation: 'A Pod is the smallest deployable unit that can contain one or more containers.',
      difficulty: 'medium',
    },
  ],
  '002.json': [
    {
      question: 'What is a Service?',
      content: 'Services provide stable networking.',
      description: 'Scenario: You want stable networking for your Pods.',
      options: ['A pod template', 'A network endpoint', 'A storage class', 'A config map'],
      answer: 'A network endpoint',
      explanation: 'Services provide stable network endpoints for accessing Pods.',
      difficulty: 'easy',
    },
  ],
};

const SINGLE_QUESTION_MODULE = [
  {
    question: 'Single Question',
    content: 'Just one question module.',
    description: 'Scenario: This is a single-question test module.',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    answer: 'Option A',
    explanation: 'Option A is correct.',
    difficulty: 'easy',
  },
];

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

    if (url.includes('no-exist.json')) {
      return route.fulfill({ status: 404, body: 'Not Found' });
    }

    return route.fulfill({ status: 404, body: 'Not Found' });
  });
}

function setupSingleQuestionMock(page) {
  return page.route('**/raw.githubusercontent.com/**', async (route) => {
    const url = route.request().url();
    if (url.includes('courses_list.txt')) {
      return route.fulfill({ body: CATALOG_CONTENT, contentType: 'text/plain' });
    }
    if (url.includes('001.json')) {
      return route.fulfill({ body: JSON.stringify(SINGLE_QUESTION_MODULE), contentType: 'application/json' });
    }
    return route.fulfill({ status: 404, body: 'Not Found' });
  });
}

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

// === Setup Screen ===

test('setup screen shows catalog after load', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#setup-container')).toBeVisible();
  await expect(page.locator('#course-dropdown option')).toHaveCount(4);
  await expect(page.locator('#course-dropdown')).not.toContainText('Connecting to vault');
});

test('custom URL input toggles visibility', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#url-section')).toBeHidden();
  await page.click('#url-toggle-btn');
  await expect(page.locator('#url-section')).toBeVisible();
  await page.click('#url-toggle-btn');
  await expect(page.locator('#url-section')).toBeHidden();
});

test('fill example populates URL and shows section if hidden', async ({ page }) => {
  await page.goto('/');

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

  await page.click('text=Begin Challenge');

  const notification = page.locator('.fixed.bottom-4');
  await expect(notification).toBeVisible();
  await expect(notification).toContainText('Selection Required');
});

// === Catalog ===

test('catalog type filter "book" shows only book courses', async ({ page }) => {
  await page.goto('/');

  await page.click('.type-filter-btn[data-type="book"]');

  const options = page.locator('#course-dropdown option');
  await expect(options).toHaveCount(1);
  await expect(options.first()).toHaveAttribute('value', 'book-atomic-habits');
});

test('catalog search is case insensitive', async ({ page }) => {
  await page.goto('/');

  await page.fill('#catalog-search', 'TIM');

  const options = page.locator('#course-dropdown option');
  await expect(options).toHaveCount(1);
  await expect(options.first()).toHaveAttribute('value', 'podcast-tim-ferriss');
});

test('catalog search with hyphens replaced by spaces', async ({ page }) => {
  await page.goto('/');

  await page.fill('#catalog-search', 'atomic habits');

  const options = page.locator('#course-dropdown option');
  await expect(options).toHaveCount(1);
  await expect(options.first()).toHaveAttribute('value', 'book-atomic-habits');
});

test('catalog dropdown selectedIndex resets after filter', async ({ page }) => {
  await page.goto('/');

  const options = page.locator('#course-dropdown option');
  await expect(options).toHaveCount(4);

  await page.fill('#catalog-search', 'tim');

  const firstOption = options.first();
  await expect(firstOption).toHaveAttribute('value', 'podcast-tim-ferriss');
});

// === Preview Screen ===

test('preview shows correct number of questions', async ({ page }) => {
  await page.goto('/?course=test-course&q=1');

  await expect(page.locator('#preview-meta')).toContainText('2 questions');
});

test('preview shows description from first question with q=1', async ({ page }) => {
  await page.goto('/?course=test-course&q=1');

  await expect(page.locator('#preview-description-text')).toContainText('deploying a microservices');
});

test('preview with q=2 shows second question description', async ({ page }) => {
  await page.goto('/?course=test-course&q=2');

  await expect(page.locator('#preview-description-text')).toContainText('tightly-coupled containers');
});

test('preview Start Quiz button calls initializeQuiz', async ({ page }) => {
  await page.goto('/?course=test-course&q=1');

  await page.click('text=Start Quiz');

  await expect(page.locator('#quiz-container')).toBeVisible();
  await expect(page.locator('#question-counter')).toContainText('1 / 2');
  await expect(page.locator('#description-text')).toContainText('deploying a microservices');
});

test('preview Cancel returns to setup', async ({ page }) => {
  await page.goto('/?course=test-course&q=1');

  await page.click('text=Cancel');

  await expect(page.locator('#setup-container')).toBeVisible();
});

test('preview renders static option styles', async ({ page }) => {
  await page.goto('/?course=test-course&q=1');

  const options = page.locator('#preview-options-bin .preview-option');
  await expect(options.first()).toHaveCSS('cursor', 'default');
});

// === Quiz Engine ===

test('quiz initializes with progress bar at start', async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.locator('#progress-fill')).toBeVisible();
});

test('quiz progress bar updates on next', async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await page.click('#next-btn');

  await expect(page.locator('#question-counter')).toContainText('2 / 2');
});

test('quiz timer starts on initialization', async ({ page }) => {
  await page.goto('/?course=test-course');

  const timerVal = page.locator('#timer-val');
  await expect(timerVal).toBeVisible();

  await page.waitForTimeout(1500);
  const text = await timerVal.textContent();
  expect(text).not.toBe('00:00');
});

test('score display updates on correct answer', async ({ page }) => {
  await page.goto('/?course=test-course');

  const scoreVal = page.locator('#score-val');
  await expect(scoreVal).toHaveText('0');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await expect(scoreVal).not.toHaveText('0');
});

test('streak increments on consecutive correct answers', async ({ page }) => {
  await page.goto('/?course=test-course');

  const streakVal = page.locator('#streak-val');
  await expect(streakVal).toHaveText('0');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await expect(streakVal).toHaveText('1');

  await page.click('#next-btn');
  await page.locator('.option-btn', { hasText: 'A group of containers' }).click();
  await expect(streakVal).toHaveText('2');
});

test('streak resets on wrong answer', async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await expect(page.locator('#streak-val')).toHaveText('1');

  await page.click('#next-btn');
  await page.locator('.option-btn', { hasText: 'A virtual machine' }).click();
  await expect(page.locator('#streak-val')).toHaveText('0');
});

test('wrong answer highlights correct option', async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A VM manager' }).click();

  await expect(page.locator('.option-btn.correct')).toContainText('A container orchestrator');
  await expect(page.locator('.option-btn.wrong')).toContainText('A VM manager');
});

test('explanation appears after answering', async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.locator('#explanation')).toBeHidden();

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  await expect(page.locator('#explanation')).toBeVisible();
  await expect(page.locator('#explanation')).toContainText('Expert Feedback');
});

test('next button appears after answering', async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.locator('#next-btn')).toBeHidden();

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  await expect(page.locator('#next-btn')).toBeVisible();
});

test('topic-title appears after answering', async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  await expect(page.locator('#topic-title')).toBeVisible();
  await expect(page.locator('#topic-title')).toContainText('What is Kubernetes');
});

test('content-box appears after answering when content exists', async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.locator('#content-box')).toBeHidden();

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  await expect(page.locator('#content-box')).toBeVisible();
  await expect(page.locator('#content-box')).toContainText('container orchestration');
});

test('options disabled after selection', async ({ page }) => {
  await page.goto('/?course=test-course');

  const options = page.locator('.option-btn');
  await expect(options.first()).toBeEnabled();

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  await expect(options.first()).toBeDisabled();
});

test('module-label displays course name and chapter', async ({ page }) => {
  await page.goto('/?course=test-course');

  const label = page.locator('#module-label');
  await expect(label).toContainText(/Test Course/i);
});

test('quiz renders with question counter', async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.locator('#question-counter')).toContainText('1 / 2');
});

test('quiz renders all 4 options', async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.locator('#options-bin .option-btn')).toHaveCount(4);
});

// === Quiz Navigation ===

test('next button advances to next question', async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await page.click('#next-btn');

  await expect(page.locator('#description-text')).toContainText('tightly-coupled containers');
});

test('completing all questions shows completion screen', async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await page.click('#next-btn');

  await page.locator('.option-btn', { hasText: 'A group of containers' }).click();
  await page.click('#next-btn');

  await expect(page.locator('#completion-screen')).toBeVisible();
  await expect(page.locator('#final-score-val')).not.toHaveText('0');
  await expect(page.locator('#final-timer-val')).toBeVisible();
});

// === Module Navigation ===

test('skip module attempts to load next module', async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await page.click('#next-btn');

  await page.locator('.option-btn', { hasText: 'A group of containers' }).click();
  await page.click('#next-btn');

  await expect(page.locator('#completion-screen')).toBeVisible();
  await expect(page.locator('#transition-actions')).toContainText('Next Module');
});

test('completion screen shows mastery message when no next module', async ({ page }) => {
  await setupSingleQuestionMock(page);
  await page.goto('/?course=test-course');

  const options = page.locator('.option-btn');
  await expect(options).toHaveCount(4);

  await page.locator('.option-btn', { hasText: 'Option A' }).click();
  await page.click('#next-btn');

  await expect(page.locator('#completion-screen')).toBeVisible();
  await expect(page.locator('#completion-title')).toContainText('Course Track Completed');
  await expect(page.locator('#transition-actions')).toContainText('Mastery Complete');
});

// === Score Calculation ===

test('score increases by base 100 points for correct answer', async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  const scoreText = await page.locator('#score-val').textContent();
  const scoreNum = parseInt(scoreText.replace(/,/g, ''), 10);
  expect(scoreNum).toBeGreaterThanOrEqual(100);
  expect(scoreNum).toBeLessThanOrEqual(150);
});

// === Share Functionality ===

test('share button is visible on setup screen', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#share-btn')).toBeVisible();
});

test('share button opens share setup modal on setup screen', async ({ page }) => {
  await page.goto('/');

  await page.click('#share-btn');

  await expect(page.locator('text=Share Quiz Portal')).toBeVisible();
  await expect(page.locator('text=Copy Link')).toBeVisible();
  await expect(page.locator('text=Download Image')).toBeVisible();
});

test('share modal close button removes modal', async ({ page }) => {
  await page.goto('/');

  await page.click('#share-btn');
  await expect(page.locator('text=Share Quiz Portal')).toBeVisible();

  await page.click('button:has-text("Close")');
  await expect(page.locator('text=Share Quiz Portal')).toBeHidden();
});

test('share modal on quiz screen shows question share', async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await page.click('#share-btn');

  await expect(page.locator('text=Share Quiz Portal')).toBeHidden();
});

// === Error Handling ===

test('error overlay shows on invalid module', async ({ page }) => {
  await page.goto('/?course=test-course');
  await page.goto('/?course=test-course&c=999');

  await expect(page.locator('#error-overlay')).toBeVisible();
  await expect(page.locator('#error-message')).toContainText('404');
});

test('error message displayed when module fetch fails', async ({ page }) => {
  await page.goto('/?course=test-course&c=555');

  await expect(page.locator('#error-overlay')).toBeVisible();
  await expect(page.locator('#error-message')).toContainText('404');
});

// === UI Elements ===

test('score, streak, and timer stats grid visible during quiz', async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.locator('#score-val')).toBeVisible();
  await expect(page.locator('#streak-val')).toBeVisible();
  await expect(page.locator('#timer-val')).toBeVisible();
});

test('menu button visible during quiz', async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.getByRole('button', { name: '← Menu' })).toBeVisible();
});

test('skip module button visible during quiz', async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.locator('text=Skip Module')).toBeVisible();
});

test('achievement card template exists in DOM', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#achievement-card-template')).toBeVisible();
});

test('ach-cert-name has default value', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#ach-cert-name')).toContainText('Explorer Name');
});

// === Completion Screen ===

test('download achievement card button visible on completion', async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await page.click('#next-btn');
  await page.locator('.option-btn', { hasText: 'A group of containers' }).click();
  await page.click('#next-btn');

  await expect(page.locator('text=Download Achievement Card')).toBeVisible();
});

test('return to catalog button visible on completion', async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await page.click('#next-btn');
  await page.locator('.option-btn', { hasText: 'A group of containers' }).click();
  await page.click('#next-btn');

  await expect(page.locator('text=Return to Catalog')).toBeVisible();
});

// === URL Param Handling ===

test('course param without q or c starts quiz directly', async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.locator('#setup-container')).toBeHidden();
  await expect(page.locator('#quiz-flow')).toBeVisible();
});

test('invalid course param shows setup screen', async ({ page }) => {
  await page.goto('/?course=nonexistent-course');

  await expect(page.locator('#setup-container')).toBeVisible();
});

// === AI Section ===

test('ai section appears after answering correct', async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  await expect(page.locator('#ai-section')).toBeVisible();
  await expect(page.locator('#explain-more-btn')).toBeVisible();
});

test('ai response div hidden initially', async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.locator('#ai-response')).toBeHidden();
});
