import { expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const quizRoot = path.resolve(__dirname, '../../quiz');

const MIME = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

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

function setupLocalMocks(page) {
  return page.route('http://localhost:8765/**', async (route) => {
    const url = new URL(route.request().url());
    let filePath = path.join(quizRoot, url.pathname);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(quizRoot, 'index.html');
    }
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    return route.fulfill({ body: data.toString(), contentType: MIME[ext] || 'text/plain' });
  });
}

async function setupMocks(page) {
  await setupLocalMocks(page);
  await page.route('**/raw.githubusercontent.com/**', async (route) => {
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

async function setupSingleQuestionMock(page) {
  await setupLocalMocks(page);
  await page.route('**/raw.githubusercontent.com/**', async (route) => {
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

export { CATALOG_CONTENT, MOCK_MODULES, SINGLE_QUESTION_MODULE, setupMocks, setupSingleQuestionMock, setupLocalMocks };
