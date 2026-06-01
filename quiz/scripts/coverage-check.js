const fs = require('fs');
const dir = 'courses/course-identifier';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
const allText = files.flatMap(f => JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8')))
  .map(q => (q.question + ' ' + q.content + ' ' + q.description + ' ' + q.explanation).toLowerCase())
  .join(' ');

const inventory = [
  ['Concept Name', 'keyword1', 'keyword2'],
];

let found = 0, missing = 0;
inventory.forEach(([concept, ...kw]) => {
  if (kw.some(k => allText.includes(k))) { found++; console.log('  ✓ ' + concept); }
  else { missing++; console.log('  ✗ MISSING: ' + concept); }
});
console.log(found + '/' + (found + missing) + ' covered, ' + missing + ' gaps');
