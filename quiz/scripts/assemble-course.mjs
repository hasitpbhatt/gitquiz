import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const id = process.argv[2];
if (!id) { console.error('Usage: node assemble-course.mjs <course-id>'); process.exit(1); }

const srcDir = join(ROOT, 'courses', id);
const chapters = [];

for (let i = 1; i <= 20; i++) {
  const seq = String(i).padStart(3, '0');
  const p = join(srcDir, `ch-${seq}.json`);
  if (!existsSync(p)) break;
  const obj = JSON.parse(readFileSync(p, 'utf8'));
  chapters.push({ title: obj.title || `Chapter ${seq}`, seq: i, questions: obj.questions });
}

if (chapters.length === 0) {
  console.error('No ch-*.json files found in', srcDir);
  process.exit(1);
}

const input = { id, chapters };
const outPath = join(ROOT, 'input.json');
writeFileSync(outPath, JSON.stringify(input, null, 2), 'utf8');
console.log(`Assembled ${chapters.length} chapters into ${outPath}`);
