import { test, expect } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = `file:///${path.resolve(__dirname, '..', 'index.html').replace(/\\/g, '/')}`;

test.describe('escapeHtml', () => {
  let page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(INDEX_PATH);
    await page.waitForFunction(() => typeof escapeHtml === 'function');
  });
  test.afterAll(async () => { await page.close(); });
  test.beforeEach(async () => {
    await page.evaluate(() => { score = 0; streak = 0; currentIdx = 0;
      quizData = []; fullCatalog = []; activeTypeFilter = 'all'; currentUrl = '';
      previewUrl = ''; previewData = null; clearInterval(timerInterval); });
  });

  test('leaves plain text unchanged', async () => {
    expect(await page.evaluate(() => escapeHtml('hello world'))).toBe('hello world');
  });

  test('escapes < and >', async () => {
    expect(await page.evaluate(() => escapeHtml('<script>'))).toBe('&lt;script&gt;');
  });

  test('escapes ampersand', async () => {
    expect(await page.evaluate(() => escapeHtml('a & b'))).toBe('a &amp; b');
  });

  test('leaves double quotes as-is (not special in text content)', async () => {
    expect(await page.evaluate(() => escapeHtml('say "hello"'))).toBe('say "hello"');
  });

  test('handles empty string', async () => {
    expect(await page.evaluate(() => escapeHtml(''))).toBe('');
  });

  test('handles mixed content', async () => {
    expect(await page.evaluate(() => escapeHtml('<b>AT&T</b>'))).toBe('&lt;b&gt;AT&amp;T&lt;/b&gt;');
  });
});

test.describe('shuffleArray', () => {
  let page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(INDEX_PATH);
    await page.waitForFunction(() => typeof shuffleArray === 'function');
  });
  test.afterAll(async () => { await page.close(); });

  test('preserves array length', async () => {
    const len = await page.evaluate(() => shuffleArray([1, 2, 3, 4, 5]).length);
    expect(len).toBe(5);
  });

  test('contains all original elements', async () => {
    const sorted = await page.evaluate(() =>
      shuffleArray([1, 2, 3, 4, 5]).sort()
    );
    expect(sorted).toEqual([1, 2, 3, 4, 5]);
  });

  test('handles empty array', async () => {
    const result = await page.evaluate(() => shuffleArray([]));
    expect(result).toEqual([]);
  });

  test('handles single-element array', async () => {
    const result = await page.evaluate(() => shuffleArray(['only']));
    expect(result).toEqual(['only']);
  });
});

test.describe('renderCatalogOptions', () => {
  let page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(INDEX_PATH);
    await page.waitForFunction(() => typeof renderCatalogOptions === 'function');
  });
  test.afterAll(async () => { await page.close(); });
  test.beforeEach(async () => {
    await page.evaluate(() => {
      const dd = document.getElementById('course-dropdown');
      if (dd) dd.innerHTML = '';
      fullCatalog = []; activeTypeFilter = 'all';
    });
  });

  test('renders option for each item', async () => {
    const count = await page.evaluate(() => {
      renderCatalogOptions(['book-a', 'book-b']);
      return document.getElementById('course-dropdown').options.length;
    });
    expect(count).toBe(2);
  });

  test('shows empty message for empty array', async () => {
    const inner = await page.evaluate(() => {
      renderCatalogOptions([]);
      return document.getElementById('course-dropdown').innerHTML;
    });
    expect(inner).toContain('No matches found');
  });

  test('prepends emoji when activeTypeFilter is all', async () => {
    const text = await page.evaluate(() => {
      activeTypeFilter = 'all';
      renderCatalogOptions(['book-test', 'podcast-test']);
      const dd = document.getElementById('course-dropdown');
      return dd.options[0].innerHTML;
    });
    expect(text).toContain('📘');
  });

  test('omits emoji when type filter is set', async () => {
    const text = await page.evaluate(() => {
      activeTypeFilter = 'book';
      renderCatalogOptions(['book-test']);
      const dd = document.getElementById('course-dropdown');
      return dd.options[0].innerHTML;
    });
    expect(text).not.toContain('📘');
  });

  test('formats course name with title case', async () => {
    const text = await page.evaluate(() => {
      renderCatalogOptions(['book-atomic-habits']);
      return document.getElementById('course-dropdown').options[0].text;
    });
    expect(text).toContain('Atomic Habits');
  });

  test('selects first option by default', async () => {
    const idx = await page.evaluate(() => {
      renderCatalogOptions(['book-a', 'book-b']);
      return document.getElementById('course-dropdown').selectedIndex;
    });
    expect(idx).toBe(0);
  });
});

test.describe('toggleUrlInput', () => {
  let page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(INDEX_PATH);
    await page.waitForFunction(() => typeof toggleUrlInput === 'function');
  });
  test.afterAll(async () => { await page.close(); });
  test.beforeEach(async () => {
    await page.evaluate(() => {
      const section = document.getElementById('url-section');
      if (section) { section.classList.add('hidden'); }
      const btn = document.getElementById('url-toggle-btn');
      if (btn) { btn.innerText = '\uD83D\uDD17 Custom URL'; }
    });
  });

  test('shows hidden URL section', async () => {
    const hidden = await page.evaluate(() => {
      toggleUrlInput();
      return document.getElementById('url-section').classList.contains('hidden');
    });
    expect(hidden).toBe(false);
  });

  test('hides visible URL section on second call', async () => {
    const hidden = await page.evaluate(() => {
      toggleUrlInput();
      toggleUrlInput();
      return document.getElementById('url-section').classList.contains('hidden');
    });
    expect(hidden).toBe(true);
  });

  test('updates button text', async () => {
    const text = await page.evaluate(() => {
      toggleUrlInput();
      return document.getElementById('url-toggle-btn').innerText;
    });
    expect(text).toBe('\u2715 Custom URL');
  });
});

test.describe('filterCatalog', () => {
  let page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(INDEX_PATH);
    await page.waitForFunction(() => typeof filterCatalog === 'function');
  });
  test.afterAll(async () => { await page.close(); });
  test.beforeEach(async () => {
    await page.evaluate(() => {
      fullCatalog = ['book-atomic-habits', 'book-deep-work', 'podcast-tim-ferriss', 'coursera-ml'];
      activeTypeFilter = 'all';
      const search = document.getElementById('catalog-search');
      if (search) search.value = '';
    });
  });

  test('returns all items when no filter is active', async () => {
    const count = await page.evaluate(() => {
      filterCatalog();
      return document.getElementById('course-dropdown').options.length;
    });
    expect(count).toBe(4);
  });

  test('filters by type', async () => {
    const values = await page.evaluate(() => {
      activeTypeFilter = 'book';
      filterCatalog();
      const dd = document.getElementById('course-dropdown');
      return [...dd.options].map(o => o.value);
    });
    expect(values).toEqual(['book-atomic-habits', 'book-deep-work']);
  });

  test('filters by search text', async () => {
    const values = await page.evaluate(() => {
      document.getElementById('catalog-search').value = 'deep';
      filterCatalog();
      const dd = document.getElementById('course-dropdown');
      return [...dd.options].map(o => o.value);
    });
    expect(values).toEqual(['book-deep-work']);
  });

  test('combines type and search filters', async () => {
    const values = await page.evaluate(() => {
      activeTypeFilter = 'book';
      document.getElementById('catalog-search').value = 'atomic';
      filterCatalog();
      const dd = document.getElementById('course-dropdown');
      return [...dd.options].map(o => o.value);
    });
    expect(values).toEqual(['book-atomic-habits']);
  });

  test('returns empty when nothing matches', async () => {
    const inner = await page.evaluate(() => {
      document.getElementById('catalog-search').value = 'zzzzz';
      filterCatalog();
      return document.getElementById('course-dropdown').innerHTML;
    });
    expect(inner).toContain('No matches found');
  });

  test('search matches across word boundaries (dashes replaced by spaces)', async () => {
    const values = await page.evaluate(() => {
      document.getElementById('catalog-search').value = 'tim ferriss';
      filterCatalog();
      const dd = document.getElementById('course-dropdown');
      return [...dd.options].map(o => o.value);
    });
    expect(values).toEqual(['podcast-tim-ferriss']);
  });
});

test.describe('getShareUrl', () => {
  let page;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto(INDEX_PATH);
    await page.waitForFunction(() => typeof getShareUrl === 'function');
  });
  test.afterAll(async () => { await page.close(); });

  test('returns base URL when no quiz is loaded', async () => {
    const url = await page.evaluate(() => {
      currentUrl = '';
      return getShareUrl();
    });
    expect(url).not.toContain('?course=');
  });

  test('includes course param when quiz is loaded', async () => {
    const url = await page.evaluate(() => {
      currentUrl = 'https://raw.githubusercontent.com/hasitpbhatt/gitquiz/main/courses/book-atomic-habits/001.json';
      return getShareUrl();
    });
    expect(url).toContain('?course=book-atomic-habits');
  });
});
