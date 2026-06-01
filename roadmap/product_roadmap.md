# Quiz Portal — Feature Roadmap

Prioritized by user impact.

## Tier 1 — Core Experience

- [ ] **Progress persistence (localStorage)** — Save quiz progress across sessions. Close tab, resume where you left off.
- [ ] **Course curriculum view** — Show chapter list before starting. Let users jump to any chapter.
- [ ] **Resume from last uncompleted chapter** — Auto-detect last position instead of always starting at chapter 001.
- [ ] **Wrong-answer review deck** — Revisit missed questions after completing a module.

## Tier 2 — Engagement & Retention

- [ ] **Daily streaks** — "Study streak: 5 days" to drive habit formation.
- [ ] **Spaced repetition review** — Schedule re-quizzes of past mistakes (SM-2 / Leitner).
- [ ] **Difficulty-aware adaptation** — `difficulty` field exists per question but is unused. Adapt based on performance.

## Tier 3 — UX Polish

- [ ] **Keyboard shortcuts** (1–4 to select, Enter to continue).
- [ ] **Screen transition animations** — Setup → Preview → Quiz feels abrupt.
- [ ] **Hints system** — Progressive hints before revealing the answer.
- [ ] **Offline caching** — Service worker for catalog + recently loaded modules.

## Tier 4 — Growth / Social

- [ ] **Leaderboards per course** — Friendly competition among users.
- [ ] **Shareable scorecards** — Public link to a score page (beyond the PNG card).
- [ ] **Course recommendations** — "Finished X? Try Y."

## Tier 5 — Content Authoring

- [ ] **Multi-answer / checkbox questions** — Currently single-select only.
- [ ] **Note-taking on questions** — Annotate explanations for personal reference.
- [ ] **Flashcard mode** — Toggle between quiz and browse/review.
