# gitquiz — Agent Instructions

See README.md for repo structure, course catalog, and quiz JSON format.
See `.opencode/skill/syllabus-to-quiz/SKILL.md` for quiz creation workflow, field reference, constraints, and technical notes.

## Rules

- **Skills first**: Use `syllabus-to-quiz` for all course content work. Never create/modify quiz JSON outside it.
- **5+ chapters**: Write a `gen_course.js` at root, delete after use. Avoid PowerShell for JSON generation.
- **Single-file edits**: Validate each file before moving to the next. No batch edits across chapters.
- **All paths relative to project root** unless stated otherwise.
- **PowerShell execution policy**: Prefix failing commands with `powershell -ExecutionPolicy Bypass -Command "..."`.
- **Run full test suite before commit**: When modifying `quiz/` or `quiz/tests/`, run `npx playwright test` and confirm all pass.
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
