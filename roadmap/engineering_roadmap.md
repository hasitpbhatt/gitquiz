# Quiz Portal — Engineering Roadmap

Prioritized by risk reduction and developer impact.  

**Complexity:** ⚡ Quick Win (days) · 🔷 Medium Effort (1-2 weeks) · 🏗️ Major Project (multi-week)

## Tier 1 — Architecture & Reliability

- [ ] 🏗️ **ES modules / build step** — All globals, no imports, tight coupling via `state.js`. Script load order is fragile.
- [ ] 🏗️ **TypeScript migration** — `@ts-check` on vanilla JS catches little. Every refactor risks runtime errors.
- [ ] 🔷 **Error boundary + global handler** — One uncaught exception in quiz.js and the entire app hangs. No fallback UI.
- [ ] 🔷 **Offline service worker** — Raw GitHub fetches fail without network. `/courses/*.json` should be cache-first.
- [ ] ⚡ **CDN fallback** — html2canvas or Tailwind CDN goes down → app breaks. Need fallback or self-host.
- [ ] 🔷 **Centralize duplicated domain logic** — `formatCourseName` duplicated 4 ways (`quiz.js`, `preview.js`, `catalog.js`, `test-helpers.mjs`), URL normalization (2 copies), scoring constants `100`/`50`/`5`/`20` (2 copies), `escapeHtml` (2 implementations with different escaping behavior). Each duplication is a drift surface where changes silently diverge.

## Tier 2 — Developer Experience & CI

- [ ] 🔷 **Linting + formatting** (ESLint + Prettier) — No code standards enforced across contributions.
- [ ] 🔷 **Local dev server with live reload** — Python `http.server` works but no HMR, no watch mode.
- [ ] ⚡ **Pre-commit hooks** — Commits can ship without tests, lint, or validation.
- [ ] 🔷 **Eliminate test-helpers.mjs duplication** — 7+ production functions (`escapeHtml`, `shuffleArray`, `filterCatalogItems`, `formatCourseName`, `buildCatalogOptions`, `getShareUrl`, `calculateScore`, `calculateNewStreak`, `getTodayStr`) are duplicated in `test-helpers.mjs` because lib/ uses globals instead of exports. Refactor lib/ to export pure functions so tests can import them directly, removing the parallel-codebase maintenance burden.
- [ ] 🔷 **Faster CI (caching + parallelization)** — Schema tests run serially across 4 workers; 21 courses × AJV validations could cache.
- [ ] ⚡ **Unify test runner** — `npm run test:*` scripts are useful but no single `npm test` entry point.

## Tier 3 — Performance & Bundle Size

- [ ] 🏗️ **Remove Tailwind CDN, generate at build** — ~300KB shipped on every request for a few utility classes.
- [ ] ⚡ **Lazy-load html2canvas** — Imported on every page load but only used for sharing/download.
- [ ] ⚡ **Preconnect / prefetch catalog** — Course data fetches could be speculatively loaded.
- [ ] 🔷 **Image optimization** — No favicon, no OG images, no social preview cards.

## Tier 4 — Observability & Security

- [ ] 🔷 **Analytics (privacy-first, e.g., Plausible)** — Zero insight into usage, completion rates, popular courses.
- [ ] 🔷 **Error tracking (e.g., Sentry)** — No visibility into failures in production.
- [ ] ⚡ **CSP headers** — No Content-Security-Policy. CDN-loaded scripts are unvalidated.
- [ ] 🔷 **Audit XSS surfaces** — `sharing.js` concatenates HTML strings with `escapeHtml` calls — easy to miss one.

## Tier 5 — Platform Extensibility

- [ ] 🏗️ **Plugin / middleware for question types** — Adding multi-select or fill-in-the-blank requires rewriting core quiz.js logic.
- [ ] 🔷 **Course metadata API endpoint** — Frontend fetches `courses_list.txt` directly — fragile, no versioning.
- [ ] 🏗️ **Webhook on completion** — Could trigger notifications, email summaries, or spaced-rep scheduling.
- [ ] 🔷 **SM-2 algorithm module** — Implement SuperMemo SM-2 as a pure JS module. Store ease factor, interval, next review date per question in localStorage alongside existing progress data. Expose `getDueReviews()`, `processAnswer(questionId, quality)`, `getRetentionScore()`. All 5 design critiques identified this as the single highest-impact change for retention.
- [ ] 🔷 **Concept tags JSON schema extension** — Add optional `tags` field (array of strings) to `course-schema.json`. Update `validate-all.js` to accept `tags` as valid extra field. No breaking changes — existing courses without tags continue to validate.

## Tier 6 — UX & Feature Improvements

- [x] 🔷 **Preview summary card** — Replace question preview (readonly description + static options) with a course-level summary card. Shows: course title + description + source, progress bar (X/Y chapters), resume chapter info, difficulty tally (easy/medium/hard counts from loaded module), estimated time (length × 45s), and optional chapter description if `courses-meta.json` gains a `chapterDescriptions` field. Applies to both catalog→preview and direct-link flows. Subtasks:
  - Add `#preview-summary` DOM section to `index.html` (progress bar, difficulty mix, time estimate, chapter description placeholder)
  - Implement `showSummaryCard()` in `preview.js` to populate from `coursesMeta` + `previewData`, hide question-specific elements (`#preview-description-text`, `#preview-options-bin`)
  - Optionally extend `courses-meta.json` schema with `chapterDescriptions` map
  - Update `preview.spec.mjs` to test summary card elements instead of question content
- [ ] ⚡ **Remove speed bonus from scoring** — `score += 100 + max(0, 50 - timeSpent * 5) + (streak > 2 ? 20 : 0)` penalizes thoughtful reading. The speed bonus (50 points decaying over 10s) is the single biggest "this is a chore" driver. Score should reflect correctness and streaks only. Timer can still display for awareness but decoupled from points.
- [ ] 🔷 **Show first question on preview screen instead of metadata wall** — Currently the preview screen shows a summary card (difficulty, time estimate, progress) with zero actual quiz content. The user commits 3 clicks before seeing a single question. Restructure preview to show the first question prominently, with the summary card and chapter grid below it. This reduces the browsing cost from "read metadata → decide → click" to "read content → decide."
- [ ] ⚡ **Show concept name upfront** — `topic-title` and `content-box` are currently hidden until after answering (`quiz.js` lines 217-218). This "active recall by hiding the topic" feels like a gotcha, not a learning moment. Move visibility to before answering so the user sees "Opportunity Cost" → reads the scenario → answers. Changes the emotional tone from "guess what I'm asking" to "let me test my understanding."
- [ ] ⚡ **Add per-question skip** — Currently only "Skip Module" exists (loses all progress after a confirm dialog). A per-question skip button that moves to the next question (with an optional flag-to-review-later) removes the frustration of being stuck on a single question.
- [ ] ⚡ **Eliminate completion-screen loading state** — `quiz.js:291` shows a spinner with "Scanning for following modules..." while fetching the next chapter URL. Pre-fetch the next chapter URL before the last question renders, or defer the check to happen during the celebration animation. The user should see the trophy and score immediately without a loading spinner.
- [ ] ⚡ **Single-click course start** — Remove the "Open Vault" button. Clicking a course item should go directly to its preview screen. Saves one click and one decision point in the browse → quiz flow.
- [ ] ⚡ **Simplify catalog filters** — 4 type filter buttons (All/Books/Podcasts/Courses) + Hide Completed toggle + Search is a lot of chrome for a single-purpose app. Consider consolidating to search + a single "show completed" toggle, or replacing the button row with a dropdown.
