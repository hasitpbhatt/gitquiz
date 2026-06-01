import { chromium } from 'playwright';

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
};

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  
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
    return route.fulfill({ status: 404, body: 'Not Found' });
  });
  
  await page.goto('http://localhost:8765/?course=test-course');
  await page.waitForSelector('.option-btn', { timeout: 10000 });
  
  await page.screenshot({ path: '../screenshot.png', fullPage: true });
  console.log('Screenshot saved to quiz/screenshot.png');
  
  await browser.close();
})();
