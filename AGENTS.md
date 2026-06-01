# gitquiz — Agent Instructions

See README.md for repo structure, course catalog, and quiz JSON format.
See `.opencode/skill/syllabus-to-quiz/SKILL.md` for quiz creation workflow, field reference, constraints, and technical notes.

## Rules

- **Skills first**: 
  - Use `hasits-plan` at the start of any multi-step task (3+ steps or any task that may trigger compaction). It persists a hierarchical plan tree to `.hasit/` so work survives context compaction.
  - Use `syllabus-to-quiz` for all course content work. Never create/modify quiz JSON outside it.
- **5+ chapters**: Use `node quiz/scripts/generate-course.mjs input.json` to create chapters from a structured input file (avoids PowerShell quoting issues). Supports `--dry-run` for preview. The generator auto-updates `courses_list.txt` and `courses-meta.json`. Delete the input file after use.
- **Metadata sync**: Every course must have an entry in `courses/courses-meta.json` (title, type, chapters, source, description). The entry is auto-created by `generate-course.mjs`. For manual additions, edit both `courses_list.txt` and `courses-meta.json` in sync — validated by `npm run test:schema` and `node quiz/scripts/validate-all.js`.
- **Single-file edits**: Validate each file before moving to the next. No batch edits across chapters.
- **All paths relative to project root** unless stated otherwise.
- **PowerShell execution policy**: Prefix failing commands with `powershell -ExecutionPolicy Bypass -Command "..."`.
- **Run affected tests before commit**: Use `node quiz/tests/affected-tests.mjs` to see which tests are relevant to your changes, then run the suggested subset. Run `npx playwright test` (full suite) only when modifying `index.html`, `styles.css`, or test config. Quick reference:
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
  - `npm run test:affected` — auto-detect based on `git diff`
- **Catalog test conventions**: `CATALOG_CONTENT` = `\n`-joined course IDs. Use `toHaveAttribute('value', …)` for `<option>`. Type filter buttons use `data-type` (e.g., `.type-filter-btn[data-type="book"]`). `#course-dropdown` has `w-full`.

## Frontend Architecture

### Quiz flow (in `quiz/`)
Catalog → Preview (preview-container) → Quiz (quiz-flow) → Results + Achievement card.

### Overflow-prone DOM elements
- `#preview-badge` — course ID badge. Has `truncate max-w-[200px]`.
- `#preview-title` — course name (`h2`). Add mobile truncation in `styles.css`.
- `#module-label` — quiz header span between "← Menu" and "Skip Module". Add `max-width: 140px` + mobile truncation; without it "Skip Module" gets pushed off-screen.
- `#topic-title`, `#description-text`, `#content-box` — wrapping OK, no truncation.

### Course ID conventions
- IDs follow `{type}-{slug}` (e.g., `book-git-basics`, `podcast-clean-code`). The type prefix is stripped from display via `.replace(/^(book|podcast|coursera|course)-/i, '')` in `renderCatalogOptions()`, `showPreview()`, and quiz headers. Emoji prefix (`📘`/`🎙`/`📖`) shown only when `activeTypeFilter === 'all'`.

### Styling conventions
- **Tailwind CSS via CDN** (no build step) — utility classes in HTML.
- **Custom CSS** (`styles.css`): CSS variables (`--bg-main` etc.) + `@media (prefers-color-scheme: dark)`.
- JS toggles classes (`hidden`, `correct`, `wrong`).
- Mobile overrides use `@media (max-width: 640px)`.

### Test conventions (Playwright, `quiz/tests/visual.spec.mjs`)
- Opens `file:///.../quiz/index.html` via `page.goto()`.
- Uses `devices['iPhone X']` for mobile screenshots.
- Common: `page.waitForFunction()`, `waitForSelector()`, `el.scrollIntoView()`.
- Snapshots: `expect(await page.screenshot()).toMatchSnapshot(...)` with `threshold: 0.01`.
