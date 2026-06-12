const fs = require('fs');

const listPath = 'courses/courses_list.txt';
if (!fs.existsSync(listPath)) {
  console.error('courses_list.txt not found — run this from the gitquiz root');
  process.exit(1);
}
const dirs = fs.readFileSync(listPath, 'utf8').trim().split(/\r?\n/).filter(Boolean);

let grandTotalQ = 0, grandTotalBiased = 0;
const courseResults = [];

dirs.forEach(dir => {
  const path = 'courses/' + dir;
  if (!fs.existsSync(path) || !fs.statSync(path).isDirectory()) return;

  const files = fs.readdirSync(path).filter(f => f.endsWith('.json')).sort();
  let totalQ = 0, biasedQ = 0, sumDiff = 0, maxDiff = 0;
  const flagged = [];

  files.forEach(f => {
    let data;
    try { data = JSON.parse(fs.readFileSync(path + '/' + f, 'utf8')); } catch (_) { return; }
    if (!Array.isArray(data)) return;
    totalQ += data.length;

    data.forEach((q, idx) => {
      if (!q.answer || !Array.isArray(q.options) || q.options.length !== 4) return;
      const answerLen = q.answer.length;
      const otherLens = q.options.filter(o => o !== q.answer).map(o => o.length);
      if (otherLens.length !== 3) return;

      const otherMax = Math.max(...otherLens);
      const otherMean = otherLens.reduce((a, b) => a + b, 0) / 3;
      const diff = answerLen - otherMean;

      if (diff > maxDiff) maxDiff = diff;
      sumDiff += diff;

      if (answerLen > 60 && answerLen > otherMax * 1.5 && answerLen > otherMean + 50) {
        biasedQ++;
        flagged.push({
          file: f,
          qi: idx + 1,
          question: q.question || '(untitled)',
          lengths: q.options.map(o => o.length),
          answerLen,
          otherMax,
          otherMean: otherMean.toFixed(0),
          diff: diff.toFixed(0),
          answerPreview: q.answer.length > 60 ? q.answer.slice(0, 57) + '...' : q.answer
        });
      }
    });
  });

  if (totalQ > 0) {
    const pct = ((biasedQ / totalQ) * 100).toFixed(1);
    const avgDiff = (sumDiff / totalQ).toFixed(1);
    courseResults.push({ dir, totalQ, biasedQ, pct, avgDiff, maxDiff: maxDiff.toFixed(0), flagged });
    grandTotalQ += totalQ;
    grandTotalBiased += biasedQ;
  }
});

console.log('=== ANSWER LENGTH BIAS AUDIT ===');
console.log(`Scanned ${grandTotalQ} questions across ${courseResults.length} courses.\n`);

console.log('--- Per-Course Summary ---');
console.log('Course'.padEnd(50) + 'Qs'.padEnd(6) + 'Biased'.padEnd(8) + '%'.padEnd(8) + 'AvgΔ'.padEnd(8) + 'MaxΔ');
console.log('-'.repeat(80));
courseResults.sort((a, b) => b.pct - a.pct || b.biasedQ - a.biasedQ).forEach(c => {
  const name = (c.dir.length > 47 ? c.dir.slice(0, 44) + '...' : c.dir).padEnd(50);
  console.log(`${name}${String(c.totalQ).padEnd(6)}${String(c.biasedQ).padEnd(8)}${c.pct.padEnd(8)}${c.avgDiff.padEnd(8)}${c.maxDiff}`);
});

console.log(`\nTotal: ${grandTotalBiased}/${grandTotalQ} biased (${((grandTotalBiased / grandTotalQ) * 100).toFixed(1)}%)`);

const totalFlagged = courseResults.reduce((s, c) => s + c.flagged.length, 0);
if (totalFlagged > 0) {
  console.log(`\n--- Flagged Questions (${totalFlagged}) ---`);
  courseResults.forEach(c => {
    if (c.flagged.length === 0) return;
    console.log(`\n  ${c.dir}:`);
    c.flagged.forEach(q => {
      console.log(`    ${q.file} Q${q.qi} — "${q.question}"`);
      console.log(`      Answer length: ${q.answerLen} | Option lengths: ${q.lengths.join(', ')}`);
      console.log(`      Bias: +${q.diff} chars vs mean | "${q.answerPreview}"`);
    });
  });
} else {
  console.log('\n--- No questions exceed the bias threshold ---');
}

process.exit(0);
