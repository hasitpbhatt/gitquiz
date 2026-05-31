# LearnLeap (gitquiz)

Interactive quiz platform for reviewing books, podcasts, and courses through active recall. Live at [quiz.hasit.in](https://quiz.hasit.in/).

## Repository Structure

```
├── courses/                          # Quiz content (JSON)
│   ├── courses_list.txt              # Catalog of all course folders
│   ├── book-<title>/                 # One folder per book/course
│   │   ├── 001.json                  # Chapter 1 questions
│   │   ├── 002.json                  # Chapter 2 questions
│   │   └── ...
│   ├── podcast-<title>/...
│   └── coursera-<title>/...
├── quiz/                             # Frontend application
│   ├── index.html                    # Single-page quiz app (vanilla JS + Tailwind)
│   ├── script.js                     # All quiz logic (707 lines)
│   ├── styles.css                    # Custom styling
│   ├── tests/                        # Playwright end-to-end tests
│   │   ├── visual.spec.mjs           # Visual and behavior tests
│   │   └── playwright.config.mjs     # Playwright config (screenshots on)
│   └── proxy/                        # Cloudflare Worker for AI explanations
│       ├── worker.js                 # Mistral AI proxy
│       └── wrangler.toml             # CF Worker config
├── .opencode/
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
| podcast-naval-nothing-ever-happens-is-over | 14 | Naval Podcast |
| podcast-regulatory-frontier | 1 | Naval Podcast (Blake Scholl) |
| podcast-vibe-coding-hardware | 2 | Naval Podcast |
| podcast-waste-tokens-save-time | 1 | Naval Podcast (Guillermo Rauch) |

## Adding a New Course

1. Create a folder `courses/<course-name>/`
2. Add chapter files `001.json`, `002.json`, etc. using the format above
3. Add the folder name to `courses/courses_list.txt`
4. The frontend loads courses from GitHub Raw, so changes are live on next deploy

## Running Locally

Serve `quiz/` with any static file server. No build step needed.

## Testing

Playwright end-to-end tests live in `quiz/tests/`.

```bash
cd quiz/tests
npm install
npx playwright test
```

Screenshots are captured after every test and saved to `quiz/tests/test-results/`. To run a specific test file:

```bash
npx playwright test visual.spec.mjs
```

## AI Explain Feature

The "AI Explain More" button in the quiz calls a Mistral AI API via a Cloudflare Worker proxy (`quiz/proxy/`). Deploy with `wrangler deploy`.

## Tech Stack

- **Frontend**: Vanilla JavaScript, Tailwind CSS (CDN), html2canvas
- **Content**: JSON (served via GitHub Raw)
- **AI**: Mistral API via Cloudflare Workers
- **Hosting**: `quiz.hasit.in`
