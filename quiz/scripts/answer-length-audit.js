const fs = require('fs');

const listPath = 'courses/courses_list.txt';
if (!fs.existsSync(listPath)) {
  console.error('courses_list.txt not found — run this from the gitquiz root');
  process.exit(1);
}
const dirs = fs.readFileSync(listPath, 'utf8').trim().split(/\r?\n/).filter(Boolean);

const wordCount = s => s.split(/\s+/).length;

let grandTotalQ = 0, grandTotalLongest = 0, grandTotalShortest = 0;
const courseResults = [];

dirs.forEach(dir => {
  const path = 'courses/' + dir;
  if (!fs.existsSync(path) || !fs.statSync(path).isDirectory()) return;

  const files = fs.readdirSync(path).filter(f => f.endsWith('.json')).sort();
  const fileResults = [];

  files.forEach(f => {
    let data;
    try { data = JSON.parse(fs.readFileSync(path + '/' + f, 'utf8')); } catch (_) { return; }
    if (!Array.isArray(data)) return;

    let longest = 0, shortest = 0, total = 0;
    data.forEach(q => {
      if (!q.answer || !Array.isArray(q.options) || q.options.length !== 4) return;
      const lengths = q.options.map(wordCount);
      const answerLen = wordCount(q.answer);
      const minLen = Math.min(...lengths);
      const maxLen = Math.max(...lengths);
      const uniqueMin = lengths.filter(l => l === minLen).length === 1;
      const uniqueMax = lengths.filter(l => l === maxLen).length === 1;
      if (uniqueMin && answerLen === minLen) shortest++;
      else if (uniqueMax && answerLen === maxLen) longest++;
      total++;
    });

    if (total > 0) {
      grandTotalQ += total;
      grandTotalLongest += longest;
      grandTotalShortest += shortest;
      const longestPct = ((longest / total) * 100).toFixed(0);
      const shortestPct = ((shortest / total) * 100).toFixed(0);
      fileResults.push({
        file: f,
        total,
        longest,
        longestPct,
        shortest,
        shortestPct,
        flagged: longest > total / 2 || shortest > total / 2
      });
    }
  });

  if (fileResults.length > 0) {
    courseResults.push({ dir, fileResults });
  }
});

console.log('=== ANSWER LENGTH BIAS AUDIT (word-count) ===');
console.log(`Scanned ${grandTotalQ} questions across ${courseResults.length} courses.\n`);

console.log('--- Per-File Summary (flagged if >50% of questions have answer uniquely longest/shortest) ---');
console.log('');
courseResults.forEach(c => {
  const flagged = c.fileResults.filter(f => f.flagged);
  if (flagged.length > 0) {
    console.log(`  ${c.dir} — WARN: ${flagged.length} file(s) exceed 50% threshold`);
    flagged.forEach(f => {
      const reasons = [];
      if (f.longest > f.total / 2) reasons.push(`longest ${f.longest}/${f.total} (${f.longestPct}%)`);
      if (f.shortest > f.total / 2) reasons.push(`shortest ${f.shortest}/${f.total} (${f.shortestPct}%)`);
      console.log(`    ${f.file}: ${reasons.join(', ')}`);
    });
  } else {
    const allLongest = c.fileResults.reduce((s, f) => s + f.longest, 0);
    const allShortest = c.fileResults.reduce((s, f) => s + f.shortest, 0);
    const allTotal = c.fileResults.reduce((s, f) => s + f.total, 0);
    const pctLong = ((allLongest / allTotal) * 100).toFixed(1);
    const pctShort = ((allShortest / allTotal) * 100).toFixed(1);
    console.log(`  ${c.dir} — OK (longest ${allLongest}/${allTotal} = ${pctLong}%, shortest ${allShortest}/${allTotal} = ${pctShort}%)`);
  }
});

const grandPctLong = ((grandTotalLongest / grandTotalQ) * 100).toFixed(1);
const grandPctShort = ((grandTotalShortest / grandTotalQ) * 100).toFixed(1);
console.log(`\nTotal: ${grandTotalLongest}/${grandTotalQ} longest (${grandPctLong}%), ${grandTotalShortest}/${grandTotalQ} shortest (${grandPctShort}%)`);

const totalFlagged = courseResults.reduce((s, c) => s + c.fileResults.filter(f => f.flagged).length, 0);
console.log(`Files exceeding 50% threshold: ${totalFlagged}`);
process.exit(totalFlagged > 0 ? 1 : 0);
