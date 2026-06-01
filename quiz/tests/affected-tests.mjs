import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';

const MAPPING = [
  { path: 'quiz/index.html', test: '' },
  { path: 'quiz/styles.css', test: '' },
  { path: 'quiz/tests/playwright.config.mjs', test: '' },
  { path: 'quiz/tests/package.json', test: '' },
  { path: 'quiz/lib/main.js', test: 'setup.spec.mjs url-params.spec.mjs' },
  { path: 'quiz/lib/state.js', test: 'setup.spec.mjs quiz.spec.mjs unit.spec.mjs' },
  { path: 'quiz/lib/catalog.js', test: 'catalog.spec.mjs unit.spec.mjs' },
  { path: 'quiz/lib/notifications.js', test: 'setup.spec.mjs' },
  { path: 'quiz/lib/preview.js', test: 'preview.spec.mjs' },
  { path: 'quiz/lib/quiz.js', test: 'quiz.spec.mjs navigation.spec.mjs' },
  { path: 'quiz/lib/ai.js', test: 'ai.spec.mjs' },
  { path: 'quiz/lib/sharing.js', test: 'ui.spec.mjs unit.spec.mjs' },
  { path: 'courses/', test: 'schema.spec.mjs' },
  { path: 'quiz/tests/test-utils.mjs', test: '' },
  { path: 'quiz/tests/setup.spec.mjs', test: 'setup.spec.mjs' },
  { path: 'quiz/tests/catalog.spec.mjs', test: 'catalog.spec.mjs' },
  { path: 'quiz/tests/preview.spec.mjs', test: 'preview.spec.mjs' },
  { path: 'quiz/tests/quiz.spec.mjs', test: 'quiz.spec.mjs' },
  { path: 'quiz/tests/navigation.spec.mjs', test: 'navigation.spec.mjs' },
  { path: 'quiz/tests/url-params.spec.mjs', test: 'url-params.spec.mjs' },
  { path: 'quiz/tests/ui.spec.mjs', test: 'ui.spec.mjs' },
  { path: 'quiz/tests/ai.spec.mjs', test: 'ai.spec.mjs' },
  { path: 'quiz/tests/visual.spec.mjs', test: 'visual.spec.mjs' },
  { path: 'quiz/tests/unit.spec.mjs', test: 'unit.spec.mjs' },
];

function getChangedFiles() {
  try {
    const diff = execSync('git diff --name-only HEAD', { encoding: 'utf8', cwd: process.cwd() });
    if (diff.trim()) return diff.trim().split('\n').filter(Boolean);
  } catch { }
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8', cwd: process.cwd() });
    if (status.trim()) return status.trim().split('\n').map(l => l.slice(3).trim()).filter(Boolean);
  } catch { }
  return [];
}

function resolveTests(changedFiles) {
  let fullSuite = false;
  const testSet = new Set();

  for (const file of changedFiles) {
    const normalized = file.replace(/\\/g, '/');

    for (const entry of MAPPING) {
      if (normalized.startsWith('quiz/tests/') && normalized.endsWith('.spec.mjs')) {
        if (normalized === entry.path) {
          entry.test.split(' ').filter(Boolean).forEach(t => testSet.add(t));
        }
      } else if (normalized.startsWith(entry.path)) {
        if (entry.test === '') {
          if (normalized !== '' && !changedFiles.some(f =>
            f.replace(/\\/g, '/').startsWith('quiz/tests/')
          )) {
            fullSuite = true;
          }
        } else {
          entry.test.split(' ').filter(Boolean).forEach(t => testSet.add(t));
        }
      }
    }
  }

  if (fullSuite || testSet.size === 0) {
    const allSpecs = MAPPING
      .filter(e => e.path.endsWith('.spec.mjs'))
      .map(e => e.test)
      .join(' ')
      .split(' ')
      .filter(Boolean);
    return [...new Set(allSpecs)];
  }

  return [...testSet];
}

const files = getChangedFiles();
const tests = resolveTests(files);

if (tests.length === 0) {
  console.log('No tests needed for the current changes.' + (files.length ? ` (Changed: ${files.join(', ')})` : ''));
  process.exit(0);
}

const cmd = tests.some(t => t.includes('schema.spec.mjs'))
  ? `npx playwright test schema.spec.mjs --config schema.config.mjs`
  : `npx playwright test ${tests.join(' ')}`;
console.log(cmd);
