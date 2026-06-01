import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'fs';
import { resolve, join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';

const __dirname = dirname(fileURLToPath(import.meta.url));
const COURSES_DIR = resolve(__dirname, '../../courses');
const SCHEMA_PATH = resolve(__dirname, '../../courses/course-schema.json');
const LIST_PATH = resolve(__dirname, '../../courses/courses_list.txt');
const META_PATH = resolve(__dirname, '../../courses/courses-meta.json');
const POSITIONAL_REF_RE = /(Both [A-D]\b|All of the above\b|[A-D]\s*&\s*[A-D]\b)/;

function walkJsonFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...walkJsonFiles(full));
    } else if (entry !== 'course-schema.json' && entry !== 'courses-meta.json' && extname(full) === '.json') {
      files.push(full);
    }
  }
  return files.sort();
}

const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf-8'));
const ajv = new Ajv();
const validate = ajv.compile(schema);

test.describe('Course JSON Schema Validation', () => {
  const files = walkJsonFiles(COURSES_DIR);

  test('courses_list.txt matches actual directories and is sorted', () => {
    const lines = readFileSync(LIST_PATH, 'utf-8').trim().split(/\r?\n/);
    const sorted = [...lines].sort((a, b) => a.localeCompare(b));
    expect(lines).toEqual(sorted);

    const actualDirs = readdirSync(COURSES_DIR)
      .filter(e => statSync(join(COURSES_DIR, e)).isDirectory())
      .sort((a, b) => a.localeCompare(b));
    expect(lines).toEqual(actualDirs);
  });

  test('courses-meta.json matches courses_list.txt', () => {
    const lines = readFileSync(LIST_PATH, 'utf-8').trim().split(/\r?\n/);
    let meta;
    try {
      meta = JSON.parse(readFileSync(META_PATH, 'utf-8'));
    } catch (e) {
      throw new Error(`courses-meta.json parse error: ${e.message}`);
    }
    const metaKeys = Object.keys(meta).sort((a, b) => a.localeCompare(b));
    expect(metaKeys).toEqual(lines);

    for (const [id, entry] of Object.entries(meta)) {
      expect(entry).toHaveProperty('title');
      expect(entry).toHaveProperty('type');
      expect(entry).toHaveProperty('chapters');
      expect(typeof entry.title).toBe('string');
      expect(typeof entry.type).toBe('string');
      expect(typeof entry.chapters).toBe('number');
      expect(entry.chapters).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(entry.chapters)).toBe(true);
    }
  });

  for (const filePath of files) {
    const relPath = filePath.replace(COURSES_DIR + '\\', '').replace(/\\/g, '/');
    const course = dirname(relPath);
    const filename = basename(filePath);

    test(`${relPath}`, () => {
      const raw = readFileSync(filePath, 'utf-8');
      let data;
      try {
        data = JSON.parse(raw);
      } catch (e) {
        throw new Error(`Invalid JSON: ${e.message}`);
      }

      const valid = validate(data);
      if (!valid) {
        const msg = validate.errors.map(e =>
          `  ${e.instancePath} ${e.message}${e.params ? ' ' + JSON.stringify(e.params) : ''}`
        ).join('\n');
        throw new Error(`Schema violations:\n${msg}`);
      }

      expect(filename).toMatch(/^\d{3}\.json$/);
      expect(data.length).toBeGreaterThanOrEqual(7);
      expect(data.length).toBeLessThanOrEqual(12);

      for (let i = 0; i < data.length; i++) {
        const q = data[i];
        expect(q.options).toContain(q.answer);
        expect(new Set(q.options).size).toBe(4);

        for (const opt of q.options) {
          expect(opt).not.toMatch(POSITIONAL_REF_RE);
        }
      }
    });
  }
});
