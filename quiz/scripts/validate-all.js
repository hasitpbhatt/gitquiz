const fs = require('fs');
const REQUIRED_FIELDS = ['question', 'content', 'description', 'options', 'answer', 'explanation', 'difficulty'];

const listPath = 'courses/courses_list.txt';
if (!fs.existsSync(listPath)) {
  console.error('courses_list.txt not found — run this from the gitquiz root');
  process.exit(1);
}
const dirs = fs.readFileSync(listPath, 'utf8').trim().split(/\r?\n/).filter(Boolean);

let allOk = true, totalErrs = 0;

dirs.forEach(dir => {
  const path = 'courses/' + dir;
  if (!fs.existsSync(path) || !fs.statSync(path).isDirectory()) {
    console.log(dir + ': NOT FOUND');
    return;
  }
  const files = fs.readdirSync(path).filter(f => f.endsWith('.json')).sort();
  let total = 0, errs = [];

  files.forEach(f => {
    if (!f.match(/^\d{3}\.json$/)) errs.push(f + ': bad filename');
    let data;
    try { data = JSON.parse(fs.readFileSync(path + '/' + f, 'utf8')); } catch (e) {
      errs.push(f + ': PARSE ERROR - ' + e.message);
      return;
    }
    if (!Array.isArray(data)) { errs.push(f + ': not an array'); return; }
    if (data.length < 7 || data.length > 12) errs.push(f + ': ' + data.length + ' questions (need 7-12)');
    total += data.length;

    data.forEach((q, idx) => {
      const qi = idx + 1;
      REQUIRED_FIELDS.forEach(fld => {
        if (!(fld in q)) errs.push(f + ' Q' + qi + ': missing "' + fld + '"');
      });
      if (q.options) {
        if (!Array.isArray(q.options)) errs.push(f + ' Q' + qi + ': options not array');
        else if (q.options.length !== 4) errs.push(f + ' Q' + qi + ': ' + q.options.length + ' options');
        else q.options.forEach((o, i2) => {
          if (o.match(/(Both [A-D]\b|All of the above\b|[A-D]\s*&\s*[A-D]\b)/))
            errs.push(f + ' Q' + qi + ' Opt' + (i2+1) + ': positional ref: "' + o + '"');
        });
      }
      if (q.answer && q.options && Array.isArray(q.options) && !q.options.includes(q.answer))
        errs.push(f + ' Q' + qi + ': answer not in options. Answer="' + q.answer + '"');
    });
  });

  if (errs.length > 0) {
    allOk = false;
    totalErrs += errs.length;
    console.log('--- ' + dir + ' (' + files.length + ' files, ' + total + ' q) --- ERRORS:');
    errs.forEach(e => console.log('  ' + e));
  } else {
    console.log('--- ' + dir + ' (' + files.length + ' files, ' + total + ' q) --- OK');
  }
});

console.log('\n=== TOTAL ERRORS: ' + totalErrs + ' ===');
if (allOk) console.log('=== ALL CHECKS PASSED ===');
else process.exit(1);
