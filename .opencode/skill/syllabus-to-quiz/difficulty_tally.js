const fs = require('fs');
const dir = 'courses/course-identifier';
// Replace with your labels from difficulty_audit.js output
const labels = {
  // '001.json': ['E','M','E','M','H','E','H','E'],
};

const files = Object.keys(labels).sort();
let totalEasy = 0, totalMed = 0, totalHard = 0, errors = 0;

files.forEach(f => {
  const d = JSON.parse(fs.readFileSync(dir + '/' + f, 'utf8'));
  if (labels[f].length !== d.length) {
    console.log('ERROR: ' + f + ' has ' + d.length + ' questions but ' + labels[f].length + ' labels');
    errors++; return;
  }
  const e = labels[f].filter(l => l === 'E').length;
  const m = labels[f].filter(l => l === 'M').length;
  const h = labels[f].filter(l => l === 'H').length;
  const pct = (h / d.length * 100).toFixed(0);
  const ok = h > 0 ? 'OK' : 'NO HARD QUESTIONS';
  console.log(f + ': E=' + e + ' M=' + m + ' H=' + h + ' (' + pct + '%) [' + ok + ']');
  totalEasy += e; totalMed += m; totalHard += h;
});

const total = totalEasy + totalMed + totalHard;
console.log('\nTotal: ' + total + ' questions — E=' + totalEasy + ' (' + (totalEasy/total*100|0) + '%) M=' + totalMed + ' (' + (totalMed/total*100|0) + '%) H=' + totalHard + ' (' + (totalHard/total*100|0) + '%)');
if (totalHard / total < 0.15) console.log('WARNING: Hard questions below 15% — refactor some questions.');
if (errors) process.exit(1);
