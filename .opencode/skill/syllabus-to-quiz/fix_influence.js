const fs = require('fs');
const path = require('path');
const dir = 'courses/book-influence';
let changes = 0;

// Fix 001.json - difficulty labels for Q5, Q6, Q7, Q8
let f = JSON.parse(fs.readFileSync(dir + '/001.json', 'utf8'));
f[4].difficulty = 'medium'; // Reciprocity vs. Mere Exposure (compares 2 principles)
f[5].difficulty = 'medium'; // Defending Against Unwanted Reciprocity (applies defense)
f[6].difficulty = 'medium'; // Boundary Conditions of Reciprocity (analyzes limits)
f[7].difficulty = 'medium'; // Business Applications of Reciprocity (applies to domain)
fs.writeFileSync(dir + '/001.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
changes += 4;
console.log('001.json: fixed 4 difficulty labels');

// Fix 002.json - difficulty for Q6
f = JSON.parse(fs.readFileSync(dir + '/002.json', 'utf8'));
f[5].difficulty = 'medium'; // Consistency vs. Cognitive Dissonance (compares 2 concepts)
fs.writeFileSync(dir + '/002.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
changes++;
console.log('002.json: fixed 1 difficulty label');

// Fix 003.json - Q8: reframe to remove Authority (not taught until Ch4), and mark as hard
f = JSON.parse(fs.readFileSync(dir + '/003.json', 'utf8'));
// Reframe Q8: replace usher (authority) with an ordinary person - pure social proof concept
f[7] = {
  question: 'Competing Signals in Emergencies',
  content: 'In emergencies, social proof may suggest inaction (others are calm, so it must be fine). However, when one person defies the prevailing social proof and acts, it provides new social proof that action is appropriate, breaking the spell of pluralistic ignorance.',
  description: 'In a crowded theater, smoke appears near the exit. Most people stay seated, looking around. One audience member stands up and calmly says, "Everyone please move to the side exits." People begin moving. The switch from inaction to action is best explained by:',
  options: [
    'Social proof of inaction being replaced by social proof of action from the first mover',
    'The audience recognizing the smoke as a genuine emergency on their own',
    'Scarcity of time creating urgency to act regardless of the crowd',
    'Reciprocity toward the person who spoke up for being helpful'
  ],
  answer: 'Social proof of inaction being replaced by social proof of action from the first mover',
  explanation: 'Initially, social proof keeps everyone seated (others are calm, so it must be fine). But when one person acts, it provides new social proof that action is appropriate, breaking the pluralistic ignorance that kept everyone frozen. The first mover creates a new social proof signal that overrides the old one.',
  difficulty: 'hard'
};
fs.writeFileSync(dir + '/003.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
changes++;
console.log('003.json: reframed Q8 to remove authority reference, set to hard');

// Fix 005.json - Q7 difficulty
f = JSON.parse(fs.readFileSync(dir + '/005.json', 'utf8'));
f[6].difficulty = 'hard'; // Association or Evaluative Conditioning (synthesizes 2 concepts)
fs.writeFileSync(dir + '/005.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
changes++;
console.log('005.json: fixed 1 difficulty label');

// Fix 006.json - difficulty for Q1, Q4, Q6
f = JSON.parse(fs.readFileSync(dir + '/006.json', 'utf8'));
f[0].difficulty = 'easy'; // Scarcity Principle (intro term, should be easy)
f[3].difficulty = 'hard'; // Reactance or Scarcity? (synthesizes 2 concepts)
f[5].difficulty = 'easy'; // Psychological Reactance (intro term, should be easy)
fs.writeFileSync(dir + '/006.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
changes += 3;
console.log('006.json: fixed 3 difficulty labels');

// Fix 008.json - Q4 difficulty
f = JSON.parse(fs.readFileSync(dir + '/008.json', 'utf8'));
f[3].difficulty = 'hard'; // Priority of Principles (synthesizes across all 6)
fs.writeFileSync(dir + '/008.json', JSON.stringify(f, null, 2) + '\n', 'utf8');
changes++;
console.log('008.json: fixed 1 difficulty label');

console.log('\nTotal changes: ' + changes);
