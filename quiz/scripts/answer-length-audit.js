const fs = require('fs');

const listPath = 'courses/courses_list.txt';
if (!fs.existsSync(listPath)) {
  console.error('courses_list.txt not found — run this from the gitquiz root');
  process.exit(1);
}
const dirs = fs.readFileSync(listPath, 'utf8').trim().split(/\r?\n/).filter(Boolean);

const BANNED_SUFFIX = 'which is a critical factor to consider in this context';
const wordCount = s => s.split(/\s+/).length;

let grandTotalQ = 0, grandTotalLongest = 0, grandTotalShortest = 0, grandPadded = 0, grandOutside20 = 0;
const courseResults = [];

dirs.forEach(dir => {
  const path = 'courses/' + dir;
  if (!fs.existsSync(path) || !fs.statSync(path).isDirectory()) return;

  const files = fs.readdirSync(path).filter(f => f.endsWith('.json')).sort();
  let courseTotal = 0, courseLongest = 0, courseShortest = 0, coursePadded = 0, courseOutside20 = 0;

  files.forEach(f => {
    let data;
    try { data = JSON.parse(fs.readFileSync(path + '/' + f, 'utf8')); } catch (_) { return; }
    if (!Array.isArray(data)) return;

    data.forEach(q => {
      if (!q.answer || !Array.isArray(q.options) || q.options.length !== 4) return;

      // Detect mechanical padding suffix on non-answer options
      const correctAnswer = q.answer.trim().toLowerCase();
      q.options.forEach(opt => {
        if (opt.toLowerCase() !== correctAnswer && opt.toLowerCase().includes(BANNED_SUFFIX)) {
          coursePadded++;
        }
      });

      const lengths = q.options.map(wordCount);
      const answerLen = wordCount(q.answer);
      const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const ratio = avgLen > 0 ? answerLen / avgLen : 1;
      if (ratio < 0.8 || ratio > 1.2) courseOutside20++;

      const minLen = Math.min(...lengths);
      const maxLen = Math.max(...lengths);
      const uniqueMin = lengths.filter(l => l === minLen).length === 1;
      const uniqueMax = lengths.filter(l => l === maxLen).length === 1;
      if (uniqueMin && answerLen === minLen) courseShortest++;
      else if (uniqueMax && answerLen === maxLen) courseLongest++;
      courseTotal++;
    });
  });

  if (courseTotal > 0) {
    grandTotalQ += courseTotal;
    grandTotalLongest += courseLongest;
    grandTotalShortest += courseShortest;
    grandPadded += coursePadded;
    grandOutside20 += courseOutside20;
    courseResults.push({
      dir, courseTotal, courseLongest, courseShortest, coursePadded, courseOutside20
    });
  }
});

console.log('=== ANSWER LENGTH BIAS AUDIT (word-count) ===');
console.log(`Scanned ${grandTotalQ} questions across ${courseResults.length} courses.\n`);

// Banned suffix report
if (grandPadded > 0) {
  console.log(`⚠  MECHANICAL PADDING DETECTED: ${grandPadded} instances of "${BANNED_SUFFIX}"`);
  console.log('   This suffix is banned. Rewrite these options with context-appropriate expansions.');
  courseResults.filter(c => c.coursePadded > 0).forEach(c => {
    console.log(`   ${c.dir}: ${c.coursePadded} padded option(s)`);
  });
  console.log('');
}

// Ratio compliance
const pctOutside = ((grandOutside20 / grandTotalQ) * 100).toFixed(1);
console.log(`Word-count ratio compliance (target: 0.8–1.2 × avg option length)`);
console.log(`Questions outside range: ${grandOutside20}/${grandTotalQ} = ${pctOutside}%`);
if (grandOutside20 > 0) {
  console.log('Courses with >25% outside range:');
  courseResults.filter(c => c.courseOutside20 / c.courseTotal > 0.25).forEach(c => {
    const pct = ((c.courseOutside20 / c.courseTotal) * 100).toFixed(1);
    console.log(`   ${c.dir}: ${c.courseOutside20}/${c.courseTotal} = ${pct}% outside range`);
  });
}
console.log('');

// Longest/shortest report
console.log('--- Per-Course Summary (unique longest/shortest) ---');
courseResults.forEach(c => {
  const pctLong = ((c.courseLongest / c.courseTotal) * 100).toFixed(1);
  const pctShort = ((c.courseShortest / c.courseTotal) * 100).toFixed(1);
  const padded = c.coursePadded > 0 ? ` | padded: ${c.coursePadded}` : '';
  const outPct = ((c.courseOutside20 / c.courseTotal) * 100).toFixed(1);
  const outside = c.courseOutside20 > 0 ? ` | out-of-range: ${outPct}%` : '';
  console.log(`  ${c.dir}: long ${c.courseLongest}/${c.courseTotal} (${pctLong}%), short ${c.courseShortest}/${c.courseTotal} (${pctShort}%)${padded}${outside}`);
});

const grandPctLong = ((grandTotalLongest / grandTotalQ) * 100).toFixed(1);
const grandPctShort = ((grandTotalShortest / grandTotalQ) * 100).toFixed(1);
console.log(`\nTotal: ${grandTotalLongest}/${grandTotalQ} longest (${grandPctLong}%), ${grandTotalShortest}/${grandTotalQ} shortest (${grandPctShort}%)`);
console.log(`Total padded: ${grandPadded}`);

const exitCode = (grandPadded > 0 || grandOutside20 > 0) ? 1 : 0;
process.exit(exitCode);
