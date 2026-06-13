# MindVault (gitquiz)

Interactive quiz platform for reviewing books, podcasts, and courses through active recall. Live at [quiz.hasit.in](https://quiz.hasit.in/).

## Repository Structure

```
├── courses/                          # Quiz content (JSON)
│   ├── courses_list.txt              # Catalog of all course folders (IDs only, alphabetically sorted)
│   ├── courses-meta.json             # Course metadata (title, type, chapters, source, description)
│   ├── course-schema.json            # JSON Schema for chapter validation
│   ├── book-<title>/                 # One folder per book/course
│   │   ├── 001.json                  # Chapter 1 questions (array of 7-field objects)
│   │   ├── 002.json                  # Chapter 2 questions
│   │   └── ...
│   ├── podcast-<title>/...
│   └── coursera-<title>/...
├── quiz/                             # Frontend application
│   ├── index.html                    # Single-page quiz app (vanilla JS + Tailwind CDN)
│   ├── styles-theme.css              # CSS variables, theme definitions, reset
│   ├── styles.css                    # Component styles (UI, animations, cards)
│   ├── styles-responsive.css         # Mobile media queries
│   ├── lib/                          # Modular JS (loaded via <script> tags, no bundler)
│   │   ├── state.js                  # Global state, BASE_URL, CATALOG_URL, streak utils
│   │   ├── catalog.js                # Course catalog: load, filter, render, type filters
│   │   ├── preview.js                # Preview screen: fetch module, show first question
│   │   ├── quiz.js                   # Quiz engine: timer, scoring, render, skip, completion
│   │   ├── sharing.js                # Share modal, download PNG (html2canvas), Web Share API
│   │   ├── notifications.js          # Toast notifications (showNotify, showNotifyWithAction)
│   │   ├── ai.js                     # AI Explain: calls Mistral via Cloudflare Worker proxy
│   │   └── main.js                   # Entry point: loads catalog, handles URL params, keyboard shortcuts
│   ├── tests/                        # Playwright end-to-end + schema tests
│   │   ├── *.spec.mjs                # 10 domain-split spec files
│   │   ├── test-utils.mjs            # Shared mock data (CATALOG_CONTENT, MOCK_MODULES) & route setup
│   │   ├── affected-tests.mjs        # Git-diff-based test selector (maps changed files to test specs)
│   │   ├── schema.config.mjs         # Lightweight config for schema tests (parallel, no server)
│   │   ├── playwright.config.mjs     # Main Playwright config (desktop + mobile, server on port 8765)
│   │   └── package.json              # Test dependencies (Playwright, Ajv)
│   └── proxy/                        # Cloudflare Worker for AI explanations
│       └── worker.js                 # Mistral AI proxy (POST, returns model response)
├── quiz/scripts/                     # Node.js utility scripts (run from project root)
│   ├── answer-length-audit.js        # Detect answer-length bias (shortest/longest %)
│   ├── assemble-course.mjs           # Assembly helper: ch-*.json → input.json
│   ├── coverage-check.js             # Verify concept coverage against keyword inventory
│   ├── cross-chapter-repetition.js   # Detect concepts appearing in 3+ chapters
│   ├── difficulty-audit.js           # Print all questions with blank E/M/H brackets for labeling
│   ├── difficulty-tally.js           # Tally difficulty distribution (E/M/H) across all courses
│   ├── fix-length-bias.mjs           # Auto-fix longest-answer bias by truncating conjunctions
│   ├── generate-course.mjs           # CLI generator: input.json → split chapter files + metadata update
│   ├── validate-all.js               # Validate all courses: chapter counts, metadata sync, bias checks
│   └── validate.js                   # Validate a single course (arg: `<course-dir>`)
├── .opencode/                        # OpenCode AI agent configuration
│   ├── skill/hasits-plan/SKILL.md    # Plan persistence for LLM context survival
│   └── skill/syllabus-to-quiz/SKILL.md # Workflow for converting courses to quizzes
├── .github/workflows/validate.yml    # CI: schema validation, validate-all, full Playwright suite
├── opencode.json                     # OpenCode AI config (model limits, compaction, instructions)
├── AGENTS.md                         # AI agent development instructions (this file)
└── README.md                         # This file
```

## Course Format

Each course folder contains numbered chapter files (`001.json`, `002.json`, ...). Each file is a JSON array of question objects with **exactly 7 fields**:

### Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `question` | `string` | Short concept name (e.g., "Opportunity Cost") |
| `content` | `string` | Brief 1-2 sentence explanation of the concept |
| `description` | `string` | Real-world scenario ending with a question (e.g., "This illustrates:") |
| `options` | `string[]` | Array of **exactly 4** plausible answer strings. Must not reference other options by position (no "Both B and C", "All of the above") |
| `answer` | `string` | Correct answer — must be **identical** (case, punctuation, whitespace) to one of the `options` entries |
| `explanation` | `string` | Teaching explanation of why this answer is correct and the others are not |
| `difficulty` | `string` | One of: `"easy"`, `"medium"`, `"hard"` |

### Template

```json
[
  {
    "question": "Concept Name",
    "content": "Brief explanation of the concept (1-2 sentences).",
    "description": "Real-world scenario that illustrates the concept. What does this demonstrate?",
    "options": [
      "Incorrect option 1",
      "Incorrect option 2",
      "Correct option — exact text repeated in answer field",
      "Incorrect option 4"
    ],
    "answer": "Correct option — exact text repeated in options",
    "explanation": "Clear explanation of why this is correct and the others are not.",
    "difficulty": "easy"
  }
]
```

### Constraints

- **7 fields required**: All fields above are mandatory in every question object. Missing or extra fields will fail validation.
- **Answer match**: `answer` must match one `options` entry character-for-character. Common pitfalls: trailing spaces, mismatched punctuation, capitalization differences.
- **4 options**: Exactly 4 strings in `options`. No fewer, no more.
- **No positional references**: Options must not reference other options by letter (e.g., "Both A and B", "All of the above", "A & C"). These break when options are shuffled at runtime.
- **Difficulty enum**: Must be `"easy"`, `"medium"`, or `"hard"` — lowercase, no other values.
- **No answer-length bias**: The answer must not be uniquely longer or shorter than all other options. Use `answer-length-audit.js` to detect bias and `fix-length-bias.mjs` to auto-fix.

### Difficulty Distribution

Per-chapter targets (validated by `difficulty-tally.js`):
- **Easy** (30-40%): Straightforward recall / direct application
- **Medium** (35-45%): Apply to unfamiliar scenario, all options plausible
- **Hard** (15-25%): Synthesize multiple concepts, catch subtleties

Hard question techniques: trapdoor option, reverse application, boundary case, competing principles, option symmetry.

## Available Courses

| Course | Chapters | Source |
|--------|----------|--------|
| book-algorithms-to-live-by | 7 | Algorithms to Live By |
| book-almanack-of-naval-ravikant | 10 | The Almanack of Naval Ravikant |
| book-atomic-habits | 11 | Atomic Habits |
| book-beginning-of-infinity | 8 | The Beginning of Infinity |
| book-bhagavad-gita | 11 | Bhagavad Gita |
| book-cointelligence | 10 | Co-Intelligence |
| book-deep-work | 7 | Deep Work |
| book-get-better-at-anything | 8 | Get Better at Anything |
| book-influence | 8 | Influence |
| book-seeking-wisdom-darwin-to-munger | 8 | Seeking Wisdom |
| book-super-thinking | 11 | Super Thinking |
| book-the-adaptive-edge | 16 | The Adaptive Edge |
| book-the-changing-world-order | 15 | The Changing World Order |
| book-the-great-mental-models-v1 | 11 | The Great Mental Models Volume 1 |
| book-the-great-mental-models-v2 | 15 | The Great Mental Models Volume 2 |
| book-the-great-mental-models-v3 | 17 | The Great Mental Models Volume 3 |
| book-the-great-mental-models-v4 | 6 | The Great Mental Models Volume 4 |
| book-the-psychology-of-money | 20 | The Psychology of Money |
| book-the-startup-of-you | 9 | The Startup of You |
| coursera-financial-markets-global | 12 | Coursera: Financial Markets |
| coursera-finding-purpose-and-meaning-in-life | 6 | Coursera: Finding Purpose and Meaning in Life |
| coursera-genai-for-algorithmic-trading | 11 | Coursera: GenAI for Algorithmic Trading |
| podcast-age-of-async-agents | 8 | Latent Space Podcast |
| podcast-daytona | 5 | Latent Space Podcast (Daytona) |
| podcast-nothing-ever-happens-is-over | 14 | Naval Podcast |
| podcast-regulatory-frontier | 1 | Naval Podcast (Blake Scholl) |
| podcast-vibe-coding-hardware | 2 | Naval Podcast |
| podcast-waste-tokens-save-time | 1 | Naval Podcast (Guillermo Rauch) |

## Quiz Scripts

Utility scripts in `quiz/scripts/`. Run with `node quiz/scripts/<name>` from the project root.

| Script | Purpose |
|--------|---------|
| `answer-length-audit.js` | Detect answer-length bias (shortest/longest %) — arg: `<course-id>` (default: all courses) |
| `validate.js` | Validate a single course — arg: `<course-dir>` (default: `courses/course-identifier`) |
| `validate-all.js` | Validate every course: chapter counts (7-12), metadata sync, answer-in-options, positional refs, filename format, answer-length bias |
| `difficulty-tally.js` | Auto-tally E/M/H distribution across all courses |
| `difficulty-audit.js` | Print all questions with blank E/M/H brackets for manual labeling — arg: `<course-dir>` (default: `courses/course-identifier`) |
| `coverage-check.js` | Verify concept inventory coverage — edit `inventory` array; arg: `<course-dir>` (default: `courses/course-identifier`) |
| `cross-chapter-repetition.js` | Detect concepts appearing in 3+ chapters — edit `conceptGroups`; arg: `<course-dir>` (default: `courses/course-identifier`) |
| `assemble-course.mjs` | **Assembly helper**: `node quiz/scripts/assemble-course.mjs <course-id>` — reads `ch-*.json` files from `courses/<id>/` and outputs an `input.json` for the generator. Deletes `input.json` after use. |
| `fix-length-bias.mjs` | **Auto-fix longest-answer bias**: `node quiz/scripts/fix-length-bias.mjs <course-id>` — reduces over-long answers by truncating conjunction clauses ("because", "which"). Run after `answer-length-audit.js` detects bias. |
| `generate-course.mjs` | **CLI generator**: `node quiz/scripts/generate-course.mjs input.json` — reads a single input JSON (id, chapters[] with title+seq+questions[]), produces split 001-00N.json files, validates, creates dir, updates `courses_list.txt` and `courses-meta.json`. Supports `--dry-run`. |

## Adding a New Course

### For 5+ chapters: ch-* → assemble → generate

For courses with many chapters, use the intermediate `ch-*.json` workflow to avoid monolithic file management:

1. Create `courses/<course-id>/`
2. Write intermediate chapter files as `ch-001.json`, `ch-002.json`, etc., each with the format:
   ```json
   {
     "title": "Chapter Name",
     "questions": [ /* question objects with 7 fields each */ ]
   }
   ```
3. Assemble into generator input:
   ```bash
   node quiz/scripts/assemble-course.mjs <course-id>
   ```
   This reads `ch-*.json` files and writes `input.json` at the project root.
4. Generate final chapter files:
   ```bash
   node quiz/scripts/generate-course.mjs input.json
   ```
   This creates `001-00N.json` files, updates `courses_list.txt` and `courses-meta.json`.
5. Delete intermediate files:
   ```bash
   rm courses/<course-id>/ch-*.json input.json
   ```

**Preferred method** — use the generator directly (for ≤4 chapters or structured input):

```bash
node quiz/scripts/generate-course.mjs input.json
```

This creates the directory, writes all chapter files, adds to `courses_list.txt` alphabetically, and creates/updates the `courses-meta.json` entry. Delete `input.json` after use.

**Manual method** (fallback):
1. Create `courses/<course-id>/`
2. Add chapter files `001.json`, `002.json`, etc. (7-12 questions per file)
3. Add the course ID to `courses/courses_list.txt` in alphabetical order
4. Add matching entry to `courses/courses-meta.json` with `title`, `type`, `chapters`, `source`, `description`

**Course ID convention**: `{type}-{slug}` where type is `book`, `podcast`, or `coursera`. The type prefix is stripped for display.

**Validation**:
```bash
node quiz/scripts/validate-all.js      # comprehensive check from root
node quiz/tests — npx playwright test schema.spec.mjs --config schema.config.mjs
```

## Metadata

Each course has a metadata entry in `courses/courses-meta.json`:

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Human-readable course name |
| `type` | `string` | `"book"`, `"podcast"`, or `"coursera"` |
| `chapters` | `number` | Number of chapter JSON files |
| `source` | `string\|null` | URL to original content or `null` |
| `description` | `string` | One-line summary with host/author and topic |

Keys in `courses-meta.json` must match `courses_list.txt` exactly and be sorted identically. Validated by `validate-all.js`.

## Frontend Architecture

### Quiz Flow
```
Catalog (setup-container) → Preview (preview-container) → Quiz (quiz-flow) → Results + Achievement Card (completion-screen)
```

### Page Screens
1. **Setup/Catalog Screen** (`#setup-container`): Search bar, SVG type filter buttons (All/Books/Podcasts/Courses), custom `<div>`-based course list with row icons, NEW pill badge on unseen courses, Custom Quiz toggle in footer (lazy-created — not in DOM until first click), daily streak badge
2. **Preview Screen** (`#preview-container`): Course badge, title, question count + chapter count, first question preview with options, chapter grid for multi-chapter navigation, Start Quiz / Cancel buttons
3. **Quiz Screen** (`#quiz-container`): Progress bar, score/streak/timer stat cards, quiz flow with question, options (shuffled), explanation panel, AI Explain button, Continue button
4. **Completion Screen** (`#completion-screen`): Trophy animation, final score, total time, Download Achievement Card button, Start Next Module / Return to Catalog

### Key DOM Elements
| Element | Purpose |
|---------|---------|
| `#course-dropdown` | Course selector (`div`-based custom list with `.list-item` rows, SVG type icons, NEW pill badge, `data-value` attribute, selected state with blue left border) |
| `#catalog-search` | Search input |
| `.type-filter-btn[data-type]` | Type filter buttons (all, book, podcast, coursera) |
| `#daily-streak-badge` | Streak notification (hidden when 0) |
| `#preview-badge` | Course ID badge (`truncate max-w-[200px]`) |
| `#preview-title` | Course name (`h2`, mobile truncation) |
| `#preview-meta` | Preview stats text (question count + chapter count) |
| `#preview-chapter-grid` | Chapter navigation grid (flex-wrap, `.chapter-btn` / `.chapter-btn-active`) |
| `#module-label` | Quiz header label between "← Menu" and "Skip Module" (`max-width: 140px` + mobile truncation) |
| `#topic-title`, `#description-text`, `#content-box` | Question content (wrapping OK, no truncation) |
| `#options-bin` | Shuffled multiple-choice buttons |
| `#explanation` | Post-answer teaching explanation |
| `#ai-section` | AI Explain More button + response area |
| `#progress-fill` | Progress bar width (0-100%) |
| `#score-val`, `#streak-val`, `#timer-val` | Quiz stat displays |
| `#ach-*` | Achievement card elements (hidden off-screen via `left: -9999px`) |

### State Flow
- `quizData[]` — questions for current module
- `currentIdx` — current question index
- `score` — cumulative points (100 base + streak bonus)
- `streak` — consecutive correct answers (resets on wrong)
- `secondsElapsed` — timer counter
- `userName` — stored in localStorage (`quizUserName`)
- `fullCatalog` — array of course IDs fetched from GitHub Raw
- `previewData` — cached module data for preview-to-quiz handoff

### URL Parameters
| Param | Effect |
|-------|--------|
| `?course=<id>` | Selects course in dropdown, auto-starts quiz |
| `?c=<n>` | Chapter number (used with `?course=`) |
| `?q=<n>` | Jump to question index in preview (used with `?course=`) |

### Keyboard Shortcuts
| Key | Context | Action |
|-----|---------|--------|
| `1`-`4` | Quiz active | Select option by position |
| `Enter` | Quiz (after answer) | Click Continue/Next |
| `Enter` | Preview screen | Click Start Quiz |

### Scenes and transitions
- `screen-enter` CSS class triggers `fadeSlideIn` animation (0.3s ease-out)
- Applied to preview, quiz-flow, and completion-screen on reveal

### Scoring
- Base: **100 points** per correct answer
- Streak bonus: **+20 points** when streak > 2
- Total: `score += 100 + (streak > 2 ? 20 : 0)`
- Wrong answer: streak resets to 0

### Daily Streak
- Stored in `localStorage` under key `quizDailyStreak`
- Format: `{ lastDate: "YYYY-MM-DD", count: <number> }`
- Updated on quiz start (`initializeQuiz`) and on completion (`checkNaturalEnd`)
- Consecutive day logic: if `lastDate === yesterday` → increment; if `lastDate === today` → no change; else → reset to 1

### AI Explain
- 4 persona buttons (`.ai-persona-btn[data-persona]`) trigger `askAI(persona)` in `ai.js`
- Personas: `child` (simple), `deep` (expert), `first-principles` (fundamental truths), `socratic` (guiding questions)
- POSTs to `MISTRAL_PROXY_URL` (Cloudflare Worker) with question context, user's answer, and correctness
- Worker URL: `https://quiz-ai-proxy.hasit-p-bhatt.workers.dev/`
- Shows response in `#ai-response` div

### Sharing
- Share button (`#share-btn`) triggers `shareHandler()` in `sharing.js`
- Context-aware: shares certificate (completion screen), question (quiz active), or setup link (catalog)
- Uses `html2canvas` for PNG generation
- Achievement card template hidden off-screen at `#achievement-card-template`

### Error Handling
- Module load failures show error overlay (`#error-overlay`) with message and "Return to Menu" button
- Network fetch errors in preview show toast notification via `showNotify()`
- AI API failures gracefully fall back to "AI explainer is not available right now"

## Course ID Conventions

- IDs follow `{type}-{slug}` format (e.g., `book-git-basics`, `podcast-clean-code`, `coursera-machine-learning`)
- Type prefix is stripped from display via regex: `/^(book|podcast|coursera|course)-/i`
- Emoji prefix shown only when `activeTypeFilter === 'all'`:
  - `book-` → `📘`
  - `podcast-` → `🎙`
  - `coursera-` → `📚`
  - Fallback (unknown type) → `📖`
- Display name: kebab-case split → Title Case (e.g., `atomic-habits` → `Atomic Habits`)

## Styling Conventions

- **Tailwind CSS via CDN** (no build step) — utility classes in HTML
- **Custom CSS** (3 files): `styles-theme.css` (variables, reset, dark/light themes), `styles.css` (component styles, animations, cards), `styles-responsive.css` (mobile media queries)
- **Dark mode**: automatic via system preference; variables swap to dark palette
- **JavaScript** toggles classes: `hidden`, `correct`, `wrong`, `screen-enter`, `score-pop`
- **Mobile**: `@media (max-width: 640px)` overrides for truncation, dropdown height, z-index

## Running Locally

Serve `quiz/` with any static file server:

```bash
python -m http.server 8765 --directory quiz
```

Then open `http://localhost:8765`. No build step needed. The app loads course data from GitHub Raw URLs, so you need internet access.

## Testing

Playwright end-to-end tests live in `quiz/tests/`. Domain-split into spec files:

| Test | Command | Module(s) |
|------|---------|-----------|
| Setup | `npm run test:setup` | `main.js`, `state.js`, `notifications.js` |
| Catalog | `npm run test:catalog` | `catalog.js` |
| Preview | `npm run test:preview` | `preview.js` |
| Quiz | `npm run test:quiz` | `quiz.js`, `state.js` |
| URL Params | `npm run test:params` | `main.js` |
| UI/Sharing | `npm run test:ui` | `sharing.js` |
| AI | `npm run test:ai` | `ai.js` |
| Visual | `npm run test:visual` | visual-only |
| Unit | `npm run test:unit` | `state.js`, `catalog.js`, `sharing.js` |
| Schema | `npm run test:schema` | `courses/**/*.json`, `course-schema.json` |
| Affected | `node quiz/tests/affected-tests.mjs` | auto-detect via `git diff` |
| **All** | `npx playwright test` | full suite (desktop + mobile) |

First-time setup:

```bash
cd quiz/tests
npm install
npx playwright install chromium
```

The Playwright config (`playwright.config.mjs`) runs two projects in sequence (not parallel):
- **Desktop** (1280×800)
- **Mobile** (Pixel 5)

Both use a `webServer` that starts `python -m http.server 8765` on `../../quiz`.

Screenshots are captured after every test and saved to `quiz/tests/test-results/`.

The schema config (`schema.config.mjs`) runs only `schema.spec.mjs` with `fullyParallel: true` and 4 workers — no web server needed as it reads files directly.

> **Note**: All tests are Playwright-based. The modules are vanilla browser scripts (no `export`/`import`), so traditional Node.js unit tests aren't possible. `page.evaluate()`-based unit-style tests are used instead for isolated function testing.

### Affected Test Selection

Use `node quiz/tests/affected-tests.mjs` to automatically determine which tests to run based on `git diff`. The script maps changed file paths to relevant test specs:

```
courses/ → schema.spec.mjs
quiz/lib/main.js → setup.spec.mjs, url-params.spec.mjs
quiz/lib/quiz.js → quiz.spec.mjs, navigation.spec.mjs
...etc
```

## AI Explain Feature

The "Explain More with AI" button in the quiz calls a Mistral AI API via a Cloudflare Worker proxy.

### Setup

1. Edit `quiz/proxy/worker.js` and set your Mistral API key as `MISTRAL_API_KEY`
2. Deploy to Cloudflare Workers via `wrangler deploy`
3. Update the worker URL in `quiz/lib/ai.js` (the `MISTRAL_PROXY_URL` variable in `state.js`)

The worker proxy:
- Accepts POST requests with `{ model, messages }` payload
- Forwards to Mistral API
- Returns the model response

## CI Pipeline

GitHub Actions workflow (`.github/workflows/validate.yml`) runs on push/PR to `main` and daily scheduled:

1. **schema** job: `npm run test:schema` — validates all course files against JSON Schema
2. **validate-all** job: `node quiz/scripts/validate-all.js` — comprehensive check (chapter counts, metadata sync, positional refs)
3. **full-suite** job: Full Playwright test suite — runs on push to `main` or daily schedule; skips when only `courses/` or `*.md` files changed

Node.js version: 24. Cache: `npm` for `quiz/tests/package-lock.json`.

## Deployment

The quiz app is hosted at [quiz.hasit.in](https://quiz.hasit.in/). Content is served via GitHub Raw URLs (`https://raw.githubusercontent.com/hasitpbhatt/gitquiz/main/courses/...`), so course updates are live as soon as they're pushed to `main`.

To deploy the frontend:
1. Push changes to the `main` branch
2. If using Cloudflare Pages / GitHub Pages, the site redeploys automatically

## Features

- **Course catalog** with search, type filters (book/podcast/coursera), `<div>`-based custom list with SVG type icons per row, type-prefix-stripped display names, and new course indicator (NEW pill badge + unseen-first sort)
- **Preview screen** showing summary card (course description, progress, difficulty tally, time estimate), chapter grid, and first question preview
- **Quiz flow** with multiple-choice options, letter badges (A/B/C/D), difficulty-tagged questions, and score tracking
- **Keyboard shortcuts** (1–4 to select options, Enter to continue/start)
- **Screen transition animations** between setup → preview → quiz → completion screens (`fadeSlideIn`)
- **Daily streaks** — localStorage-backed streak count, updated on quiz start and completion
- **Share scorecards** — Web Share API with auto-generated PNG card via html2canvas (share certificate, share question, share portal link)
- **AI Explain** — Mistral API via Cloudflare Worker proxy for deeper explanations
- **URL-based deep linking** — `?course=`, `?q=`, `?c=` params for linking to specific courses, questions, and chapters
- **Custom URL input** — Load any quiz JSON from an arbitrary URL
- **Auto-start from URL** — `?course=` param bypasses the catalog and starts the quiz immediately
- **Scoring system** — base 100pts + streak bonus
- **Module chaining** — auto-detects and offers next module on completion
- **Error handling** — overlay on load failures, toast notifications for operational errors
- **Responsive design** — Mobile-first with Tailwind CSS, dark mode support, mobile overflow handling
- **Schema-validated course format** — 7-field question structure validated via CI
- **CI pipeline** — GitHub Actions with validate-all, schema, and full Playwright test suite
- **Affected test selection** — auto-detect relevant tests from changed files

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6), Tailwind CSS (CDN), html2canvas
- **Content**: JSON (served via GitHub Raw)
- **AI**: Mistral API via Cloudflare Workers
- **Testing**: Playwright (end-to-end + schema validation)
- **CI**: GitHub Actions (Node 24)
- **Hosting**: `quiz.hasit.in`

## Agent Development

This repository includes OpenCode AI agent configuration (`.opencode/` directory and `opencode.json`) with two specialized skills:

1. **hasits-plan**: Persists hierarchical plan trees to `.hasit/` so LLM context survives compaction during multi-step tasks
2. **syllabus-to-quiz**: Converts syllabus/transcript content into scenario-based quiz courses following the full workflow

The `AGENTS.md` file provides detailed development conventions for AI agents working on this codebase.
