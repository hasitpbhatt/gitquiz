---
name: book-to-quiz
description: Converts books or summaries into scenario-based quiz courses for the gitquiz system. Use when creating interactive learning materials from book content.
---

# Book to Quiz Skill

This skill helps you convert a book or its summary into a scenario-based quiz course for the gitquiz system, following the established format and conventions.

## Continuous Improvement

This skill improves with every use. After completing a task using this skill, update it with any new learnings:
- Add new scripts or patterns that emerged during the work
- Document edge cases, bugs, or pitfalls you encountered
- Refine thresholds, workflows, or heuristics that proved inaccurate
- Add new scenario domains, techniques, or fixes uncovered

Keep the skill as a living document — each run should leave it more capable than before.

## When to Use

Use this skill when you:
- Have a book (or detailed summary) you want to convert to an interactive quiz
- Want to create chapter-by-chapter learning materials with effective scenarios
- Need to follow the gitquiz course format exactly
- Want to maintain alphabetical ordering in the courses list
- Want to create scenarios that aid understanding and retention of concepts

## Skill Workflow

### 1. Create a Concept Inventory

Before writing any questions, build a complete inventory of concepts from the source material:
- Get the book's full table of contents (TOC) from official sources
- For each chapter, list the key principles, models, case studies, and frameworks
- Note any foundational anecdotes (e.g., British Cycling story, Paper Clip Strategy) that anchor key concepts - these make good scenario material
- **Also capture sub-topics within each chapter**: notable quotes, aphorisms (e.g., "Gradually, then suddenly"), intellectual movements or paradigm shifts (e.g., the Renaissance, the Enlightenment), and counter-ideologies that arise in response to dominant systems (e.g., communism as a response to capitalism). These are easy to miss if you only track chapter-level headings.
- Use this inventory as a checklist: every concept and sub-topic gets at least one quiz question
- Group related concepts into logical chapters. Do not sacrifice conceptual coverage for an arbitrary chapter count; create as many chapters as needed to cover all key concepts from the source material.

### 2. Audit Before Creating (New or Rewrite)

Whether creating from scratch or enriching an existing course:
- **For a rewrite**: Read the full source TOC and build the concept inventory (Step 1). You do not need to re-read old quiz files unless you want to salvage specific scenarios.
- **For enrichment**: Read all existing chapter files and map concepts against the source TOC to identify gaps.
- **Then decide**: does the missing concept fit thematically into an existing chapter? Add it there to keep chapters cohesive. Otherwise create a new chapter file.
- Update the courses list only if creating a completely new course (existing courses stay listed).
- **Key**: Concept density per chapter should not exceed 12 questions. If adding would push past 12, create a new chapter instead.

### 3. Present a Plan for Approval
- Before creating files, present a structured plan to the user including:
  - Proposed chapter structure with concepts grouped per chapter
  - Approach for creating engaging real-life scenarios per concept
  - File list that will be created (001.json through 00N.json)
  - Target number of questions per chapter (7-12)
- Wait for user approval before proceeding to file creation
- This ensures the user can guide scenario design and chapter organization up front

### 4. Create Chapter Directory
```bash
mkdir -p courses/course-identifier/
```
Where `course-identifier` follows the pattern: `book-title-in-kebab-case`

### 4. Create Chapter JSON Files
For each chapter (001.json, 002.json, etc.), create a file with this format:

```json
[
  {
    "question": "Concept Name",
    "content": "Brief explanation of the concept (1-2 sentences)",
    "description": "Real-world scenario that illustrates the concept",
    "options": [
      "Incorrect option 1",
      "Incorrect option 2", 
      "Correct option",
      "Incorrect option 4"
    ],
    "answer": "Correct option (exact text from options)",
    "explanation": "Clear explanation of why this is correct and others are not"
  },
  // ... 7-12 questions per chapter
]
```

Follow these content conventions for each field:
- **Question**: Concept/model name (e.g., "Occam's Razor", "Confirmation Bias")
- **Content**: Concise definition/explanation of the concept
- **Description**: Scenario setup ending with a question (e.g., "This illustrates:")
- **Options**: 4 plausible options, only one correct
  - **CRITICAL**: Options must NOT reference **other options** by letter (e.g., "Both B and C", "A & C", "B & D", "All of the above"). Options are shuffled at runtime, so positional letter references become meaningless. Use standalone text instead. — Letters used as **content** (e.g. "A and E" for a question about vowels) are fine since they're the actual answer, not a reference to another option's position.
- **Answer**: Must match exactly one option string
- **Explanation**: Teaching moment explaining the reasoning

### 5. Maintain Difficulty and Coverage
- Earlier chapters: Foundational concepts
- Middle chapters: Core principles/applications
- Later chapters: Integrated scenarios, advanced applications
- Final chapters: Comprehensive review and advanced topics, minimizing redundancy
- **Coverage first**: If the source material has significant gaps after grouping, create additional chapters. Conceptual coverage is more important than hitting a target chapter count.
- **Scrutinize review-only chapters**: A chapter that purely repeats concepts already taught (without adding new material or novel integrations) should be deleted rather than kept. Review concepts can be naturally reinforced within the core chapter questions themselves.
- **Quantitative threshold for review detection**: After creating all chapters, run a script that compares each chapter's concepts against prior chapters. If ≥65% of a chapter's concepts already appeared in prior chapters and the new material could fit elsewhere, the chapter is review-only and should be eliminated. Chapters with 35-64% repetition are "mixed" — consider consolidating them with adjacent chapters.

### 5a. Maintain Difficulty Variation Within Chapters

Engagement drops when every question is trivially easy. Each chapter must contain a deliberate mix of difficulty levels:

- **Easy (30-40%)**: Straightforward recall — the correct answer is clearly right once you know the concept. Two distractors are clearly wrong.
- **Medium (35-45%)**: Requires applying the concept to an unfamiliar scenario. All four options are plausible; the distinction lies in nuance.
- **Hard (15-25%)**: Requires synthesizing multiple concepts, catching subtle distinctions, or avoiding a common trap. All options are highly plausible at a surface level — the learner must deeply understand the concept to pick the right one.

Hard-question techniques:

- **Trapdoor option**: Include one option that sounds correct because it uses concept-adjacent buzzwords but actually describes a different concept.
- **Reverse application**: Present a scenario that seems to fit Concept A but actually illustrates Concept B. The learner must recognize the mismatch.
- **Boundary case**: Test the edge of a definition — "When does this principle stop applying?" or "Which situation would this principle not address?"
- **Competing principles**: Two valid principles point to different conclusions; the learner must determine which takes priority.
- **Option symmetry**: All four options are the same length, structure, and grammatical form — no option stands out by appearance alone. Use professional-grade distractors that would each be correct in a slightly different scenario.

**Pre-writing validation**: Before writing explanations, label each question E/M/H. If a chapter has 0 hard questions, rewrite at least 1-2. If all questions are the same difficulty, rebalance.

### 6. Update Courses List
Add your course identifier to `courses/courses_list.txt` in alphabetical position:
- Keep one course per line
- Use kebab-case identifiers (e.g., `book-super-thinking`)
- Maintain strict alphabetical ordering

### 7. Maintain Scenario Diversity
- Vary scenarios across multiple domains: professional (engineering, medicine, law), personal (parenting, relationships, health, family), creative (art, music, writing), social (community, small business, sports, activism), and philosophical (science, spirituality, ethics)
- Avoid overusing workplace scenarios for every question - real life is broader than the office
- Each scenario should feel authentic and relatable to a general audience

#### 7a. The "Natural Fit" Heuristic for Diversification
Not every concept translates well to every domain. Before changing a scenario, ask:
- **Natural fit** — does the concept inherently apply to this domain? (e.g., "Shadow Loyalties" works for family, sports teams, AND corporate boards)
- **Native domain** — is the concept fundamentally about organizational/system dynamics? (e.g., "Cross-Sector Orchestration" or "Supply Chain Scaling" — changing these would weaken the question)
- **Force-fit test** — would the question make equal pedagogical sense after the change? If the scenario becomes confusing or inauthentic, leave it in its native domain.

Only ~25-30% of questions typically benefit from diversification. The rest should stay where the concept naturally lives.

#### 7b. Two-Pass Approach to Diversity
Write all questions first with whatever scenarios come naturally. Then do a deliberate second pass:
1. Read only the `description` fields sequentially
2. For each, note the domain (corporate, personal, community, etc.)
3. If 3+ consecutive questions are in the same domain, look for the best candidate to diversify
4. Apply the natural-fit heuristic — only change if it strengthens the question

### 8. Quality Check
Before completing:

Field-level checks (every question):
- [ ] Every question has all five required fields: `question`, `content`, `description`, `options` (array of 4), `answer`, `explanation` (watch for typos like `"context"` instead of `"content"`)
- [ ] `answer` text matches exactly one entry in `options` (watch for typos: "unpredictable" vs "unexpected")
- [ ] Options are mutually exclusive
- [ ] No option references other options by position (grep for `"Both [A-D]`, `"All of the above`, `[A-D] & [A-D]`)
- [ ] Explanations teach, don't just state

File-level checks:
- [ ] All JSON files are valid (parseable, no duplicate keys)
- [ ] Each chapter has 7-12 questions
- [ ] File naming uses 001.json, 002.json format
- [ ] Courses list is alphabetically sorted

Difficulty variation check:
- [ ] Each chapter has a mix: 30-40% easy, 35-45% medium, 15-25% hard
- [ ] No chapter has 0 hard questions — learner engagement requires challenge
- [ ] Hard questions use at least one technique (trapdoor, reverse application, boundary case, competing principles, option symmetry)

Post-creation gap analysis:
- [ ] Every concept from the inventory (Step 1) has at least one question
- [ ] Key case studies from the source material appear as scenarios or concepts
- [ ] **Sub-topic gap analysis**: run a second pass against the full TOC mapping each book chapter to your questions, then drill into sub-topics (quotes, movements, counter-ideologies). Chapter-level coverage does not guarantee sub-topic coverage.
- [ ] For enrichment: added concepts fit thematically in their chapter, chapter does not exceed 12 questions
- [ ] Run the coverage verification script against the concept inventory to confirm no gaps

Structural audit:
- [ ] No review-only chapter exists (run the review-only detection script; no chapter should exceed 65% repetition from prior chapters)
- [ ] Run the cross-chapter repetition script: no concept should appear across 3+ chapters in the same course
- [ ] For rewrites/restructures: old files are deleted before new ones are created (use `Remove-Item -Path "courses/course-identifier/*.json"`)

Post-creation diversity audit:
- [ ] Do a second pass reading only `description` fields — note the domain of each
- [ ] If 50%+ of questions are in a single domain (especially corporate), diversify ~25-30% into other domains using the natural-fit heuristic
- [ ] No scenario is force-fit — each change improves the question, not just changes it
- [ ] Every chapter has at least one question that feels relatable to a non-professional audience

## Reusable Scripts

These scripts automate the repetitive parts of quiz creation. Run them after creating the chapter JSON files.

### Create Single Chapter File (per-file approach)

Use this pattern to create each chapter file. Run separately per file to keep commands short:
```bash
node -e "
const fs = require('fs');
const d = [
  {question:'Concept Name',content:'Brief explanation.','description:'Scenario setup?',options:['Option 1','Option 2','Correct answer','Option 4'],answer:'Correct answer',explanation:'Why this is right.'}
];
fs.writeFileSync('courses/course-identifier/001.json', JSON.stringify(d, null, 2), 'utf8');
console.log('001.json: ' + d.length + ' questions');
"
```
**CRITICAL**: Avoid contractions (use "does not" instead of "doesn't", "cannot" instead of "can't", "will not" instead of "won't") in the inline script, or escape them for PowerShell. Alternatively, write a `.js` file to disk first and run with Node.

### Generator Script for Multi-Chapter Courses (New or Rewrite)

For courses with 5+ chapters, write a single `.js` file that generates all chapters at once. This avoids repeated PowerShell calls and makes it easy to spot-check consistency across chapters. Works equally well for creating new courses and for major restructures of existing ones.

```javascript
// gen_course.js
const fs = require('fs');
const DIR = 'courses/course-identifier';

// Write one chapter
function writeChapter(num, questions) {
  const file = DIR + '/' + String(num).padStart(3, '0') + '.json';
  fs.writeFileSync(file, JSON.stringify(questions, null, 2), 'utf8');
  console.log(String(num).padStart(3, '0') + '.json: ' + questions.length + ' questions');
}

// Chapter 1
writeChapter(1, [
  { question: 'Concept Name', content: '...', description: '...?', options: ['A','B','C','D'], answer: 'D', explanation: '...' }
  // ... more questions
]);

// Chapter 2, 3, etc.
```

**Advantages**: single file, easy to preview all data, no PowerShell escaping issues, write all files in one `node gen_course.js` command.

### File Creation via Temp Script (for large data)

When the data is large, write a JS file first to avoid PowerShell command-length limits:
```bash
$script = @'
const fs = require("fs");
const d = [ /* ... your data ... */ ];
fs.writeFileSync("courses/course-identifier/001.json", JSON.stringify(d, null, 2), "utf8");
'@
Set-Content -Path "$env:TEMP\gen_chapter.js" -Value $script -Encoding UTF8
node "$env:TEMP\gen_chapter.js"
```

### Validation Script (see `validation.js` in this directory)

Edit `dir` inside `validation.js` to point to your course, then run:
```bash
node .opencode/skill/book-to-quiz/validation.js
```
Checks: JSON parseability, 7-12 questions per file, all fields present, answer in options, no positional refs, courses list sorted.

For multi-course validation, use `validate_all.js` instead (no dir edit needed).

### Review-Only Chapter Detection (see `review_detection.js` in this directory)

Edit `dir` and `conceptGroups` inside `review_detection.js`, then run:
```bash
node .opencode/skill/book-to-quiz/review_detection.js
```
**Thresholds**: ≥65% = review-only (delete), 35-64% = mixed (consider consolidating), <35% = fresh.

### Cross-Chapter Repetition Detection (see `cross_chapter_repetition.js` in this directory)

Edit `dir` and `conceptGroups` inside `cross_chapter_repetition.js`, then run:
```bash
node .opencode/skill/book-to-quiz/cross_chapter_repetition.js
```
**Threshold**: any concept in 3+ chapters → consolidate.

### Coverage Verification Script (see `coverage_check.js` in this directory)

Edit `dir` and the `inventory` array inside `coverage_check.js`, then run:
```bash
node .opencode/skill/book-to-quiz/coverage_check.js
```
Add keyword variations as needed — the script is case-insensitive.

### Difficulty Audit Script (see `difficulty_audit.js` in this directory)

Run `node .opencode/skill/book-to-quiz/difficulty_audit.js` (after editing `dir` inside it) to print every question organized by chapter with blank `[_]` brackets to label E/M/H.

### Difficulty Tally Script (see `difficulty_tally.js` in this directory)

After labeling, paste your labels into `difficulty_tally.js` and run it to validate the distribution per chapter. Flags chapters with 0 hard questions or overall hard < 15%.

### Difficulty Refactoring Scaffold (see `refactor_difficulty.js` in this directory)

When a chapter has 0 hard questions, edit the `replacements` map in `refactor_difficulty.js` — keyed by existing question name — with new hard questions using one of the five techniques (competing principles, boundary case, reverse application, trapdoor, option symmetry). Run with `node .opencode/skill/book-to-quiz/refactor_difficulty.js`.

**Workflow for refactoring**:
1. Run the difficulty audit script — identify chapters with 0 hard questions
2. For each such chapter, pick 1-2 easy questions to upgrade to hard
3. Choose a technique: competing principles, boundary case, reverse application, trapdoor option, or option symmetry
4. Fill in the refactoring scaffold with new question data
5. Run `node refactor_difficulty.js`
6. Re-run the difficulty tally to confirm 15-25% hard per chapter
7. Run the comprehensive validation script to catch any answer/option mismatches

### Multi-Course Comprehensive Validation (see `validate_all.js` in this directory)

Run `node .opencode/skill/book-to-quiz/validate_all.js` from the gitquiz root to validate **every course** in `courses_list.txt` at once. It auto-discovers courses and runs all structural checks:
- JSON parseability
- 7-12 questions per chapter
- All 6 required fields present
- Answer matches exactly one option
- No positional option references (Both A-D, All of the above, A & B)
- File naming convention (001.json format)

This is useful as a final sanity check after any batch of changes.

### Bulk Fix Pattern Scripts (see `fix_influence.js` and `fix_remaining.js`)

When auditing reveals issues across a course, use a `.js` script to batch-fix rather than editing files one by one. The two scripts in this directory demonstrate:

**`fix_influence.js`** — Batch fixer for difficulty labels + question reframing:
- Reads a chapter file, modifies specific questions by index, writes back
- Demonstrates how to reframe a question (replace an entire object) when the original has a structural issue
- Pattern: `f = JSON.parse(fs.readFileSync(...))` → modify `f[idx]` → `fs.writeFileSync(...)`

**`fix_remaining.js`** — Cross-course batch fixer demonstrating:
- Renaming duplicate question names across different chapter files
- Moving a question from one chapter to another (splice from source, push to target)
- Differentiating overlapping concepts by renaming + updating content
- Handling multiple courses in a single script run

Use these as templates when you need to apply systematic fixes across courses. The general flow:
1. Create a `.js` script in `$env:TEMP\opencode\` or in the skill directory
2. Hardcode the specific fixes (course paths, question indices, new content)
3. Run with `node path/to/script.js`
4. Verify with `validate_all.js`

## Technical Learnings

### BOM Issue (Critical)
PowerShell's `Set-Content -Encoding UTF8` prepends a BOM (Byte Order Mark) to the file, which breaks JSON parsing. Always use Node.js `fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8')` to write JSON files cleanly.

### Windows Tool Compatibility
- **`rg` (ripgrep)** is not available on Windows by default. Use **`Select-String`** instead.
- **`sort -c`** is not available in PowerShell. Compare against sorted copy instead.
- **`mkdir -p`** works in PowerShell 5.1 as an alias for `New-Item`.
- **`Remove-Item -LiteralPath` vs `-Path`**: `-LiteralPath` does not support wildcards. Use `-Path` for glob patterns like `Remove-Item -Path "courses/*.json"`.
- **`ls -la`** does not work in PowerShell (the flags have no `-l`/`-a` equivalent). Use plain `ls` (alias for `Get-ChildItem`) or `Get-ChildItem` directly instead.
- **`cat > file << 'EOF'` heredoc** is not available in PowerShell. Use a here-string with `Set-Content` instead: `$script = @' ... '@; Set-Content -Path file -Value $script`.
- **Inline `node -e "..."` with complex JS** often fails due to PowerShell quoting conflicts (nested quotes, regex patterns with backslashes). Use the temp-file pattern instead: write a `.js` file via PowerShell here-string, then `node` it.
- **`Get-Content | Sort-Object | Set-Content` strips trailing newline** from text files. If the file needs a trailing newline, append one explicitly after setting content.

### Scenario Design Patterns
Use these real-life scenario categories to create engaging questions:
- **Professional**: Software debugging, medical diagnosis, sales calls, teaching, architecture
- **Everyday**: Car trouble, cooking, home repairs, driving, navigation
- **Skill Acquisition**: Learning languages, musical instruments, sports, public speaking
- **Creative**: Writing, painting, design, comedy, music improvisation
- **Social**: Networking, dating, parenting, team collaboration
- **Business**: Startups, investing, product launches, marketing

### Cleanup Strategy for Rewrites
When rewriting an existing course from scratch, remove old files before creating new ones:
```powershell
# Delete all JSON files in the course directory
Remove-Item -Path "courses/course-identifier/*.json"
```
Use `-Path` (not `-LiteralPath`) to enable wildcard matching. Then create new 001.json, 002.json, etc. Old files are tracked in git and can be recovered if needed.

**Tip**: When using a generator script for a rewrite, run cleanup first, then the generator. This avoids accidentally leaving orphan files (e.g., old 008-011.json when the new course has only 7 chapters).

### Answer String Matching
The most common error after generation is answer text not matching the option text exactly. Common causes:
- **Synonym mismatch**: option says "unpredictable" but answer says "unexpected"
- **Punctuation**: option ends with a period but answer does not
- **Capitalization**: option starts with uppercase but answer uses lowercase
- **Whitespace**: trailing spaces in one but not the other

Always let the validation script catch these before committing. A simple way to create matching pairs: copy-paste the option string directly into the answer field.

### Escaping Strategy
When embedding JSON in PowerShell `node -e "..."` commands:
- Use full words instead of contractions: "cannot" NOT "can't", "does not" NOT "doesn't"
- Use double quotes inside the JS string, not escaped quotes
- For complex data, write a `.js` script file to disk first using a PowerShell here-string

## Example Chapter Structure

Based from our "Super Thinking" course creation:

**001.json** (Basic Mental Models):
- Question: "Occam's Razor"
- Content: "Occam's Razor states that among competing hypotheses, the one with the fewest assumptions should be selected."
- Description: "You hear hoofbeats and see animal tracks. Which conclusion best applies Occam's Razor?"
- Options: ["A zebra escaped...", "A horse is nearby", "A unicorn...", "An alien spacecraft..."]
- Answer: "A horse is nearby"
- Explanation: "Occam's Razor favors the explanation requiring fewest assumptions..."

## File Naming Conventions
- Course directory: `courses/<kebab-case-title>/`
- Chapter files: `001.json`, `002.json`, ..., `00N.json`
- Courses list: `gitquiz/courses/courses_list.txt`

## Validation Steps
After creating files, run these checks:

1. **JSON syntax**: Validate each file with Node:
   ```bash
   node -e "require('fs').readdirSync('courses/course-identifier/').filter(f => f.endsWith('.json')).forEach(f => { try { JSON.parse(require('fs').readFileSync('courses/course-identifier/'+f)); console.log(f+' OK'); } catch(e) { console.error(f+' FAIL: '+e.message); process.exit(1); } })"
   ```
2. **No position-referencing options**: Search for options that reference other options by letter position:
   ```bash
   Select-String -Path "courses/course-identifier/*.json" -Pattern '(Both [A-D]|All of the above|[A-D] & [A-D])'
   ```
   Should return zero matches (letters as content, e.g. vowel answers like "A and E", are not affected). If any found, rewrite options as standalone text.
   **Note**: The pattern `[A-D]` matches any character in the range A-D, including lowercase `a-d`. Words like "Both **a**re..." or "Both **d**o..." will produce false positives. Manually verify each match - if the word after "Both" is a regular English word (not a standalone letter), it is safe. Only rewrite options that truly reference another option's letter position.
3. **Check answer correctness**: Ensure answer string exactly matches one option
4. **Confirm alphabetical order**: Run `Get-Content courses/courses_list.txt | Sort-Object | Compare-Object (Get-Content courses/courses_list.txt)` or use `node -e "const lines=require('fs').readFileSync('courses/courses_list.txt','utf8').trim().split('\n').sort(); console.log(lines.join('\n'))" ` to verify no errors
5. **Review scenario quality**: Descriptions should be realistic and illustrative

## Example Usage Flow
```
1. User: "I want to create a quiz from 'Get Better at Anything' by Scott Young"
2. Assistant: 
   - Analyzes book for key concepts (12 maxims for mastery across See, Do, Feedback)
   - Groups concepts into 8 logical chapters with ~7-11 questions each
   - Presents a plan: "Here is my proposed chapter structure..."
   - After approval, creates gitquiz/courses/book-get-better-at-anything/ directory
   - Creates 001.json through 008.json with engaging real-life scenarios
   - Updates courses_list.txt to insert "book-get-better-at-anything" alphabetically
   - Validates all files before completion
```

### Enrichment Flow Example
```
1. User: "The Bhagavad Gita quiz isn't satisfying, upgrade it from scratch"
2. Assistant:
   - Reads all 8 existing chapter files and audits concepts covered against the Gita's 18 chapters
   - Identifies gaps: avatar concept, path after death, Ashvattha tree, threefold austerity, svadharma
   - Decides which gaps fit in existing chapters (adds sthitaprajna to Ch2, Maya to Ch5, etc.)
   - Creates 3 new chapters (009-011) for major missing topics (paths after death, austerity, svadharma)
   - Ensures each chapter still has 7-12 questions, runs validation, commits and pushes
```

This skill ensures consistency with existing courses like "book-influence" and "book-super-thinking" while enabling rapid creation of new educational content.