const fs = require('fs');
const path = require('path');

const coursesDir = 'courses';
const listPath = path.join(coursesDir, 'courses_list.txt');
const courses = fs.readFileSync(listPath, 'utf8').trim().split('\n').map(s => s.trim()).filter(Boolean);

let grandEasy = 0, grandMed = 0, grandHard = 0, grandErrors = 0;

courses.forEach(course => {
  const dir = path.join(coursesDir, course);
  if (!fs.existsSync(dir)) { console.log(`--- ${course} --- SKIP (not found)`); return; }
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
  let courseEasy = 0, courseMed = 0, courseHard = 0, fileErrors = 0;

  files.forEach(f => {
    const data = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
    if (!Array.isArray(data)) { console.log(`  ${f}: not an array`); fileErrors++; return; }
    data.forEach((q, i) => {
      const d = q.difficulty ? q.difficulty.toLowerCase() : '';
      if (d === 'easy') courseEasy++;
      else if (d === 'medium') courseMed++;
      else if (d === 'hard') courseHard++;
      else { console.log(`  ${f}[${i+1}]: invalid difficulty "${q.difficulty}"`); fileErrors++; }
    });
  });

  const total = courseEasy + courseMed + courseHard;
  const pctHard = total > 0 ? (courseHard / total * 100).toFixed(0) : 'N/A';
  const color = total > 0 && courseHard > 0 ? 'OK' : 'NO HARD QUESTIONS';
  const warn = total > 0 && (courseHard / total) < 0.15 ? ' WARNING: less than 15% hard' : '';
  console.log(`--- ${course} (${files.length} files, ${total} q) --- E=${courseEasy} M=${courseMed} H=${courseHard} (${pctHard}%) [${color}]${warn}`);
  grandEasy += courseEasy; grandMed += courseMed; grandHard += courseHard;
  grandErrors += fileErrors;
});

const grandTotal = grandEasy + grandMed + grandHard;
console.log(`\n=== GRAND TOTAL: ${grandTotal} questions — E=${grandEasy} (${(grandEasy/grandTotal*100|0)}%) M=${grandMed} (${(grandMed/grandTotal*100|0)}%) H=${grandHard} (${(grandHard/grandTotal*100|0)}%) ===`);
if (grandErrors) console.log(`ERRORS: ${grandErrors}`);
if (grandHard / grandTotal < 0.15) console.log('WARNING: Overall hard questions below 15% — refactor some questions.');
console.log(grandErrors ? 'FAIL' : 'ALL CHECKS PASSED');
