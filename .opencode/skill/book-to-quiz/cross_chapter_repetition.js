// Flags concepts appearing in too many chapters (3+).
// Edit `dir` and `conceptGroups` for your course.
// Usage: node .opencode/skill/book-to-quiz/cross_chapter_repetition.js
const fs = require('fs');
const dir = 'courses/course-identifier';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
const all = {};
files.forEach(f => { all[f] = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8')); });

const conceptGroups = { /* same as review_detection.js */ };

function findConcept(text) {
  const t = text.toLowerCase();
  for (const [concept, patterns] of Object.entries(conceptGroups))
    for (const pat of patterns)
      if (t.includes(pat)) return concept;
  return null;
}

const conceptChapters = {};
files.forEach(f => all[f].forEach(q => {
  const c = findConcept(q.question + ' ' + q.content);
  if (c) { if (!conceptChapters[c]) conceptChapters[c] = new Set(); conceptChapters[c].add(f); }
}));

let found = 0;
Object.entries(conceptChapters)
  .filter(([_, chs]) => chs.size >= 3)
  .sort((a, b) => b[1].size - a[1].size)
  .forEach(([concept, chapters]) => {
    found++;
    console.log('"' + concept + '" appears in ' + chapters.size + ' chapters: ' + [...chapters].sort().join(', '));
  });

if (found === 0) console.log('No concept appears in 3+ chapters. Good repetition control.');
else console.log('Total: ' + found + ' over-repeated concepts — consider consolidating.');
