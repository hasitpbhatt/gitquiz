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
- [ ] ⚡ **Fix pre-commit hook for Windows + align with CI** — `.githooks/pre-commit` uses `#!/bin/sh` + `grep` (fails silently on Windows PowerShell) and runs `schema.spec.mjs` (Playwright) while CI runs `schema-valid.test.mjs` (node:test). Developers get divergent validation signals between local and CI.
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
- [ ] ⚡ **Fix innerHTML injection of `nextUrl` in quiz completion** — `quiz.js:272` interpolates a user-supplied URL into `<button onclick="initializeQuiz('...')">`. A crafted URL with `'` breaks the string boundary, enabling arbitrary JS execution. Replace with `document.createElement` + `addEventListener`.

## Tier 5 — Platform Extensibility

- [ ] 🏗️ **Plugin / middleware for question types** — Adding multi-select or fill-in-the-blank requires rewriting core quiz.js logic.
- [ ] 🔷 **Course metadata API endpoint** — Frontend fetches `courses_list.txt` directly — fragile, no versioning.
- [ ] 🏗️ **Webhook on completion** — Could trigger notifications, email summaries, or spaced-rep scheduling.
