import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
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

describe('Course JSON Schema Validation', () => {
  const files = walkJsonFiles(COURSES_DIR);

  it('courses_list.txt matches actual directories and is sorted', () => {
    const lines = readFileSync(LIST_PATH, 'utf-8').trim().split(/\r?\n/);
    const sorted = [...lines].sort((a, b) => a.localeCompare(b));
    assert.deepStrictEqual(lines, sorted);

    const actualDirs = readdirSync(COURSES_DIR)
      .filter(e => statSync(join(COURSES_DIR, e)).isDirectory())
      .sort((a, b) => a.localeCompare(b));
    assert.deepStrictEqual(lines, actualDirs);
  });

  it('courses-meta.json matches courses_list.txt', () => {
    const lines = readFileSync(LIST_PATH, 'utf-8').trim().split(/\r?\n/);
    let meta;
    try {
      meta = JSON.parse(readFileSync(META_PATH, 'utf-8'));
    } catch (e) {
      throw new Error(`courses-meta.json parse error: ${e.message}`);
    }
    const metaKeys = Object.keys(meta).sort((a, b) => a.localeCompare(b));
    assert.deepStrictEqual(metaKeys, lines);

    for (const [id, entry] of Object.entries(meta)) {
      assert.ok(entry.title, `[${id}] missing title`);
      assert.ok(entry.type, `[${id}] missing type`);
      assert.ok(typeof entry.chapters === 'number', `[${id}] chapters must be a number`);
      assert.ok(entry.chapters >= 1, `[${id}] chapters must be >= 1`);
      assert.ok(Number.isInteger(entry.chapters), `[${id}] chapters must be an integer`);
    }
  });

  for (const filePath of files) {
    const relPath = filePath.replace(COURSES_DIR + '\\', '').replace(/\\/g, '/');
    const course = dirname(relPath);
    const filename = basename(filePath);

    it(`${relPath}`, () => {
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

      assert.ok(/^\d{3}\.json$/.test(filename), `Filename ${filename} does not match 3-digit pattern`);
      assert.ok(data.length >= 7, `Only ${data.length} questions (minimum 7)`);
      assert.ok(data.length <= 12, `${data.length} questions (maximum 12)`);

      for (let i = 0; i < data.length; i++) {
        const q = data[i];
        assert.ok(q.options.includes(q.answer), `[${i}] Answer "${q.answer}" not in options`);
        assert.strictEqual(new Set(q.options).size, 4, `[${i}] Duplicate options found`);

        for (const opt of q.options) {
          assert.ok(!POSITIONAL_REF_RE.test(opt), `[${i}] Positional reference: "${opt}"`);
        }
      }
    });
  }
});
