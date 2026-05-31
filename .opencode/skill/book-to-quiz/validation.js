// Validates all requirements for a single course. Edit `dir` to point to your course.
// Usage: node .opencode/skill/book-to-quiz/validation.js
const fs = require('fs');
const dir = 'courses/course-identifier';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
let total = 0, errs = [];
const REQUIRED_FIELDS = ['question', 'content', 'description', 'options', 'answer', 'explanation'];

console.log('=== FILE NAMING ===');
files.forEach(f => console.log(f.match(/^\d{3}\.json$/) ? '  OK: ' + f : '  BAD: ' + f));

console.log('=== QUESTION COUNTS ===');
files.forEach(f => {
  const d = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8'));
  total += d.length;
  console.log('  ' + f + ': ' + d.length + ' q');
  if (d.length < 7 || d.length > 12) errs.push(f + ' has ' + d.length + ' questions');
});
console.log('Total: ' + total);

console.log('=== FIELD CHECK ===');
files.forEach(f => {
  const d = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8'));
  d.forEach((q, i) => {
    REQUIRED_FIELDS.forEach(fld => { if (!(fld in q)) errs.push(f + ' Q' + (i + 1) + ': missing field "' + fld + '"'); });
  });
});

console.log('=== ANSWER/OPTION CHECK ===');
files.forEach(f => {
  const d = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8'));
  d.forEach((q, i) => {
    if (!q.options.includes(q.answer)) errs.push(f + ' Q' + (i + 1) + ': answer not in options. Answer: ' + q.answer);
    if (q.options.length !== 4) errs.push(f + ' Q' + (i + 1) + ': has ' + q.options.length + ' options');
  });
});

console.log('=== POSITIONAL REF CHECK (case-sensitive, flags uppercase only) ===');
files.forEach(f => {
  const d = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8'));
  d.forEach((q, i) => {
    q.options.forEach(o => {
      if (o.match(/(Both [A-D]\b|All of the above\b|[A-D]\s*&\s*[A-D]\b)/))
        errs.push(f + ' Q' + (i + 1) + ': positional ref: ' + o);
    });
  });
});

console.log('=== COURSES LIST SORT ===');
const lines = fs.readFileSync('courses/courses_list.txt', 'utf8').trim().split(/\r?\n/);
const sorted = [...lines].sort();
lines.forEach((l, i) => { if (l !== sorted[i]) errs.push('courses_list.txt not sorted at line ' + (i + 1) + ': ' + l); });
console.log('Course list has ' + lines.length + ' entries');

if (errs.length > 0) { errs.forEach(e => console.log('ERROR: ' + e)); process.exit(1); }
else console.log('=== ALL CHECKS PASSED ===');
