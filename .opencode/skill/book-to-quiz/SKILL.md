---
name: book-to-quiz
description: Converts books or summaries into scenario-based quiz courses for the gitquiz system. Use when creating interactive learning materials from book content.
---

# Book to Quiz Skill

This skill helps you convert a book or its summary into a scenario-based quiz course for the gitquiz system, following the established format and conventions.

## When to Use

Use this skill when you:
- Have a book (or detailed summary) you want to convert to an interactive quiz
- Want to create chapter-by-chapter learning materials with effective scenarios
- Need to follow the gitquiz course format exactly
- Want to maintain alphabetical ordering in the courses list
- Want to create scenarios that aid understanding and retention of concepts

## Skill Workflow

### 1. Analyze the Book Content
- Identify key concepts, principles, or models from the book
- Group related concepts into logical chapters (typically 6-10 chapters)
- For each concept, identify a real-world scenario that illustrates it and aids learning

### 2. If Course Exists: Audit Before Enriching

When **improving an existing course** (e.g., user says "this isn't satisfying, upgrade it"):
- Read all existing chapter files and list every concept already covered
- Map concepts against the source material's full table of contents to identify gaps
- **Then decide**: does the missing concept fit thematically into an existing chapter? Add it there to keep chapters cohesive. Otherwise create a new chapter file (009.json, 010.json, etc.)
- Update the courses list only if creating a completely new course (existing courses stay listed)
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

### 5. Maintain Difficulty Progression
- Earlier chapters: Foundational concepts
- Middle chapters: Core principles/applications
- Later chapters: Integrated scenarios, advanced applications
- Final chapter: Comprehensive review minimizing redundancy

### 6. Update Courses List
Add your course identifier to `courses/courses_list.txt` in alphabetical position:
- Keep one course per line
- Use kebab-case identifiers (e.g., `book-super-thinking`)
- Maintain strict alphabetical ordering

### 7. Maintain Scenario Diversity
- Vary scenarios across multiple domains: professional (engineering, medicine, law), personal (parenting, relationships, health), creative (art, music, writing), social (community, politics, activism), and philosophical (science, spirituality, ethics)
- Avoid overusing workplace scenarios for every question - real life is broader than the office
- Each scenario should feel authentic and relatable to a general audience

### 8. Quality Check
Before completing:
- [ ] All JSON files are valid (parseable, no duplicate keys)
- [ ] Run `node -e "JSON.parse(require('fs').readFileSync('FILE'))"` on each JSON file
- [ ] Each chapter has 7-12 questions
- [ ] Options are mutually exclusive
- [ ] No option references other options by position (grep for `"Both [A-D]`, `"All of the above`, `[A-D] & [A-D]`)
- [ ] Answer matches exactly one option
- [ ] Explanations teach, don't just state
- [ ] Courses list is alphabetically sorted
- [ ] File naming uses 001.json, 002.json format
- [ ] For enrichment: added concepts fit thematically in their chapter, chapter does not exceed 12 questions

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

### Comprehensive Validation Script

Validates all requirements in one command:
```bash
node -e "
const fs=require('fs');
const dir='courses/course-identifier';
const files=fs.readdirSync(dir).filter(f=>f.endsWith('.json')).sort();
let total=0,errs=[];
console.log('=== FILE NAMING ===');
files.forEach(f=>console.log(f.match(/^\d{3}\.json$/)?'  OK: '+f:'  BAD: '+f));
console.log('=== QUESTION COUNTS ===');
files.forEach(f=>{const d=JSON.parse(fs.readFileSync(dir+'/'+f,'utf8'));total+=d.length;console.log('  '+f+': '+d.length+' q');if(d.length<7||d.length>12)errs.push(f+' has '+d.length+' questions')});
console.log('Total: '+total);
console.log('=== ANSWER/OPTION CHECK ===');
files.forEach(f=>{const d=JSON.parse(fs.readFileSync(dir+'/'+f,'utf8'));d.forEach((q,i)=>{if(!q.options.includes(q.answer))errs.push(f+' Q'+(i+1)+': answer not in options');if(q.options.length!==4)errs.push(f+' Q'+(i+1)+': has '+q.options.length+' options')})});
console.log('=== COURSES LIST SORT ===');
const lines=fs.readFileSync('courses/courses_list.txt','utf8').trim().split('\r\n');
const sorted=[...lines].sort();
lines.forEach((l,i)=>{if(l!==sorted[i])errs.push('courses_list.txt not sorted at line '+(i+1))});
if(errs.length>0){errs.forEach(e=>console.log('ERROR: '+e));process.exit(1)}
else console.log('ALL CHECKS PASSED');
"
```

## Technical Learnings

### BOM Issue (Critical)
PowerShell's `Set-Content -Encoding UTF8` prepends a BOM (Byte Order Mark) to the file, which breaks JSON parsing. Always use Node.js `fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8')` to write JSON files cleanly.

### Windows Tool Compatibility
- **`rg` (ripgrep)** is not available on Windows by default. Use **`Select-String`** instead.
- **`sort -c`** is not available in PowerShell. Compare against sorted copy instead.
- **`mkdir -p`** works in PowerShell 5.1 as an alias for `New-Item`.

### Scenario Design Patterns
Use these real-life scenario categories to create engaging questions:
- **Professional**: Software debugging, medical diagnosis, sales calls, teaching, architecture
- **Everyday**: Car trouble, cooking, home repairs, driving, navigation
- **Skill Acquisition**: Learning languages, musical instruments, sports, public speaking
- **Creative**: Writing, painting, design, comedy, music improvisation
- **Social**: Networking, dating, parenting, team collaboration
- **Business**: Startups, investing, product launches, marketing

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