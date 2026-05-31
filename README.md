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
│   └── proxy/                        # Cloudflare Worker for AI explanations
│       ├── worker.js                 # Mistral AI proxy
│       └── wrangler.toml             # CF Worker config
├── .opencode/
│   └── skill/book-to-quiz/SKILL.md   # Workflow for converting books to quizzes
├── opencode.json                     # OpenCode AI config (local, gitignored)
└── quick_audit.ps1                   # Audit script (local, gitignored)
```

## Course Format

Each course folder contains numbered chapter files (`001.json`, `002.json`, ...). Each file is a JSON array of question objects:

```json
[
  {
    "question": "Concept Title",
    "content": "Brief explanation of the concept.",
    "description": "Scenario-based question text.",
    "options": [
      "First answer option",
      "Second answer option",
      "Third answer option",
      "Fourth answer option"
    ],
    "answer": "Correct answer (matches one option exactly)",
    "explanation": "Why this answer is correct.",
    "difficulty": "easy | medium | hard"
  }
]
```

### Difficulty Distribution

Quizzes aim for ~40% easy, ~40% medium, ~20% hard across each course.

## Available Courses (17)

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

## Adding a New Course

1. Create a folder `courses/<course-name>/`
2. Add chapter files `001.json`, `002.json`, etc. using the format above
3. Add the folder name to `courses/courses_list.txt`
4. The frontend loads courses from GitHub Raw, so changes are live on next deploy

## Running Locally

Serve `quiz/` with any static file server. No build step needed.

## AI Explain Feature

The "AI Explain More" button in the quiz calls a Mistral AI API via a Cloudflare Worker proxy (`quiz/proxy/`). Deploy with `wrangler deploy`.

## Tech Stack

- **Frontend**: Vanilla JavaScript, Tailwind CSS (CDN), html2canvas
- **Content**: JSON (served via GitHub Raw)
- **AI**: Mistral API via Cloudflare Workers
- **Hosting**: `quiz.hasit.in`
