const fs = require('fs');
const path = require('path');
const DIR = 'courses/course-identifier';

// Map of file -> { existing_question_name -> replacement_question_data }
const replacements = {
  // '001.json': {
  //   'Existing Question Name': {
  //     "question": "New Hard Question Name",
  //     "content": "Brief explanation distinguishing the competing principles or testing the boundary.",
  //     "description": "Scenario where two principles seem to apply or the boundary is tested.",
  //     "options": [
  //       "Plausible but wrong — uses adjacent concept buzzwords (trapdoor)",
  //       "Plausible but wrong — describes related but different mechanism",
  //       "Correct — captures the subtle distinction or boundary condition",
  //       "Plausible but wrong — sounds right at first glance"
  //     ],
  //     "answer": "Correct — captures the subtle distinction or boundary condition",
  //     "explanation": "Why this answer is correct and why each distractor is wrong."
  //   }
  // }
};

const files = Object.keys(replacements);
files.forEach(file => {
  const filePath = path.join(DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let replaced = 0;
  const newData = data.map(q => {
    if (replacements[file][q.question]) {
      replaced++;
      return replacements[file][q.question];
    }
    return q;
  });
  fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), 'utf8');
  console.log(file + ': ' + data.length + ' questions, ' + replaced + ' replaced');
});
console.log('Done — ' + files.length + ' files processed.');
