# LearnLeap (gitquiz)

Interactive quiz platform for reviewing books, podcasts, and courses through active recall. Live at [quiz.hasit.in](https://quiz.hasit.in/).

## Repository Structure

```
├── courses/                          # Quiz content (JSON)
│   ├── courses_list.txt              # Catalog of all course folders (IDs only)
│   ├── courses-meta.json             # Course metadata (title, type, chapters, source, description)
│   ├── book-<title>/                 # One folder per book/course
│   │   ├── 001.json                  # Chapter 1 questions
│   │   ├── 002.json                  # Chapter 2 questions
│   │   └── ...
│   ├── podcast-<title>/...
│   └── coursera-<title>/...
├── quiz/                             # Frontend application
│   ├── index.html                    # Single-page quiz app (vanilla JS + Tailwind)
│   ├── lib/                          # Modular JS (state, catalog, preview, quiz, etc.)
│   ├── styles.css                    # Custom styling
│   ├── tests/                        # Playwright tests + schema validation
│   │   ├── *.spec.mjs                # Domain-split test files (10 specs)
│   │   ├── test-utils.mjs            # Shared mock data & route setup
│   │   ├── affected-tests.mjs        # Git-diff-based test selector
│   │   ├── schema.config.mjs         # Lightweight config for schema tests
│   │   └── playwright.config.mjs     # Main Playwright config
│   └── proxy/                        # Cloudflare Worker for AI explanations
    │       └── worker.js                 # Mistral AI proxy
├── .opencode/
│   ├── skill/hasits-plan/SKILL.md        # Plan persistence for LLM context survival
│   └── skill/syllabus-to-quiz/SKILL.md   # Workflow for converting courses to quizzes
├── opencode.json                     # OpenCode AI config

```

## Course Format

Each course folder contains numbered chapter files (`001.json`, `002.json`, ...). Each file is a JSON array of question objects with **exactly 7 fields**:

### Field Reference

| Field | Type | Description |
|-------|------|-------------|
| `question` | `string` | Short concept name (e.g., "Opportunity Cost") |
| `content` | `string` | Brief 1-2 sentence explanation of the concept |
| `description` | `string` | Real-world scenario ending with a question (e.g., "This illustrates:") |
| `options` | `string[]` | Array of **exactly 4** plausible answer strings. Must not reference other options by position (no "Both B and C", "All of the above"). |
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

### Difficulty Distribution

Quizzes aim for ~40% easy, ~40% medium, ~20% hard across each course.

## Available Courses

| Course | Chapters | Source |
|--------|----------|--------|
| book-algorithms-to-live-by | 7 | Algorithms to Live By |
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
| book-the-psychology-of-money | 20 | The Psychology of Money |
| book-the-startup-of-you | 9 | The Startup of You |
| coursera-financial-markets-global | 12 | Coursera: Financial Markets |
| coursera-genai-for-algorithmic-trading | 11 | Coursera: GenAI for Algorithmic Trading |
| podcast-age-of-async-agents | 8 | Latent Space Podcast |
| podcast-nothing-ever-happens-is-over | 14 | Naval Podcast |
| podcast-regulatory-frontier | 1 | Naval Podcast (Blake Scholl) |
| podcast-vibe-coding-hardware | 2 | Naval Podcast |
| podcast-waste-tokens-save-time | 1 | Naval Podcast (Guillermo Rauch) |

## Adding a New Course

1. Create a folder `courses/<course-name>/`
2. Add chapter files `001.json`, `002.json`, etc. using the format above
3. Add the folder name to `courses/courses_list.txt`
4. The frontend loads courses from GitHub Raw, so changes are live on next deploy

## Metadata

Each course has a metadata entry in `courses/courses-meta.json`:

| Field | Type | Description |
|-------|------|-------------|
| `title` | `string` | Human-readable course name |
| `type` | `string` | `"book"`, `"podcast"`, or `"coursera"` |
| `chapters` | `number` | Number of chapter JSON files |
| `source` | `string\|null` | URL to original content (podcasts) or `null` |
| `description` | `string` | One-line summary with host/author and topic |

Keys in `courses-meta.json` must match `courses_list.txt` exactly. This is validated by `npm run test:schema` and `node quiz/scripts/validate-all.js`.

## Running Locally

Serve `quiz/` with any static file server. No build step needed.

## Testing

Playwright end-to-end tests live in `quiz/tests/`. Tests are domain-split into spec files:

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
| Unit | `npm run test:unit` | `state.js`, `catalog.js`, `sharing.js` (isolated functions) |
| Affected | `npm run test:affected` | (auto-detect via `git diff`) |
| **All** | `npx playwright test` | — |

First-time setup:

```bash
cd quiz/tests
npm install
npx playwright install chromium
```

Screenshots are captured after every test and saved to `quiz/tests/test-results/`.

> **Note**: All tests are Playwright-based. The modules are vanilla browser scripts (no `export`/`import`), so traditional Node.js unit tests aren't possible without refactoring. `page.evaluate()`-based unit-style tests are used instead to test individual functions in isolation.

## AI Explain Feature

The "AI Explain More" button in the quiz calls a Mistral AI API via a Cloudflare Worker proxy (`quiz/proxy/worker.js`).

### Setup

1. Edit `quiz/proxy/worker.js` and set your Mistral API key as `MISTRAL_API_KEY`
2. Deploy to Cloudflare Workers via `wrangler deploy`
3. Update the worker URL in `quiz/lib/ai.js`

## Deployment

The quiz app is hosted at [quiz.hasit.in](https://quiz.hasit.in/). Content is served via GitHub Raw URLs, so course updates are live as soon as they're pushed to `main`.

To deploy the frontend:
1. Push changes to the `main` branch
2. If using Cloudflare Pages / GitHub Pages, the site redeploys automatically

## Features

- **Course catalog** with search, type filters (book/podcast/coursera), and type-prefix-stripped display names
- **Preview screen** showing course description, chapter list, and start button
- **Quiz flow** with multiple-choice options, letter badges, difficulty-tagged questions, and score tracking
- **Keyboard shortcuts** (1–4 to select options, Enter to continue/start)
- **Screen transition animations** between setup → preview → quiz → completion screens
- **Daily streaks** — localStorage-backed streak count displayed on the setup screen, updated on quiz start and completion
- **Share scorecards** — Web Share API with auto-generated PNG card via html2canvas
- **AI Explain** — Mistral API via Cloudflare Worker proxy for question explanations
- **URL-based sharing** — `?course=`, `?q=`, `?c=` params for deep-linking to specific courses, questions, and chapters
- **Custom URL input** — Load any quiz JSON from an arbitrary URL
- **Auto-start from URL** — `?course=` param bypasses the catalog and starts the quiz immediately
- **Responsive design** — Mobile-first with Tailwind CSS, dark mode support, mobile overflow handling
- **Schema-validated course format** — 7-field question structure validated via CI
- **CI pipeline** — GitHub Actions with validate-all, schema, and full Playwright test suite

## Tech Stack

- **Frontend**: Vanilla JavaScript, Tailwind CSS (CDN), html2canvas
- **Content**: JSON (served via GitHub Raw)
- **AI**: Mistral API via Cloudflare Workers
- **Hosting**: `quiz.hasit.in`
