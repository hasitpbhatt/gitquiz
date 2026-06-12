import { test, expect } from '@playwright/test';
import { setupMocks } from './test-utils.mjs';

const MOCK_AI_REPLY = {
  choices: [{ message: { content: '**Kubernetes** is a *container orchestration* platform that automates deployment, scaling, and management of containerized applications.' } }],
  content: '**Kubernetes** is a *container orchestration* platform that automates deployment, scaling, and management of containerized applications.'
};

test.beforeEach(async ({ page }) => {
  await setupMocks(page);
});

async function setupAiMock(page) {
  await page.route('**/quiz-ai-proxy.hasit-p-bhatt.workers.dev/**', async (route) => {
    await route.fulfill({
      body: JSON.stringify(MOCK_AI_REPLY),
      contentType: 'application/json'
    });
  });
}

async function answerAndAskAI(page) {
  await setupAiMock(page);
  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();
  await page.locator('.ai-persona-btn', { hasText: /Deep Dive/ }).click();
  await expect(page.locator('#chat-input-area')).toBeVisible({ timeout: 10000 });
}

async function sendFollowUp(page, text) {
  await page.fill('#chat-input', text);
  await page.click('#chat-send-btn');
  await expect(page.locator('.chat-bubble.user').last()).toContainText(text, { timeout: 10000 });
}

test('ai section appears after answering correct', { tag: '@ai' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  await expect(page.locator('#ai-section')).toBeVisible();
  await expect(page.locator('.ai-persona-btn')).toHaveCount(4);
});

test('ai response div and chat input hidden initially', { tag: '@ai' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await expect(page.locator('#ai-response')).toBeHidden();
  await expect(page.locator('#chat-input-area')).toBeHidden();
  await expect(page.locator('#chat-turn-info')).toBeHidden();
});

test('all 4 persona buttons have correct labels', { tag: '@ai' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  const buttons = page.locator('.ai-persona-btn');
  await expect(buttons.nth(0)).toHaveText(/Like I'm 10/);
  await expect(buttons.nth(1)).toHaveText(/Deep Dive/);
  await expect(buttons.nth(2)).toHaveText(/First Principles/);
  await expect(buttons.nth(3)).toHaveText(/Socratic Tutor/);
});

test('clicking a persona button triggers AI response area', { tag: '@ai' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  await page.locator('.ai-persona-btn', { hasText: /Deep Dive/ }).click();

  await expect(page.locator('#ai-response')).not.toBeHidden();
});

test('chat input area appears after AI response', { tag: '@ai' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await answerAndAskAI(page);

  await expect(page.locator('#chat-input-area')).toBeVisible();
  await expect(page.locator('#chat-input')).toBeEnabled();
  await expect(page.locator('#chat-send-btn')).toBeEnabled();
});

test('turn counter shows Exchange 1 of 5 after initial response', { tag: '@ai' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await answerAndAskAI(page);

  await expect(page.locator('#chat-turn-info')).toHaveText('Exchange 1 of 5');
});

test('follow-up sends and renders user bubble', { tag: '@ai' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await answerAndAskAI(page);
  await sendFollowUp(page, 'Tell me more about scaling');

  await expect(page.locator('.chat-bubble.user')).toHaveCount(1);
  await expect(page.locator('.chat-bubble.assistant')).toHaveCount(2);
});

test('turn counter increments on follow-up', { tag: '@ai' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await answerAndAskAI(page);
  await expect(page.locator('#chat-turn-info')).toHaveText('Exchange 1 of 5');

  await sendFollowUp(page, 'How does this compare to VMs?');

  await expect(page.locator('#chat-turn-info')).toHaveText('Exchange 2 of 5');
});

test('chat resets on question navigation', { tag: '@ai' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await answerAndAskAI(page);
  await expect(page.locator('#chat-input-area')).toBeVisible();

  await page.locator('#next-btn').click();

  await expect(page.locator('#ai-response')).toBeHidden();
  await expect(page.locator('#chat-input-area')).toBeHidden();
  await expect(page.locator('#chat-turn-info')).toBeHidden();
});

test('markdown rendered instead of raw markers in assistant response', { tag: '@ai' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await answerAndAskAI(page);

  const assistantBubble = page.locator('.chat-bubble.assistant');
  await expect(assistantBubble).not.toContainText('**');
  await expect(assistantBubble).toContainText('Kubernetes');
  await expect(assistantBubble).toContainText('container orchestration');
});

test('error message shown on AI proxy failure', { tag: '@ai' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  await page.route('**/quiz-ai-proxy.hasit-p-bhatt.workers.dev/**', async (route) => {
    await route.fulfill({ status: 500, body: 'Server Error' });
  });

  await page.locator('.ai-persona-btn', { hasText: /Deep Dive/ }).click();

  await expect(page.locator('#ai-response')).toContainText('not available right now');
});

test('input disabled at 5-turn conversation limit', { tag: '@ai' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await answerAndAskAI(page);
  await expect(page.locator('#chat-turn-info')).toHaveText('Exchange 1 of 5');

  for (let i = 2; i <= 4; i++) {
    await page.fill('#chat-input', `Follow-up ${i}`);
    await page.click('#chat-send-btn');
    await expect(page.locator('#chat-turn-info')).toHaveText(`Exchange ${i} of 5`, { timeout: 10000 });
  }

  await page.fill('#chat-input', 'Final follow-up');
  await page.click('#chat-send-btn');
  await expect(page.locator('#chat-turn-info')).toHaveText('Conversation limit reached (max 5 exchanges)', { timeout: 10000 });

  await expect(page.locator('#chat-input')).toBeDisabled();
  await expect(page.locator('#chat-send-btn')).toBeDisabled();
});

test('error message on follow-up proxy failure', { tag: '@ai' }, async ({ page }) => {
  await page.goto('/?course=test-course');

  await page.locator('.option-btn', { hasText: 'A container orchestrator' }).click();

  let callCount = 0;
  await page.route('**/quiz-ai-proxy.hasit-p-bhatt.workers.dev/**', async (route) => {
    callCount++;
    if (callCount >= 2) {
      await route.fulfill({ status: 500, body: 'Server Error' });
    } else {
      await route.fulfill({
        body: JSON.stringify(MOCK_AI_REPLY),
        contentType: 'application/json'
      });
    }
  });

  await page.locator('.ai-persona-btn', { hasText: /Deep Dive/ }).click();
  await expect(page.locator('#chat-input-area')).toBeVisible({ timeout: 10000 });

  await page.fill('#chat-input', 'Tell me more about scaling');
  await page.click('#chat-send-btn');
  await expect(page.locator('.chat-bubble.error')).toContainText('not available right now', { timeout: 10000 });
});
