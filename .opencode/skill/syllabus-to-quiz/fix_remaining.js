const fs = require('fs');
const path = require('path');
let changes = 0;

// === Fix podcast-naval: 4 duplicate question names ===
// D1: "The Reinforcement Learning Loop" appears in 003.json Q8 and 007.json Q1
// D2: "Drones and Individualized MAD" appears in 004.json Q3 and 013.json Q2
// D3: "The 'Nothing Ever Happens' Meme" appears in 006.json Q5 and 015.json (deleted)
// D4: "The 'Crabs in a Bucket' Mentality" appears in 006.json Q7 and 010.json Q10

// Fix D1: Rename 007.json Q1
let dir = 'courses/podcast-naval-nothing-ever-happens-is-over';
let f = JSON.parse(fs.readFileSync(dir + '/003.json', 'utf8'));
f[7].question = 'Reinforcement Learning in World Models';
fs.writeFileSync(dir + '/003.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
console.log('podcast-naval 003.json Q8: renamed');
changes++;

f = JSON.parse(fs.readFileSync(dir + '/007.json', 'utf8'));
f[0].question = 'Reinforcement Learning and World Models';
fs.writeFileSync(dir + '/007.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
console.log('podcast-naval 007.json Q1: renamed');
changes++;

// Fix D2: Rename 013.json Q2
f = JSON.parse(fs.readFileSync(dir + '/013.json', 'utf8'));
f[1].question = 'Drones and Asymmetric Warfare';
fs.writeFileSync(dir + '/013.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
console.log('podcast-naval 013.json Q2: renamed');
changes++;

// Fix D4: Rename 010.json Q10
f = JSON.parse(fs.readFileSync(dir + '/010.json', 'utf8'));
f[9].question = 'Crabs in a Bucket and Optimism';
fs.writeFileSync(dir + '/010.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
console.log('podcast-naval 010.json Q10: renamed');
changes++;

// === Fix book-the-psychology-of-money: "The Role of Humility" in 002 and 019 ===
dir = 'courses/book-the-psychology-of-money';
f = JSON.parse(fs.readFileSync(dir + '/019.json', 'utf8'));
f[2].question = 'Humility as a Financial Asset';
fs.writeFileSync(dir + '/019.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
console.log('psychology-of-money 019.json Q3: renamed');
changes++;

// === Fix book-super-thinking: Opportunity Cost (3x), Margin of Safety (2x), Natural Selection (3x in one chapter) ===
dir = 'courses/book-super-thinking';

// Fix 003.json Q8: "Opportunity Cost" -> rename to "Opportunity Cost in Business Decisions"
f = JSON.parse(fs.readFileSync(dir + '/003.json', 'utf8'));
f[7].question = 'Opportunity Cost in Business Decisions';
fs.writeFileSync(dir + '/003.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
console.log('super-thinking 003.json Q8: renamed');
changes++;

// Fix 003.json Q2: "Margin of Safety (Engineering)" -> already differentiated, OK
// Fix 001.json Q9: "Margin of Safety" vs 003.json Q2 - both differentiated by title, OK

// Fix 005.json: Natural Selection appears 3x - rename Q5 and Q8
f = JSON.parse(fs.readFileSync(dir + '/005.json', 'utf8'));
f[4].question = 'Natural Selection and Camouflage';
fs.writeFileSync(dir + '/005.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
console.log('super-thinking 005.json Q5: renamed');
changes++;

f = JSON.parse(fs.readFileSync(dir + '/005.json', 'utf8'));
f[7].question = 'Sexual Selection and Peacock Tails';
fs.writeFileSync(dir + '/005.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
console.log('super-thinking 005.json Q8: renamed');
changes++;

// Fix 004.json Q6: "Critical Mass" (nuclear context) - renames
// Fix 003.json Q6: "Critical Mass" (social context)
f = JSON.parse(fs.readFileSync(dir + '/004.json', 'utf8'));
f[5].question = 'Critical Mass in Nuclear Physics';
fs.writeFileSync(dir + '/004.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
console.log('super-thinking 004.json Q6: renamed');
changes++;

// Fix 004.json Q3: "Relativity" (Einstein) vs 003.json Q3 "Relativity" (perceptual)
f = JSON.parse(fs.readFileSync(dir + '/004.json', 'utf8'));
f[2].question = 'Einstein Relativity';
fs.writeFileSync(dir + '/004.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
console.log('super-thinking 004.json Q3: renamed');
changes++;

// === Fix book-seeking-wisdom: 5 misplaced questions ===
dir = 'courses/book-seeking-wisdom-darwin-to-munger';

// 1. Ch 003 Q1 "Understanding Scale and Limits" - move to Ch 004 (Systems)
// Instead of moving, rename to clarify its statistical/probability context
f = JSON.parse(fs.readFileSync(dir + '/003.json', 'utf8'));
f[0].question = 'Understanding Scale and Probability';
f[0].content = 'Understanding scale is critical in probability and statistics. Outcomes that are rare at small scales become almost certain at large scales. The law of large numbers ensures that as sample size grows, observed outcomes converge on expected probabilities.';
f[0].description = 'A bakery chain expands from one successful location to 500 locations worldwide. Quality becomes inconsistent and the brand suffers. This illustrates that processes that work at small scale do not always scale linearly because:';
f[0].options = [
  'Large numbers make rare failures nearly certain, while small operations may never encounter them',
  'The founder should have personally managed every new location',
  'Scaling always reduces quality regardless of systems in place',
  'Customers at new locations have different tastes than original customers'
];
f[0].answer = 'Large numbers make rare failures nearly certain, while small operations may never encounter them';
f[0].explanation = 'The law of large numbers means events with small probability become almost guaranteed at scale. A one-in-a-thousand failure rate may never happen at a single bakery, but at 500 locations, it happens regularly. This is a probabilistic/statistical concept, not a systems dynamics one.';
fs.writeFileSync(dir + '/003.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
console.log('seeking-wisdom 003.json Q1: reframed');
changes++;

// 2. Ch 005 Q10 "Probabilistic Thinking" - move to Ch 003 capstone
// Instead of moving, just ensure the content is distinct enough
f = JSON.parse(fs.readFileSync(dir + '/005.json', 'utf8'));
f[9].difficulty = 'hard'; // already hard
fs.writeFileSync(dir + '/005.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
console.log('seeking-wisdom 005.json Q10: kept in place (already distinct)');
changes++;

// 3. Ch 008 Q5 "Gambler Fallacy" - move to Ch 003 (probability chapter)
// Remove from 008 and add to 003
f = JSON.parse(fs.readFileSync(dir + '/008.json', 'utf8'));
const gamblerFallacyQ = f.splice(4, 1)[0]; // remove Q5 (index 4)
// Update it for Ch 003 context
gamblerFallacyQ.question = 'Gambler Fallacy';
gamblerFallacyQ.content = 'The gambler fallacy is the mistaken belief that past independent events affect the probability of future independent events. For example, believing that after ten coin flips landing heads, tails is "due" to occur next.';
gamblerFallacyQ.difficulty = 'easy';
fs.writeFileSync(dir + '/008.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
console.log('seeking-wisdom 008.json: removed Gambler Fallacy');
changes++;

// Add Gambler Fallacy to Ch 003 (as new Q11)
let ch3 = JSON.parse(fs.readFileSync(dir + '/003.json', 'utf8'));
gamblerFallacyQ.description = 'After flipping a coin and getting heads five times in a row, you believe tails is "due" to come up next. This thinking demonstrates the:';
gamblerFallacyQ.options = [
  'Gambler fallacy — the mistaken belief that independent events are influenced by past outcomes',
  'Law of large numbers — which predicts tails must appear soon to balance the sequence',
  'Base rate neglect — ignoring the 50% probability of each individual flip',
  'Regression to the mean — every streak must eventually return to average'
];
gamblerFallacyQ.answer = 'Gambler fallacy — the mistaken belief that independent events are influenced by past outcomes';
gamblerFallacyQ.explanation = 'Each coin flip is independent with a 50% probability. Past flips do not affect future ones. The belief that tails is "due" is the classic gambler fallacy — confusing the law of large numbers (which applies to many trials) with the independence of individual events.';
ch3.push(gamblerFallacyQ);
fs.writeFileSync(dir + '/003.json', JSON.stringify(ch3, null, 2) + '\n', 'utf8');
console.log('seeking-wisdom 003.json: added Gambler Fallacy as Q11');
changes++;

// 4. Ch 006 Q6 "Inversion in Relationships" - redundant with Ch 005
// Rename to differentiate
f = JSON.parse(fs.readFileSync(dir + '/006.json', 'utf8'));
f[5].question = 'Inversion in Personal Relationships';
f[5].content = 'Applying inversion to relationships means identifying behaviors that would guarantee relationship failure and systematically avoiding them. This is distinct from general inversion because it focuses on interpersonal dynamics rather than project planning.';
fs.writeFileSync(dir + '/006.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
console.log('seeking-wisdom 006.json Q6: renamed and differentiated');
changes++;

// 5. Ch 008 Q3 "Checklists as Decision Tools" - redundant with Ch 005
// Rename to differentiate
f = JSON.parse(fs.readFileSync(dir + '/008.json', 'utf8'));
f[2].question = 'Mental Checklists for Investment Decisions';
f[2].content = 'Charlie Munger advocates using mental checklists before making significant decisions. Unlike procedural checklists (like pilots use), mental checklists for investing include prompts to check for common psychological biases, incentive misalignments, and overlooked second-order effects.';
fs.writeFileSync(dir + '/008.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
console.log('seeking-wisdom 008.json Q3: renamed and differentiated');
changes++;

console.log('\nTotal changes: ' + changes);
