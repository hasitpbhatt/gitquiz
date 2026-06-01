import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
const REQUIRED_FIELDS = ['question', 'content', 'description', 'options', 'answer', 'explanation', 'difficulty'];

function err(...msg) { console.error('ERROR:', ...msg); process.exit(1); }

function validateInput(input, dryRun) {
  const errors = [];

  if (!input.id || typeof input.id !== 'string') errors.push('"id" must be a non-empty string');
  if (!Array.isArray(input.chapters)) errors.push('"chapters" must be an array');

  if (errors.length) return errors;

  if (input.chapters.length < 5 || input.chapters.length > 12)
    errors.push(`chapters count ${input.chapters.length} — need 5-12`);

  const seenSeqs = new Set();
  input.chapters.forEach((ch, ci) => {
    const prefix = `chapters[${ci}]`;

    if (!ch.title || typeof ch.title !== 'string') errors.push(`${prefix}: missing/invalid "title"`);
    if (typeof ch.seq !== 'number' || ch.seq < 1) errors.push(`${prefix}: "seq" must be a positive integer`);
    if (seenSeqs.has(ch.seq)) errors.push(`${prefix}: duplicate seq ${ch.seq}`);
    seenSeqs.add(ch.seq);

    if (!Array.isArray(ch.questions)) { errors.push(`${prefix}: "questions" must be an array`); return; }
    if (ch.questions.length < 7 || ch.questions.length > 12)
      errors.push(`${prefix}: ${ch.questions.length} questions (need 7-12)`);

    ch.questions.forEach((q, qi) => {
      const qp = `${prefix}.questions[${qi}]`;
      REQUIRED_FIELDS.forEach(f => {
        if (!(f in q)) errors.push(`${qp}: missing "${f}"`);
      });
      if (q.options) {
        if (!Array.isArray(q.options)) errors.push(`${qp}: "options" not an array`);
        else if (q.options.length !== 4) errors.push(`${qp}: ${q.options.length} options (need 4)`);
        else if (q.answer && !q.options.includes(q.answer))
          errors.push(`${qp}: answer "${q.answer}" not in options`);
      }
      if (q.difficulty && !VALID_DIFFICULTIES.includes(q.difficulty))
        errors.push(`${qp}: invalid difficulty "${q.difficulty}"`);
    });
  });

  return errors;
}

function insertIntoCoursesList(id) {
  const listPath = join(ROOT, 'courses', 'courses_list.txt');
  if (!existsSync(listPath)) err('courses_list.txt not found');

  const content = readFileSync(listPath, 'utf8');
  const lines = content.trim().split(/\r?\n/);
  if (lines.includes(id)) { console.log(`"${id}" already in courses_list.txt — skipping insert`); return; }

  lines.push(id);
  lines.sort((a, b) => a.localeCompare(b));
  writeFileSync(listPath, lines.join('\n') + '\n');
  console.log(`Added "${id}" to courses_list.txt`);
}

function writeMetadataEntry(id, input) {
  const metaPath = join(ROOT, 'courses', 'courses-meta.json');
  let meta = {};
  if (existsSync(metaPath)) {
    try { meta = JSON.parse(readFileSync(metaPath, 'utf8')); }
    catch (e) { err(`Parse error in courses-meta.json: ${e.message}`); }
  }

  const type = input.id.match(/^([^-]+)/)?.[1] || 'unknown';
  const prev = meta[id];
  meta[id] = {
    title: input.title || prev?.title || id,
    type: input.type || prev?.type || type,
    chapters: input.chapters?.length || prev?.chapters || 0,
    source: input.source || prev?.source || null,
    description: input.description || prev?.description || `Quiz course for ${input.title || id}.`
  };

  // Re-sort keys to match courses_list.txt ordering
  const listPath = join(ROOT, 'courses', 'courses_list.txt');
  if (existsSync(listPath)) {
    const lines = readFileSync(listPath, 'utf8').trim().split(/\r?\n/);
    const ordered = {};
    lines.forEach(k => { if (meta[k]) ordered[k] = meta[k]; });
    Object.keys(meta).sort((a, b) => a.localeCompare(b)).forEach(k => { if (!ordered[k]) ordered[k] = meta[k]; });
    writeFileSync(metaPath, JSON.stringify(ordered, null, 2) + '\n');
  } else {
    writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n');
  }
  const label = prev ? 'Updated' : 'Created';
  console.log(`${label} metadata entry for "${id}" in courses-meta.json`);
}

function main() {
  const args = process.argv.slice(2);
  if (!args.length) err('Usage: node quiz/scripts/generate-course.mjs <input.json> [--dry-run]');

  const inputPath = args[0];
  const dryRun = args.includes('--dry-run');

  if (!existsSync(inputPath)) err(`File not found: ${inputPath}`);

  let input;
  try { input = JSON.parse(readFileSync(inputPath, 'utf8')); }
  catch (e) { err(`Parse error in ${inputPath}: ${e.message}`); }

  console.log(`Validating "${input.id || '(no id)'}"...`);
  const errors = validateInput(input, dryRun);
  if (errors.length) {
    console.log('Validation FAILED:');
    errors.forEach(e => console.log('  - ' + e));
    process.exit(1);
  }
  console.log('Validation OK — ' + input.chapters.length + ' chapters, ' +
    input.chapters.reduce((s, c) => s + c.questions.length, 0) + ' questions total.');

  if (dryRun) { console.log('Dry-run — no files written.'); return; }

  const courseDir = join(ROOT, 'courses', input.id);
  if (!existsSync(courseDir)) {
    mkdirSync(courseDir, { recursive: true });
    console.log(`Created ${courseDir}/`);
  }

  input.chapters.sort((a, b) => a.seq - b.seq);
  input.chapters.forEach(ch => {
    const padded = String(ch.seq).padStart(3, '0');
    const filePath = join(courseDir, `${padded}.json`);
    writeFileSync(filePath, JSON.stringify(ch.questions, null, 2) + '\n');
    console.log(`  ${padded}.json — ${ch.title} (${ch.questions.length} questions)`);
  });

  insertIntoCoursesList(input.id);
  writeMetadataEntry(input.id, input);
  console.log('Done.');
}

main();
