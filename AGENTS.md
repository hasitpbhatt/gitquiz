# gitquiz — Agent Instructions

See `README.md` for repository structure, course catalog, and quiz JSON format.

## Skills

Load the relevant skill before starting a domain-specific task:

| Task | Skill to Load |
|------|---------------|
| Converting syllabus/transcript/notes into quiz JSON | `syllabus-to-quiz` |
| Starting a multi-step task that may trigger compaction | `hasits-plan` |

Skills are loaded via OpenCode: `<use_opencode_tool><name>skill</name><parameter>name</parameter>syllabus-to-quiz</use_opencode_tool>`.

## Rules

### Content & Quiz Rules

1. **7 required fields per question**: `question`, `content`, `description`, `options` (array of 4), `answer`, `explanation`, `difficulty`. No extra fields, no missing fields.
2. **Answer must match option exactly**: The `answer` string must be character-for-character identical to one entry in `options`. Trailing spaces, capitalization, and punctuation differences all cause validation failures.
3. **4 options only**: Exactly 4 strings in `options`. No fewer, no more.
4. **No positional references**: Options must not reference other options by letter/position (e.g., "Both A and B", "All of the above", "A & C", "None of the above"). These break when the JS runtime shuffles option order.
5. **Difficulty values**: Only `"easy"`, `"medium"`, or `"hard"` (lowercase).
6. **Per-chapter difficulty targets**:
    - Easy: 30-40% of questions
    - Medium: 35-45%
    - Hard: 15-25%
7. **7-12 questions per chapter file**: Each `00N.json` file should have 7-12 question objects. More than 12 is allowed but not recommended.
8. **Chapter files numbered 001.json, 002.json, etc.**: Zero-padded 3-digit numbers in filenames.
9. **`courses_list.txt` alphabetically sorted**: After adding a new course, insert its ID in alphabetical order among existing entries.
10. **`courses-meta.json` keys match `courses_list.txt`**: Every key in `courses-meta.json` must appear in `courses_list.txt` and vice versa. Both must be sorted identically. The `chapters` field must match `Get-ChildItem courses/<id>/*.json | Measure-Object | Select-Object -ExpandProperty Count`.

### Workflow Rules

1. **Skills first**: Load `hasits-plan` for any multi-step task (3+ steps or any task that may trigger compaction). Load `syllabus-to-quiz` for all course content work. Never create/modify quiz JSON outside the skill.
2. **Generator for 5+ chapters**: Use `node quiz/scripts/generate-course.mjs input.json` to create chapters from a structured input file (avoids PowerShell quoting issues). Supports `--dry-run` for preview. The generator auto-updates `courses_list.txt` and `courses-meta.json`. Delete `input.json` after use.
3. **Validate before committing**: Run both `node quiz/scripts/validate-all.js` and `npm run test:schema` before committing course content changes. A pre-commit hook (`.githooks/pre-commit`) auto-runs both when course files are staged; enable it with `git config core.hooksPath .githooks` after cloning.
4. **Don't validate courses for code-only changes**: If no files under `courses/` were touched (`git diff --name-only` has no `courses/` entries), skip `validate-all.js` and `test:schema`. Only run Playwright tests relevant to the changed lib files. Batching schema validation on every code change wastes time.
5. **PowerShell execution policy**: Prefix failing commands with `powershell -ExecutionPolicy Bypass -Command "..."`.
6. **All paths relative to project root** unless stated otherwise.
7. **Single-file edits**: Validate each file before moving to the next. Don't batch edits across chapters.
8. **Run affected tests before commit**: Use `node quiz/tests/affected-tests.mjs` to see which tests are relevant to your changes, then run the suggested subset.
    - `npm run test:setup` — `quiz/lib/main.js`, `quiz/lib/state.js`, `quiz/lib/notifications.js`
    - `npm run test:catalog` — `quiz/lib/catalog.js`
    - `npm run test:preview` — `quiz/lib/preview.js`
    - `npm run test:quiz` — `quiz/lib/quiz.js`, `quiz/lib/state.js`
    - `npm run test:params` — `quiz/lib/main.js`
    - `npm run test:ui` — `quiz/lib/sharing.js`
    - `npm run test:ai` — `quiz/lib/ai.js`
    - `npm run test:unit` — `quiz/lib/state.js`, `quiz/lib/catalog.js`, `quiz/lib/sharing.js` (isolated function tests)
    - `npm run test:visual` — visual-only changes
    - `npm run test:schema` — `courses/**/*.json`, `courses/course-schema.json`

### Frontend Conventions

1. **Catalog test conventions**:
    - `CATALOG_CONTENT` = `\n`-joined course IDs
    - Use `toHaveAttribute('value', …)` for `<option>`
    - Type filter buttons use `data-type` (e.g., `.type-filter-btn[data-type="book"]`)
    - `#course-dropdown` has `w-full` class
2. **Course ID display**:
    - Type prefix stripped via `/^(book|podcast|coursera|course)-/i`
    - Emoji prefix (`📘`/`🎙`/`📖`) shown only when `activeTypeFilter === 'all'`
    - Kebab-case → Title Case for display
3. **Overflow-prone DOM elements** (must not push content off-screen):
    - `#preview-badge` — course ID badge. Has `truncate max-w-[200px]`
    - `#preview-title` — course name (`h2`). Add mobile truncation in `styles.css`
    - `#module-label` — quiz header span between "← Menu" and "Skip Module". Add `max-width: 140px` + mobile truncation; without it "Skip Module" gets pushed off-screen
    - `#course-dropdown option` — truncated with `text-overflow: ellipsis` on mobile; each `<option>` gets a `title` attribute via `renderCatalogOptions()` for full-name hover tooltip
    - `#begin-btn-wrapper` — `position: fixed; bottom: 0` on mobile with `padding-bottom: env(safe-area-inset-bottom)`; `.glass-card` adds 80px bottom padding to prevent content overlap
    - `#topic-title`, `#description-text`, `#content-box` — wrapping OK, no truncation
4. **Styling**:
    - Tailwind CSS via CDN (no build step) — utility classes in HTML
    - Custom CSS (`styles.css`): CSS variables (`--bg-main` etc.) + `@media (prefers-color-scheme: dark)`
    - JS toggles classes (`hidden`, `correct`, `wrong`, `screen-enter`, `score-pop`)
    - Mobile overrides use `@media (max-width: 640px)`
5. **Screen transition animation**: The `screen-enter` CSS class triggers `fadeSlideIn` animation (0.3s ease-out). Applied to preview, quiz-flow, and completion-screen on reveal.
6. **Progress bar transition**: `#progress-fill` has `transition: width 0.3s ease` for smooth animation.
7. **Focus indicators**: `:focus-visible` outline (2px `var(--accent)`, offset 2px) on `#catalog-search`, `#quiz-url`, `#share-btn`, `#url-toggle-btn`, `#course-dropdown`.

### Quiz Engine Conventions

1. **Scoring**: `score += 100 + max(0, 50 - timeSpent * 5) + (streak > 2 ? 20 : 0)`
2. **Streak**: Consecutive correct answers. Resets to 0 on wrong answer.
3. **Timer**: `secondsElapsed` increments every second during quiz. Shown in `#timer-val`.
4. **Daily streak**: Stored in localStorage key `quizDailyStreak` as `{ lastDate: "YYYY-MM-DD", count: <number> }`. Updated on quiz start and completion.
5. **Options shuffling**: Options are shuffled via Fisher-Yates inside `shuffleArray()` in `quiz.js`. Answer matching is done against the original (pre-shuffle) text.
6. **Module chaining**: After the last question of a chapter, if the course has more chapters, "Start Next Module" button appears. If it was the last chapter, "Return to Catalog" appears with trophy animation.
7. **Custom URL loading**: The user can paste any JSON URL — no path validation required. The URL section (`#url-section`, `#quiz-url`) is **lazy-created** by `getOrCreateUrlSection()` in `catalog.js` on first `toggleUrlInput()` call — it does not exist in initial HTML. Code that references `#quiz-url` must guard with `document.getElementById('quiz-url')` null check.
8. **AI Explain flow**: Button `#explain-more-btn` triggers `askAI()`. POSTs to `MISTRAL_PROXY_URL` with question context, user's answer, and correctness. Shows response in `#ai-response`. Falls back gracefully on failure.
9. **Sharing context**:
    - **Completion screen** → share certificate + score
    - **Quiz active** → share question + user's answer
    - **Catalog screen** → share portal link
10. **Achievement card**: Template hidden off-screen at `#achievement-card-template` (CSS `left: -9999px`). Uses `html2canvas` to render to PNG.

### Test Conventions (`quiz/tests/`)

Two test runners coexist:

- **Node `node:test`** (`.test.mjs` files) — pure function unit tests and schema validation. No browser, no Playwright dependency. Run via `node --test *.test.mjs` or `npm run test:unit` / `npm run test:schema`.
- **Playwright** (`.spec.mjs` files) — DOM interaction and visual regression tests. Requires `npx playwright test <file>`.

**Node test conventions (`lib-unit.test.mjs`, `schema-valid.test.mjs`):**
1. Pure functions extracted into `test-helpers.mjs` (imported by unit tests) — duplicates `lib/` logic for testability without refactoring app globals
2. Uses `node:test` (`describe`/`it`) and `node:assert/strict`
3. `schema-valid.test.mjs` validates all JSON files dynamically (no Playwright browser, no AJV in this file — uses plain JSON traversal)

**Playwright conventions:**
1. Opens `file:///.../quiz/index.html` via `page.goto()`
2. Uses `devices['iPhone X']` for mobile screenshots in visual tests
3. Common operations: `page.waitForFunction()`, `waitForSelector()`, `el.scrollIntoView()`
4. Snapshots: `expect(await page.screenshot()).toMatchSnapshot(...)` with `threshold: 0.01`
5. **Main config** (`playwright.config.mjs`): Two projects in sequence (Desktop 1280×800, Mobile Pixel 5), `webServer` on port 8765, `fullyParallel: false`
6. **Playwright helpers** (`test-utils.mjs`):
    - `CATALOG_CONTENT` = `\n`-joined course IDs
    - `MOCK_MODULES` = `{ "001": [...questions...], "002": [...questions...] }`
    - `setupMockRoutes()` = intercepts catalog and module URLs
    - `createMockQuestion()` = generates a question with given overrides
    - `test-helpers.mjs` also used by Playwright tests that import pure functions directly
7. **Affected test mapping** (in `affected-tests.mjs`):
    - `courses/` → `schema-valid.test.mjs`
    - `quiz/lib/main.js` → `setup.spec.mjs`, `url-params.spec.mjs`
    - `quiz/lib/state.js` → `setup.spec.mjs`, `navigation.spec.mjs`, `lib-unit.test.mjs`, `quiz.spec.mjs`
    - `quiz/lib/catalog.js` → `catalog.spec.mjs`, `lib-unit.test.mjs`
    - `quiz/lib/preview.js` → `preview.spec.mjs`
    - `quiz/lib/quiz.js` → `quiz.spec.mjs`, `navigation.spec.mjs`
    - `quiz/lib/sharing.js` → `ui.spec.mjs`, `lib-unit.test.mjs`
    - `quiz/lib/notifications.js` → `setup.spec.mjs`
    - `quiz/lib/ai.js` → `ai.spec.mjs`
    - `quiz/styles.css` → `visual.spec.mjs`
    - `quiz/index.html` → all spec and test files
    - `quiz/tests/test-helpers.mjs` → `lib-unit.test.mjs`
    - `courses/course-schema.json` → `schema-valid.test.mjs`

### Course Metadata Conventions

- `courses-meta.json` keys are course IDs (e.g., `"book-atomic-habits"`)
- Fields: `title` (string), `type` (enum: `book`/`podcast`/`coursera`), `chapters` (number), `source` (string|null), `description` (string)
- The `type` field determines the emoji prefix shown in the UI
- The `chapters` field must match the actual number of chapter JSON files on disk

### CI Details

- `.github/workflows/validate.yml` has 3 jobs: `schema`, `validate-all`, `full-suite`
- `full-suite` uses `dorny/paths-filter` to skip when only `courses/**` or `*.md` changed
- Node.js version: 24. Cache: `npm` for `quiz/tests/package-lock.json`
- `npm run test:schema` runs with `node --test schema-valid.test.mjs`
- Scheduled daily at 11:56 UTC

### OpenCode Configuration

- `opencode.json` specifies DeepSeek V4 Flash as the primary model, Mistral Large and OpenAI o3-mini as fallbacks
- Nemotron 3 Super DGX used for embeddings
- Context compaction enabled at 80K tokens
- `AGENTS.md` added to `compactifyIncludes` for context survival
- Skills loaded on startup: `hasits-plan`, `customize-opencode`
