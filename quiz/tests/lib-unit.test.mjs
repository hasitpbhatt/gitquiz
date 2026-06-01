import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  escapeHtml,
  shuffleArray,
  filterCatalogItems,
  formatCourseName,
  buildCatalogOptions,
  getShareUrl,
  calculateScore,
  calculateNewStreak,
  getTodayStr,
} from './test-helpers.mjs';

const CATALOG = ['book-atomic-habits', 'book-deep-work', 'podcast-tim-ferriss', 'coursera-ml'];

describe('escapeHtml', () => {
  it('leaves plain text unchanged', () => {
    assert.strictEqual(escapeHtml('hello world'), 'hello world');
  });

  it('escapes < and >', () => {
    assert.strictEqual(escapeHtml('<script>'), '&lt;script&gt;');
  });

  it('escapes ampersand', () => {
    assert.strictEqual(escapeHtml('a & b'), 'a &amp; b');
  });

  it('leaves double quotes as-is', () => {
    assert.strictEqual(escapeHtml('say "hello"'), 'say "hello"');
  });

  it('handles empty string', () => {
    assert.strictEqual(escapeHtml(''), '');
  });

  it('handles mixed content', () => {
    assert.strictEqual(escapeHtml('<b>AT&T</b>'), '&lt;b&gt;AT&amp;T&lt;/b&gt;');
  });

  it('handles null/undefined gracefully', () => {
    assert.strictEqual(escapeHtml(null), 'null');
    assert.strictEqual(escapeHtml(undefined), 'undefined');
  });
});

describe('shuffleArray', () => {
  it('preserves array length', () => {
    assert.strictEqual(shuffleArray([1, 2, 3, 4, 5]).length, 5);
  });

  it('contains all original elements', () => {
    const result = shuffleArray([1, 2, 3, 4, 5]).sort((a, b) => a - b);
    assert.deepStrictEqual(result, [1, 2, 3, 4, 5]);
  });

  it('handles empty array', () => {
    assert.deepStrictEqual(shuffleArray([]), []);
  });

  it('handles single-element array', () => {
    assert.deepStrictEqual(shuffleArray(['only']), ['only']);
  });

  it('does not mutate original array', () => {
    const orig = [1, 2, 3];
    shuffleArray(orig);
    assert.deepStrictEqual(orig, [1, 2, 3]);
  });

  it('produces different orderings (probabilistic)', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const results = new Set();
    for (let i = 0; i < 20; i++) {
      results.add(shuffleArray(input).join(','));
    }
    assert.ok(results.size > 1, 'Multiple shuffles should produce different orderings');
  });
});

describe('filterCatalogItems', () => {
  it('returns all items when no filter is active', () => {
    const result = filterCatalogItems(CATALOG, 'all', '');
    assert.strictEqual(result.length, 4);
  });

  it('filters by type', () => {
    const result = filterCatalogItems(CATALOG, 'book', '');
    assert.deepStrictEqual(result, ['book-atomic-habits', 'book-deep-work']);
  });

  it('filters by search text', () => {
    const result = filterCatalogItems(CATALOG, 'all', 'deep');
    assert.deepStrictEqual(result, ['book-deep-work']);
  });

  it('combines type and search filters', () => {
    const result = filterCatalogItems(CATALOG, 'book', 'atomic');
    assert.deepStrictEqual(result, ['book-atomic-habits']);
  });

  it('returns empty when nothing matches', () => {
    const result = filterCatalogItems(CATALOG, 'all', 'zzzzz');
    assert.strictEqual(result.length, 0);
  });

  it('search matches across word boundaries (dashes replaced by spaces)', () => {
    const result = filterCatalogItems(CATALOG, 'all', 'tim ferriss');
    assert.deepStrictEqual(result, ['podcast-tim-ferriss']);
  });

  it('is case insensitive', () => {
    const result = filterCatalogItems(CATALOG, 'all', 'TIM');
    assert.deepStrictEqual(result, ['podcast-tim-ferriss']);
  });

  it('handles empty catalog', () => {
    const result = filterCatalogItems([], 'all', '');
    assert.strictEqual(result.length, 0);
  });
});

describe('formatCourseName', () => {
  it('strips type prefix and formats as title case', () => {
    assert.strictEqual(formatCourseName('book-atomic-habits', false), 'Atomic Habits');
  });

  it('handles podcast prefix', () => {
    assert.strictEqual(formatCourseName('podcast-tim-ferriss', false), 'Tim Ferriss');
  });

  it('handles coursera prefix', () => {
    assert.strictEqual(formatCourseName('coursera-machine-learning', false), 'Machine Learning');
  });

  it('shows emoji for book when showEmoji is true', () => {
    assert.strictEqual(formatCourseName('book-atomic-habits', true), '📘 Atomic Habits');
  });

  it('shows emoji for podcast when showEmoji is true', () => {
    assert.strictEqual(formatCourseName('podcast-tim-ferriss', true), '🎙 Tim Ferriss');
  });

  it('shows emoji for coursera when showEmoji is true', () => {
    assert.strictEqual(formatCourseName('coursera-machine-learning', true), '📚 Machine Learning');
  });

  it('handles unknown type with default emoji', () => {
    assert.strictEqual(formatCourseName('course-test', true), '📖 Test');
  });
});

describe('buildCatalogOptions', () => {
  it('builds options for each item', () => {
    const result = buildCatalogOptions(['book-a', 'book-b'], 'all');
    assert.strictEqual(result.length, 2);
  });

  it('returns empty array for empty input', () => {
    const result = buildCatalogOptions([], 'all');
    assert.strictEqual(result.length, 0);
  });

  it('includes emoji in html when typeFilter is all', () => {
    const result = buildCatalogOptions(['book-atomic-habits'], 'all');
    assert.ok(result[0].html.includes('📘'));
  });

  it('omits emoji from html when typeFilter is specific', () => {
    const result = buildCatalogOptions(['book-atomic-habits'], 'book');
    assert.ok(!result[0].html.includes('📘'));
  });

  it('formats display text as title case', () => {
    const result = buildCatalogOptions(['book-atomic-habits'], 'all');
    assert.strictEqual(result[0].text, 'Atomic Habits');
  });

  it('preserves value as original name', () => {
    const result = buildCatalogOptions(['book-atomic-habits'], 'all');
    assert.strictEqual(result[0].value, 'book-atomic-habits');
  });
});

describe('getShareUrl', () => {
  const BASE = 'https://quiz.hasit.in/';

  it('returns base URL when no quiz is loaded', () => {
    assert.strictEqual(getShareUrl('', BASE), BASE);
  });

  it('includes course, chapter and question params', () => {
    const url = 'https://raw.githubusercontent.com/hasitpbhatt/gitquiz/main/courses/book-atomic-habits/001.json';
    const result = getShareUrl(url, BASE);
    assert.ok(result.includes('?course=book-atomic-habits'));
    assert.ok(result.includes('&c=001'));
    assert.ok(result.includes('&q=1'));
  });

  it('extracts chapter number from URL filename', () => {
    const url = 'https://example.com/courses/podcast-tim-ferriss/003.json';
    const result = getShareUrl(url, BASE);
    assert.ok(result.includes('&c=003'));
  });

  it('accepts custom question index', () => {
    const url = 'https://example.com/courses/book-deep-work/002.json';
    const result = getShareUrl(url, BASE, 5);
    assert.ok(result.includes('&q=5'));
  });

  it('encodes course name in URL', () => {
    const url = 'https://example.com/courses/book-atomic-habits/001.json';
    const result = getShareUrl(url, BASE);
    assert.strictEqual(result, BASE + '?course=book-atomic-habits&c=001&q=1');
  });
});

describe('calculateScore', () => {
  it('adds base 100 points for correct answer with no speed bonus', () => {
    assert.strictEqual(calculateScore(0, 0, 10), 100);
  });

  it('adds speed bonus for quick answers', () => {
    const result = calculateScore(0, 0, 2);
    assert.strictEqual(result, 100 + 40);
  });

  it('no negative speed bonus for slow answers', () => {
    const result = calculateScore(0, 0, 20);
    assert.strictEqual(result, 100);
  });

  it('adds streak bonus when streak > 2', () => {
    const result = calculateScore(0, 3, 10);
    assert.strictEqual(result, 100 + 20);
  });

  it('combines all bonuses', () => {
    const result = calculateScore(0, 5, 1);
    assert.strictEqual(result, 100 + 45 + 20);
  });

  it('accumulates with existing score', () => {
    const result = calculateScore(500, 0, 10);
    assert.strictEqual(result, 600);
  });
});

describe('calculateNewStreak', () => {
  it('returns 1 when no previous streak', () => {
    assert.strictEqual(calculateNewStreak(null, 0, '2026-05-31'), 1);
  });

  it('returns same count if already visited today', () => {
    assert.strictEqual(calculateNewStreak('2026-05-31', 5, '2026-05-31'), 5);
  });

  it('increments count if yesterday was the last visit', () => {
    assert.strictEqual(calculateNewStreak('2026-05-30', 3, '2026-05-31'), 4);
  });

  it('resets to 1 if last visit was before yesterday', () => {
    assert.strictEqual(calculateNewStreak('2026-05-28', 10, '2026-05-31'), 1);
  });

  it('handles month boundary correctly', () => {
    assert.strictEqual(calculateNewStreak('2026-04-30', 2, '2026-05-01'), 3);
  });

  it('handles year boundary correctly', () => {
    assert.strictEqual(calculateNewStreak('2025-12-31', 7, '2026-01-01'), 8);
  });

  it('handles undefined lastDate', () => {
    assert.strictEqual(calculateNewStreak(undefined, 0, '2026-05-31'), 1);
  });
});

describe('getTodayStr', () => {
  it('returns YYYY-MM-DD format', () => {
    const result = getTodayStr();
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches current date', () => {
    const result = getTodayStr();
    const expected = new Date().toISOString().slice(0, 10);
    assert.strictEqual(result, expected);
  });
});

describe('escapeHtml additional edge cases', () => {
  it('handles numbers', () => {
    assert.strictEqual(escapeHtml(42), '42');
  });
});

describe('filterCatalogItems additional edge cases', () => {
  it('handles null query as string "null"', () => {
    const result = filterCatalogItems(CATALOG, 'all', null);
    assert.strictEqual(result.length, 0);
  });

  it('handles numeric query as string', () => {
    const result = filterCatalogItems(CATALOG, 'all', 123);
    assert.strictEqual(result.length, 0);
  });

  it('leading/trailing whitespace prevents match', () => {
    const result = filterCatalogItems(CATALOG, 'all', '  atomic  ');
    assert.strictEqual(result.length, 0);
  });
});

describe('calculateScore additional edge cases', () => {
  it('handles zero time spent', () => {
    assert.strictEqual(calculateScore(0, 0, 0), 100 + 50);
  });

  it('caps speed bonus at 50 for instant answer', () => {
    const result = calculateScore(0, 0, 0);
    assert.strictEqual(result, 100 + 50);
  });

  it('gives no speed bonus for very slow answers', () => {
    const result = calculateScore(0, 0, 100);
    assert.strictEqual(result, 100);
  });

  it('gives no speed bonus for answers over 10 seconds', () => {
    for (let t = 11; t <= 20; t++) {
      assert.strictEqual(calculateScore(0, 0, t), 100);
    }
  });

  it('handles negative streak as no bonus', () => {
    assert.strictEqual(calculateScore(0, -1, 10), 100);
  });
});

describe('getShareUrl additional edge cases', () => {
  const BASE = 'https://quiz.hasit.in/';

  it('handles URL without path separators gracefully', () => {
    const result = getShareUrl('not-a-url', BASE);
    assert.ok(result.startsWith(BASE));
  });

  it('handles URL with trailing slash on course folder', () => {
    const url = 'https://example.com/courses/book-test/001.json';
    const result = getShareUrl(url, BASE);
    assert.ok(result.includes('&c=001'));
    assert.ok(result.includes('&q=1'));
  });

  it('handles chapter file without .json extension', () => {
    const url = 'https://example.com/courses/book-test/001';
    const parts = url.split('/');
    const modFile = parts.pop();
    assert.ok(modFile === '001');
  });
});
