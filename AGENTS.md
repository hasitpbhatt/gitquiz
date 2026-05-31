# gitquiz — Agent Instructions

See README.md for repo structure, course catalog, and quiz JSON format.
See `.opencode/skill/syllabus-to-quiz/SKILL.md` for quiz creation workflow, field reference, constraints, and technical notes.

## Rules

- **Skills first**: Use `syllabus-to-quiz` for all course content work. Never create/modify quiz JSON outside it.
- **5+ chapters**: Write a `gen_course.js` at root, delete after use. Avoid PowerShell for JSON generation.
- **Single-file edits**: Validate each file before moving to the next. No batch edits across chapters.
- **All paths relative to project root** unless stated otherwise.
- **Run full test suite before commit**: When modifying `quiz/` or `quiz/tests/`, run `npx playwright test` and confirm all pass.
- **Catalog test conventions**:
  - `CATALOG_CONTENT` = `\n`-joined array of course IDs
  - Use `toHaveAttribute('value', …)` for `<option>` elements, not `toHaveValue()`
  - Type filter buttons use `data-type` attribute (e.g., `.type-filter-btn[data-type="book"]`)
