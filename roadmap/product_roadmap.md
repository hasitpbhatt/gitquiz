# Quiz Portal — Feature Roadmap

Prioritized by user impact.  

**Complexity:** ⚡ Quick Win (days) · 🔷 Medium Effort (1-2 weeks) · 🏗️ Major Project (multi-week)

## Tier 1 — Core Experience

- [ ] 🔷 **Progress persistence (localStorage)** — Save quiz progress across sessions. Close tab, resume where you left off.
- [ ] ⚡ **Resume from last uncompleted chapter** — Auto-detect last position instead of always starting at chapter 001.
- [ ] ⚡ **Hide completed toggle** — Toggle to filter out fully completed courses from the catalog; when active, auto-scroll to the first incomplete course/module.
- [ ] 🔷 **Wrong-answer review deck** — Revisit missed questions after completing a module.
- [ ] 🔷 **Concept tags & content graph** — Add optional `tags` field (string array) to question JSON schema. Build a cross-course Concept Browser view in the catalog. Show "Related Questions" from other courses at the bottom of each question. Enables organic course discovery across 28 courses.

## Tier 2 — Engagement & Retention

- [ ] 🏗️ **Spaced repetition engine (SM-2)** — Implement SM-2 algorithm in localStorage. After each question, store ease factor, interval, and next review date. Show a "Due for Review" section at the top of the catalog. Convert streak from flat login counter to retention score (e.g., "87% retention over 12 days").
- [ ] 🔷 **Explore Mode / AI Explain as primary** — Auto-show explanation panel after each answer instead of hiding behind a click. Add "Explore Mode" toggle (soft correct/incorrect, no score/streak pressure, AI Explain shown by default). Surface 4 personas prominently.
- [ ] 🔷 **Difficulty-aware adaptation** — `difficulty` field exists per question but is unused. Adapt based on performance.

## Tier 3 — UX Polish

- [x] ⚡ **Dark mode toggle** — Manual sun/moon toggle (persisted in localStorage) overrides system preference.
- [ ] 🔷 **Hints system** — Progressive hints before revealing the answer.
- [ ] 🔷 **Offline caching** — Service worker for catalog + recently loaded modules.
- [ ] ⚡ **Completion screen as reflection moment** — Replace score + timer with learning signals: "3 concepts to review tomorrow," learning velocity (net-new concepts/session), related course suggestion, personal insight journal prompt. The completion moment is the highest-intent moment — don't waste it on a transaction receipt.

## Tier 4 — Growth / Social

- [ ] 🏗️ **Leaderboards per course** — Friendly competition among users.
- [ ] 🔷 **Shareable scorecards** — Public link to a score page (beyond the PNG card).
- [ ] ⚡ **Course recommendations** — "Finished X? Try Y."
- [ ] 🔷 **Contribution pipeline** — "Contribute a Question" button in footer opens pre-populated GitHub issue template. "Community Courses" tab showing forked repos (via GitHub API). "By [author]" attribution on each course linking to contributor's GitHub profile. Turns Git-based CMS into a social co-creation feature.

## Tier 5 — Content Authoring

- [ ] 🏗️ **Multi-answer / checkbox questions** — Currently single-select only.
- [ ] 🔷 **Note-taking on questions** — Annotate explanations for personal reference.
- [ ] 🔷 **Flashcard mode** — Toggle between quiz and browse/review.
