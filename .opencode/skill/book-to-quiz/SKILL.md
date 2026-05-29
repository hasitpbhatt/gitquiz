---
name: book-to-quiz
description: Converts books or summaries into scenario-based quiz courses for the gitquiz system. Use when creating interactive learning materials from book content.
---

# Book to Quiz Skill

This skill helps you convert a book or its summary into a scenario-based quiz course for the gitquiz system, following the established format and conventions.

## When to Use

Use this skill when you:
- Have a book (or detailed summary) you want to convert to an interactive quiz
- Want to create chapter-by-chapter learning materials
- Need to follow the gitquiz course format exactly
- Want to maintain alphabetical ordering in the courses list

## Skill Workflow

### 1. Analyze the Book Content
- Identify key concepts, principles, or models from the book
- Group related concepts into logical chapters (typically 6-10 chapters)
- For each concept, identify a real-world scenario that illustrates it

### 2. Create Chapter Directory
```bash
mkdir -p gitquiz/courses/course-identifier/
```
Where `course-identifier` follows the pattern: `book-title-in-kebab-case`

### 3. Create Chapter JSON Files
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
  // ... 6-12 questions per chapter
]
```

### 4. Follow Content Conventions
- **Question**: Concept/model name (e.g., "Occam's Razor", "Confirmation Bias")
- **Content**: Concise definition/explanation of the concept
- **Description**: Scenario setup ending with a question (e.g., "This illustrates:")
- **Options**: 4 plausible options, only one correct
- **Answer**: Must match exactly one option string
- **Explanation**: Teaching moment explaining the reasoning

### 5. Maintain Difficulty Progression
- Earlier chapters: Foundational concepts
- Middle chapters: Core principles/applications
- Later chapters: Integrated scenarios, advanced applications
- Final chapter: Comprehensive review minimizing redundancy

### 6. Update Courses List
Add your course identifier to `gitquiz/courses/courses_list.txt` in alphabetical position:
- Keep one course per line
- Use kebab-case identifiers (e.g., `book-super-thinking`)
- Maintain strict alphabetical ordering

### 7. Quality Check
Before completing:
- [ ] All JSON files are valid (parseable)
- [ ] Each chapter has 7-12 questions
- [ ] Options are mutually exclusive
- [ ] Answer matches exactly one option
- [ *] Explanations teach, don't just state
- [ ] Courses list is alphabetically sorted
- [ ] File naming uses 001.json, 002.json format

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
- Course directory: `gitquiz/courses/<kebab-case-title>/`
- Chapter files: `001.json`, `002.json`, ..., `00N.json`
- Courses list: `gitquiz/courses/courses_list.txt`

## Validation Steps
After creating files:
1. Verify JSON syntax: Use a JSON validator on each file
2. Check answer correctness: Ensure answer string exactly matches one option
3. Confirm alphabetical order: `sort -c courses_list.txt` should not error
4. Review scenario quality: Descriptions should be realistic and illustrative

## Example Usage Flow
```
1. User: "I want to create a quiz from 'Thinking in Bets' by Annie Duke"
2. Assistant: 
   - Analyzes book for key concepts (resulting, probabilistic thinking, etc.)
   - Creates gitquiz/courses/book-thinking-in-bets/ directory
   - Creates 001.json through 008.json with scenario-based questions
   - Updates courses_list.txt to insert "book-thinking-in-bets" alphabetically
   - Validates all files before completion
```

This skill ensures consistency with existing courses like "book-influence" and "book-super-thinking" while enabling rapid creation of new educational content.