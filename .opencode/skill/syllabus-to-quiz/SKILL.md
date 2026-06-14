---
name: syllabus-to-quiz
description: Converts syllabus, transcript, or summary content into scenario-based quiz courses for the gitquiz system. Use when creating interactive learning materials from structured source material.
---

# Syllabus to Quiz Skill

## Workflow

### 1. Concept Inventory
- Get full TOC from official sources
- List key principles, models, case studies, frameworks per chapter
- Capture sub-topics: notable quotes, aphorisms, movements, paradigm shifts, counter-ideologies
- Every concept and sub-topic gets at least one question
- Group into logical chapters; don't sacrifice coverage for chapter count

### 2. Audit Before Creating
- **Rewrite**: Build concept inventory from source TOC (skip re-reading old files unless salvaging scenarios)
- **Enrichment**: Read existing files, map against TOC, identify gaps
- Fit missing concepts into cohesive existing chapters, else create new files
- Max 12 questions per chapter

### 3. Present Plan for Approval
- Proposed chapter structure with concepts per chapter
- Scenario approach, file list (001-00N), target 7-12 questions/chapter
- Wait for approval

### 4. Create Directory
```bash
mkdir -p courses/course-identifier/
```

### 5. Create Chapter JSON Files

Each question has **7 required fields** + 1 optional field:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `question` | `string` | Yes | Short concept name |
| `content` | `string` | Yes | 1-2 sentence concept definition. Should naturally embed `answer` as a key term when possible for cloze support. |
| `description` | `string` | Yes | Real-world scenario ending with `?` |
| `options` | `string[]` | Yes | Exactly 4 plausible answers. See word-count rule below. |
| `answer` | `string` | Yes | Matches one option character-for-character |
| `explanation` | `string` | Yes | Teaching explanation |
| `difficulty` | `string` | Yes | `"easy"`, `"medium"`, or `"hard"` |
| `blank` | `string` | No | Cloze passage containing `answer` verbatim, for fill-in-the-blank mode |

**Constraints**: All 7 required fields must be present. Answer must match one option exactly (copy-paste to avoid mismatches). 4 options only. No positional references (`"Both A and B"`, `"All of the above"`). Difficulty lowercase only.

**Answer word-count balance (STRICT)**:
- All 4 options must be within **±30% of the mean word count** of those 4 options
- Example: if word counts are [8, 6, 9, 7], mean = 7.5, acceptable range = 5.25–9.75
- **No mechanical padding**: The suffix `"which is a critical factor to consider in this context"` is **banned** — it appears on 1,431 options in the existing corpus and is a known detection signal. Padding must be context-appropriate expansions written specifically for each option, not a copy-paste template.
- Run `node quiz/scripts/answer-length-audit.js` to verify compliance

### 5a. Difficulty Distribution
- Easy (30-40%): Straightforward recall
- Medium (35-45%): Apply to unfamiliar scenario, all options plausible
- Hard (15-25%): Synthesize multiple concepts, catch subtleties

Hard techniques: trapdoor option, reverse application, boundary case, competing principles, option symmetry.

### 5b. `blank` Field (Fill-in-the-Blank Cloze)

When writing the optional `blank` field, follow these principles:

- **Natural embedding**: The answer should appear within a natural sentence, not at the end with a forced lead-in like "This concept is called X"
- **Definition style**: `blank` should read like a dictionary or textbook definition that happens to contain the term
- **One passage**: A single sentence or two. Don't write a paragraph.
- **Fallback**: If `blank` is absent, fill-blank mode tries `content`, then `description`, then falls back to "What term completes this definition?"

**Example — good `blank`:**
```json
{
  "question": "Opportunity Cost",
  "answer": "Opportunity Cost",
  "blank": "The value of the next best alternative forgone when making a decision is called Opportunity Cost.",
  "content": "Every choice involves trade-offs; the next best thing you give up is the true cost of your decision.",
  "description": "You choose to spend \$500 on a concert ticket rather than investing it..."
}
```

Keep `content` as the brief concept explanation, and use `blank` only when you want a dedicated cloze passage. Most questions don't need it — prioritize questions where `answer` is a key term that doesn't naturally appear in `content`.

### 5c. T/F Mode — Chapter-Level Concept Design

True/False mode tests concept recognition by presenting a scenario and asking "Does this illustrate [concept]?" For wrong-concept labels, it picks from the `question` fields of other questions in the same chapter. For this to work well:

- **Concept proximity**: Questions within a chapter should cover related but distinct concepts that a learner could plausibly confuse
- **Wrong labels are automatic**: You don't need to write `falseLabels` — the engine picks a random `question` from the same chapter as the wrong label
- **Single-question chapters**: T/F mode falls through to MCQ for chapters with only 1 question (no wrong label available)

If all concepts in a chapter are too distinct (painfully obvious when mismatched), add a broader `description` that makes the wrong concept at least superficially plausible.

### 6. Update Courses List & Metadata
Add to `courses/courses_list.txt` alphabetically, kebab-case, one per line.
Add a corresponding entry to `courses/courses-meta.json` with `title`, `type`, `chapters`, `source`, `description`. The entry keys must match `courses_list.txt` exactly.
When using `generate-course.mjs`, both files are updated automatically.

### 7. Scenario Diversity
Vary across professional, personal, creative, social, philosophical domains.
- **Natural fit**: ~25-30% benefit from diversification; don't force it
- **Two-pass**: Write all first, then read descriptions for domain clustering, diversify if 3+ consecutive in same domain

### 8. Quality Check
- Run `npm run test:schema` from `quiz/tests/` (validates against `courses/course-schema.json` + content drift + cross-field checks)
- Run `node quiz/scripts/validate-all.js` from root (comprehensive: chapter counts, metadata sync, directory structure)
- All 7 fields present, answer matches option, no positional refs
- Valid JSON, 7-12 questions per file, 001.json format
- Difficulty mix per chapter (30-40% E, 35-45% M, 15-25% H)
- No review-only chapter (≥65% repetition → delete; 35-64% → consolidate)
- No concept across 3+ chapters
- Diversity audit: ≤50% in one domain

## Reusable Scripts

General-purpose scripts are in `quiz/scripts/`. Run with `node quiz/scripts/<script>.js` or `node quiz/scripts/<script>.mjs` from the gitquiz root.

| Script | Purpose |
|--------|---------|
| `validate.js` | Validate a single course — arg: `<course-dir>` (default: `courses/course-identifier`) |
| `validate-all.js` | Validate every course (superseded by `npm run test:schema`) |
| `difficulty-tally.js` | Auto-tally difficulty distribution across all courses (reads `difficulty` field) |
| `difficulty-audit.js` | Print all questions with E/M/H blank brackets for labeling — arg: `<course-dir>` (default: `courses/course-identifier`) |
| `coverage-check.js` | Verify concept inventory coverage — edit `inventory` array; arg: `<course-dir>` (default: `courses/course-identifier`) |
| `cross-chapter-repetition.js` | Detect concepts appearing in 3+ chapters — edit `conceptGroups`; arg: `<course-dir>` (default: `courses/course-identifier`) |
| `answer-length-audit.js` | **Bias report**: flags questions where the answer is egregiously longer than the other options. Run `node quiz/scripts/answer-length-audit.js` to get per-course and per-question breakdown. |
| `assemble-course.mjs` | **Assembly helper**: `node quiz/scripts/assemble-course.mjs <course-id>` — reads `ch-*.json` files from `courses/<id>/` and outputs `input.json` for the generator. |
| `generate-course.mjs` | **CLI generator**: `node quiz/scripts/generate-course.mjs input.json` — reads a single JSON input and produces properly split `001.json`–`00N.json` files, validates, creates dirs, updates `courses_list.txt` and `courses-meta.json` (including `chapters` count). Supports `--dry-run`. |

## Technical Notes
- **BOM issue (critical)**: PowerShell `Set-Content -Encoding UTF8` prepends BOM → breaks JSON. Always use `fs.writeFileSync(path, JSON.stringify(data), 'utf8')`.
- **Windows tooling**: Use `Select-String` instead of `rg`, here-strings instead of heredocs, temp `.js` files instead of inline `node -e` for complex JS.
- **Answer matching**: Most common error — option text and answer text don't match (synonyms, punctuation, capitalization, whitespace). Copy-paste.

## Example Flow
1. User provides source material → build concept inventory, group into chapters, present plan
2. After approval: `mkdir -p courses/book-title/`, create 001-00N.json files
3. Add to `courses_list.txt` alphabetically, add entry to `courses-meta.json` with `title`, `type`, `chapters`, `source`, `description`
4. Run `npm run test:schema` from `quiz/tests/` and `node quiz/scripts/validate-all.js` from root, fix issues, commit
