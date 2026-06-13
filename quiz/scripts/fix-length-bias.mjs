import fs from 'fs';
import path from 'path';

const courseDir = process.argv[2];
if (!courseDir) { console.error('Usage: node fix-length-bias.mjs <course-dir>'); process.exit(1); }

const dir = path.resolve(courseDir);
const files = fs.readdirSync(dir).filter(f => /^\d{3}\.json$/.test(f)).sort();

function shorten(text, maxLen) {
  if (text.length <= maxLen) return text;

  // Strategy: find " because" or ", because" and shorten the clause that follows
  const becausePatterns = [', because ', ' because '];
  for (const pat of becausePatterns) {
    const idx = text.indexOf(pat);
    if (idx > 3 && idx < maxLen) {
      const prefix = text.substring(0, idx);
      const clause = text.substring(idx + pat.length);
      // How much room do we have for the clause?
      const room = maxLen - prefix.length - pat.length;
      if (clause.length > room) {
        // Truncate clause at word boundary
        const truncated = clause.substring(0, room).replace(/\s\S*$/, '');
        if (truncated.length > 5) {
          return prefix + pat + truncated;
        }
      }
    }
  }

  // Fallback: just cut at last word boundary before maxLen
  const lastSpace = text.lastIndexOf(' ', maxLen);
  if (lastSpace > 10) {
    return text.substring(0, lastSpace);
  }

  return text;
}

let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let changed = false;

  for (const q of questions) {
    const alen = q.answer.length;
    const olens = q.options.map(o => o.length);
    const maxOther = Math.max(...olens.filter((_, i) => q.options[i] !== q.answer));
    const answerIdx = q.options.indexOf(q.answer);

    if (alen > maxOther && answerIdx !== -1) {
      // Target: answer length <= maxOther (or at most maxOther - 1 if unique)
      const target = maxOther;
      const shortened = shorten(q.answer, target);
      if (shortened.length < alen && shortened.length > 10) {
        q.options[answerIdx] = shortened;
        q.answer = shortened;
        changed = true;
        totalFixed++;
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, JSON.stringify(questions, null, 2) + '\n', 'utf8');
  }
}

console.log(`Fixed ${totalFixed} questions.`);

// Post-check
let remaining = 0;
for (const file of files) {
  const filePath = path.join(dir, file);
  const questions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let bad = 0;
  for (const q of questions) {
    const alen = q.answer.length;
    const olens = q.options.map(o => o.length);
    if (alen > Math.max(...olens.filter((_, i) => q.options[i] !== q.answer))) {
      bad++;
    }
  }
  if (bad > 0) {
    console.log(`  ${file}: ${bad}/${questions.length} still unbalanced`);
    remaining += bad;
  } else {
    console.log(`  ${file}: ✓`);
  }
}
if (remaining > 0) console.log(`\n${remaining} questions still need manual fix.`);
else console.log(`\nAll clean!`);
