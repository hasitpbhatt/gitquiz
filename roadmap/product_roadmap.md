# Quiz Portal — Feature Roadmap

Prioritized by user impact.  

**Complexity:** ⚡ Quick Win (days) · 🔷 Medium Effort (1-2 weeks) · 🏗️ Major Project (multi-week)

## Tier 1 — Core Experience

- [ ] 🔷 **Progress persistence (localStorage)** — Save quiz progress across sessions. Close tab, resume where you left off.
- [x] ⚡ **Course curriculum view** — Show chapter list before starting. Let users jump to any chapter.
- [ ] ⚡ **Resume from last uncompleted chapter** — Auto-detect last position instead of always starting at chapter 001.
- [ ] ⚡ **Hide completed toggle** — Toggle to filter out fully completed courses from the catalog; when active, auto-scroll to the first incomplete course/module.
- [ ] 🔷 **Wrong-answer review deck** — Revisit missed questions after completing a module.

## Tier 2 — Engagement & Retention

- [x] ⚡ **New course indicator** — Show a "🆕 New" badge on courses added since the user's last visit (tracked via localStorage). Sort new courses to the top of the catalog for priority discovery.
- [ ] 🏗️ **Spaced repetition review** — Schedule re-quizzes of past mistakes (SM-2 / Leitner).
- [ ] 🔷 **Difficulty-aware adaptation** — `difficulty` field exists per question but is unused. Adapt based on performance.

## Tier 3 — UX Polish

- [x] ⚡ **Dark mode toggle** — Manual sun/moon toggle (persisted in localStorage) overrides system preference.
- [ ] 🔷 **Hints system** — Progressive hints before revealing the answer.
- [ ] 🔷 **Offline caching** — Service worker for catalog + recently loaded modules.

## Tier 4 — Growth / Social

- [ ] 🏗️ **Leaderboards per course** — Friendly competition among users.
- [ ] 🔷 **Shareable scorecards** — Public link to a score page (beyond the PNG card).
- [ ] ⚡ **Course recommendations** — "Finished X? Try Y."

## Tier 5 — Content Authoring

- [ ] 🏗️ **Multi-answer / checkbox questions** — Currently single-select only.
- [ ] 🔷 **Note-taking on questions** — Annotate explanations for personal reference.
- [ ] 🔷 **Flashcard mode** — Toggle between quiz and browse/review.
