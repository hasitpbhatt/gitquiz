import { chromium } from 'playwright';

const MOCK = {
  '001.json': [{
    question: 'Q?', content: 'C', description: 'D',
    options: ['A container orchestrator', 'A VM manager', 'A database', 'A programming language'],
    answer: 'A container orchestrator',
    explanation: 'E', difficulty: 'easy',
  }],
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
  await p.route('**/raw.githubusercontent.com/**', async r => {
    const u = r.request().url();
    if (u.includes('001.json'))
      return r.fulfill({ body: JSON.stringify(MOCK['001.json']), contentType: 'application/json' });
    return r.fulfill({ status: 404 });
  });
  await p.goto('http://localhost:8765/?course=test-course');
  await p.waitForSelector('.option-btn');

  const btns = await p.locator('.option-btn').all();
  for (const [i, btn] of btns.entries()) {
    const html = await btn.innerHTML();
    const hint = await btn.locator('.key-hint').textContent();
    const hintBox = await btn.locator('.key-hint').boundingBox();
    const btnBox = await btn.boundingBox();
    const hintRight = hintBox.x + hintBox.width;
    const btnRight = btnBox.x + btnBox.width;
    const gap = btnRight - hintRight;
    console.log(`Option ${i + 1}: hint="${hint}" | hint-right=${hintRight.toFixed(0)} btn-right=${btnRight.toFixed(0)} gap=${gap.toFixed(0)}px`);
  }
  await b.close();
})();
