// Detects review-only chapters by analyzing concept repetition across files.
// Edit `dir` and `conceptGroups` for your course.
// Usage: node .opencode/skill/book-to-quiz/review_detection.js
const fs = require('fs');
const dir = 'courses/course-identifier';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
const all = {};
files.forEach(f => { all[f] = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8')); });

// Define canonical concept groups (customize for your course)
const conceptGroups = {
  'Example Concept': ['example concept', 'alt name', 'another name'],
};

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

files.forEach(f => {
  const prior = files.slice(0, files.indexOf(f));
  let repeat = 0, total = 0;
  all[f].forEach(q => {
    const c = findConcept(q.question + ' ' + q.content);
    if (c && conceptChapters[c] && [...conceptChapters[c]].some(pf => prior.includes(pf))) repeat++;
    total++;
  });
  const pct = (repeat / total * 100).toFixed(0);
  const tag = pct >= 65 ? 'REVIEW-ONLY' : (pct >= 35 ? 'MIXED' : 'FRESH');
  console.log(f + ': ' + repeat + '/' + total + ' repeated (' + pct + '%) [' + tag + ']');
});
