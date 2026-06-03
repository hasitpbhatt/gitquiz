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

Each question has **exactly 7 fields**:

| Field | Type | Description |
|-------|------|-------------|
| `question` | `string` | Short concept name |
| `content` | `string` | 1-2 sentence concept definition |
| `description` | `string` | Real-world scenario ending with `?` |
| `options` | `string[]` | Exactly 4 plausible answers, no positional refs |
| `answer` | `string` | Matches one option character-for-character |
| `explanation` | `string` | Teaching explanation |
| `difficulty` | `string` | `"easy"`, `"medium"`, or `"hard"` |

**Constraints**: All 7 fields required. Answer must match one option exactly (copy-paste to avoid mismatches). 4 options only. No positional references (`"Both A and B"`, `"All of the above"`). Difficulty lowercase only.

### 5a. Difficulty Distribution
- Easy (30-40%): Straightforward recall
- Medium (35-45%): Apply to unfamiliar scenario, all options plausible
- Hard (15-25%): Synthesize multiple concepts, catch subtleties

Hard techniques: trapdoor option, reverse application, boundary case, competing principles, option symmetry.

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
