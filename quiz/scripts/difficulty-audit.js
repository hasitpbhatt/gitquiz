const fs = require('fs');
const dir = process.argv[2] || 'courses/course-identifier';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
console.log('=== DIFFICULTY AUDIT ===');
console.log('Label each question: E (Easy), M (Medium), H (Hard)\n');
files.forEach(f => {
  const d = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8'));
  console.log('--- ' + f + ' (' + d.length + ' questions) ---');
  d.forEach((q, i) => {
    const desc = q.description.length > 100 ? q.description.slice(0, 97) + '...' : q.description;
    console.log('  [' + (i + 1) + '] _  ' + q.question);
    console.log('      ' + desc);
  });
  console.log('');
});

console.log('=== INSTRUCTIONS ===');
console.log('1. Replace each underscore in the brackets with E, M, or H');
console.log('2. Copy labels into difficulty-tally.js or add inline and run it');
